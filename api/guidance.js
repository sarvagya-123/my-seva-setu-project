const stages = new Set(["triage", "documents", "field", "decision"]);
const categories = new Set(["water", "road", "waste", "streetlight"]);
const languages = new Set(["hi", "en"]);

function respond(res, status, body) {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return respond(res, 405, { error: "Method not allowed." });
  }

  if (process.env.AI_ENABLED !== "true" || !process.env.GEMINI_API_KEY) {
    return respond(res, 503, { error: "AI guidance is not configured.", fallback: true });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return respond(res, 400, { error: "Request body must be valid JSON." });
    }
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !stages.has(body.stage) ||
    !categories.has(body.category) ||
    !languages.has(body.language)
  ) {
    return respond(res, 400, { error: "A valid workflow stage and service category are required." });
  }

  const prompt = [
    "Give a concise field-officer checklist (3 to 5 bullet points) for a civic grievance.",
    `Workflow stage: ${body.stage}.`,
    `Service category: ${body.category}.`,
    `Respond in ${body.language === "hi" ? "Hindi" : "English"}.`,
    "Do not invent local laws, deadlines, eligibility rules, or facts.",
    "Ask for only necessary information, protect resident privacy, and keep the final decision with the officer.",
  ].join(" ");

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        signal: AbortSignal.timeout(12_000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
        }),
      },
    );

    if (!response.ok) {
      console.error("Gemini guidance request failed with status", response.status);
      return respond(res, 502, { error: "AI guidance is temporarily unavailable.", fallback: true });
    }

    const result = await response.json();
    const guidance = result?.candidates?.[0]?.content?.parts
      ?.map((part) => typeof part.text === "string" ? part.text : "")
      .join("\n")
      .trim();

    if (!guidance) {
      console.error("Gemini returned an empty guidance response.");
      return respond(res, 502, { error: "AI guidance returned no usable text.", fallback: true });
    }

    return respond(res, 200, { guidance, source: "gemini" });
  } catch (error) {
    console.error("Gemini guidance request could not be completed.", error);
    return respond(res, 502, { error: "AI guidance is temporarily unavailable.", fallback: true });
  }
}
