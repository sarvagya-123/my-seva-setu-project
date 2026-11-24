import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import handler from "../api/guidance.js";

const originalFetch = globalThis.fetch;
const originalAiEnabled = process.env.AI_ENABLED;
const originalApiKey = process.env.GEMINI_API_KEY;

function createResponse() {
  return {
    statusCode: 0,
    headers: {},
    body: undefined,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

beforeEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.AI_ENABLED;
  delete process.env.GEMINI_API_KEY;
});

after(() => {
  globalThis.fetch = originalFetch;
  if (originalAiEnabled === undefined) delete process.env.AI_ENABLED;
  else process.env.AI_ENABLED = originalAiEnabled;
  if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = originalApiKey;
});

test("rejects methods other than POST", async () => {
  const res = createResponse();
  await handler({ method: "GET" }, res);

  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, "POST");
  assert.equal(res.headers["Cache-Control"], "no-store");
});

test("uses a safe offline fallback when connected AI is disabled", async () => {
  const res = createResponse();
  await handler(
    { method: "POST", body: { stage: "field", category: "road", language: "hi" } },
    res,
  );

  assert.equal(res.statusCode, 503);
  assert.equal(res.body.fallback, true);
});

test("rejects malformed JSON and unsupported workflow inputs", async () => {
  process.env.AI_ENABLED = "true";
  process.env.GEMINI_API_KEY = "test-key-not-used-on-the-network";
  const cases = [
    { body: "{invalid", description: "malformed JSON" },
    { body: { stage: "unknown", category: "road", language: "hi" }, description: "stage" },
    { body: { stage: "field", category: "other", language: "hi" }, description: "category" },
    { body: { stage: "field", category: "road", language: "kn" }, description: "language" },
  ];

  for (const { body, description } of cases) {
    const res = createResponse();
    await handler({ method: "POST", body }, res);
    assert.equal(res.statusCode, 400, `Expected invalid ${description} to be rejected`);
  }
});

test("sends only stage, category, and language and returns Hindi guidance", async () => {
  process.env.AI_ENABLED = "true";
  process.env.GEMINI_API_KEY = "test-key-not-used-on-the-network";
  let upstream;
  globalThis.fetch = async (url, options) => {
    upstream = { url, options, body: JSON.parse(options.body) };
    return {
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: "स्थल-जाँच करें।" }] } }],
      }),
    };
  };

  const res = createResponse();
  await handler(
    {
      method: "POST",
      body: { stage: "field", category: "road", language: "hi" },
    },
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { guidance: "स्थल-जाँच करें।", source: "gemini" });
  assert.match(upstream.url, /generativelanguage\.googleapis\.com/);
  assert.match(upstream.options.headers["x-goog-api-key"], /test-key/);
  assert.match(upstream.body.contents[0].parts[0].text, /Respond in Hindi/);
  const serializedRequest = JSON.stringify(upstream.body);
  assert.doesNotMatch(serializedRequest, /Lakshmi Narayan|•••• •• 4821|11th Main Road/i);
});

test("falls back cleanly when Gemini returns an error", async () => {
  process.env.AI_ENABLED = "true";
  process.env.GEMINI_API_KEY = "test-key-not-used-on-the-network";
  globalThis.fetch = async () => ({ ok: false, status: 429 });
  const res = createResponse();
  await handler(
    { method: "POST", body: { stage: "decision", category: "water", language: "en" } },
    res,
  );
  assert.equal(res.statusCode, 502);
  assert.equal(res.body.fallback, true);
});

test("falls back cleanly when Gemini returns no usable text", async () => {
  process.env.AI_ENABLED = "true";
  process.env.GEMINI_API_KEY = "test-key-not-used-on-the-network";
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ candidates: [] }),
  });
  const res = createResponse();
  await handler(
    { method: "POST", body: { stage: "triage", category: "waste", language: "hi" } },
    res,
  );
  assert.equal(res.statusCode, 502);
  assert.equal(res.body.fallback, true);
});
