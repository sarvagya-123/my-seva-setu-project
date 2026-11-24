# Seva Setu (सेवा सेतु)

**A Hindi-first, mobile-friendly ward-office workflow for handling local civic-service applications.**

Seva Setu gives a field officer one place to see what needs attention, verify supporting information, record a field check, and make the final decision. The sample service areas are water supply, roads, waste collection, and streetlights. Interface language and application guidance are available in Hindi, with an English toggle.

> **Prototype notice:** This repository is a reviewable, single-browser demonstration—not an official municipal service or a production case-management system. All sample residents and records are fictional. Do not enter real resident information.

## Assignment reviewer: quick start

1. Open the deployed project URL supplied with the submission. For a local review, follow [Run and test locally](#run-and-test-locally).
2. Sign in with the public demo account below (or choose **Use demo account** on the login screen):
   - **Email:** `officer@sevasetu.demo`
   - **Password:** `Seva@123`
3. Open **Applications** to review the sample cases, use the Hindi/English toggle, try the step guide and resident-ready update, and advance a case. Use **Reset demo data** afterward to restore the original records.

The GitHub repository URL and live URL are not known until you publish and deploy this project. Include the actual URLs in your assignment submission after deployment; do not present a localhost URL as the live site.

## Contents

- [The problem and the proposed workflow](#the-problem-and-the-proposed-workflow)
- [What is included](#what-is-included)
- [What is deliberately not included](#what-is-deliberately-not-included)
- [Run and test locally](#run-and-test-locally)
- [Demo sign-in](#demo-sign-in)
- [Using the application](#using-the-application)
- [AI assistance and privacy](#ai-assistance-and-privacy)
- [The extra feature: resident-ready status updates](#the-extra-feature-resident-ready-status-updates)
- [Measuring whether it helps](#measuring-whether-it-helps)
- [Technical design](#technical-design)
- [Deploying a demo](#deploying-a-demo)
- [Before any real-world use](#before-any-real-world-use)

## The problem and the proposed workflow

Ward-level services are often coordinated across paper records, phone calls, and staff handoffs. An officer needs to quickly understand **which application is urgent, what has already been checked, what is missing, what the next action is, and who made the last decision**.

The demonstration uses a four-stage, auditable workflow:

1. **Received:** Triage the reported issue and confirm that the location and category are understandable. Residents should be able to report a civic issue without first producing unnecessary identity documents.
2. **Document review:** Compare any available evidence with the reported issue. When information is genuinely missing, return the application with a specific, recorded reason.
3. **Field verification:** Record whether a visit or independent check confirmed the reported issue. Gather only evidence needed for the service.
4. **Officer decision:** An officer approves a verified resolution, returns the application for more information, or rejects it with a recorded reason. Guidance never makes the decision.

The prototype has six fictional example applications in different stages. It is an **officer-side workflow demo**: it does not provide a public complaint-intake form or let reviewers create new applications.

## What is included

- A responsive Hindi-first dashboard with an English-language toggle.
- A work queue showing application ID, resident, issue, ward, stage, priority, and deadline.
- Search over application IDs, resident names, issue descriptions, and ward names in both supported UI languages.
- Filters for all, active, and completed cases; the overview queue prioritises urgent cases and then approaching deadlines.
- A detail view with a four-step progress indicator, evidence checklist, resident/contact summary, and reverse-chronological case history.
- Document review, field verification, and officer decision actions. Proceeding past visibly missing evidence requires a reason; field verification and final approval require a recorded note; returning or rejecting requires a reason and confirmation.
- Return-and-resume behavior: a returned application remembers the stage it was in and resumes there rather than silently restarting the workflow.
- Case status and history persist in browser `localStorage`, so a reviewer can reload and continue on the same browser.
- A service summary with counts by issue category and an overall resolution ratio for the demo cases.
- A stage-specific field guide available without an AI account or network request.
- The extra resident-update feature described below.

## What is deliberately not included

This is a functioning **single-browser prototype**, not a shared or authoritative government record. It has no production authentication or roles, server-side database, applicant portal, file upload, actual document verification, resident notifications, or audit trail protected from browser edits. Sample checklist entries are illustrative—not uploaded files or verified official evidence. Data in local storage belongs to that browser only and is not shared with another officer or device.

The login is a demo gate, not security. The example dates and service deadlines are fixed sample values, not an adopted service-level agreement. Do not use the interface to make or communicate a real eligibility, legal, safety, or benefits decision.

## Run and test locally

Requirements: **Node.js 20+** and npm.

```bash
npm install
npm run dev
```

Open the localhost URL printed by Vite. The built-in field guide works offline; no API key or environment variable is needed.

Run the automated serverless-endpoint tests and TypeScript/production build:

```bash
npm test
npm run build
npm run preview
```

`npm test` uses Node's built-in test runner. The guidance endpoint tests cover method and input validation, disabled-AI behavior, Hindi responses, the limited upstream payload, and provider-error fallbacks. `npm run build` runs the TypeScript project checks before creating the static frontend in `dist/`.

## Demo sign-in

- **Email:** `officer@sevasetu.demo`
- **Password:** `Seva@123`

These are public demo credentials, not private or production credentials. The sign-in state is stored in this browser. Use **Reset demo data** to restore the fictional sample applications; clearing this site's browser storage also resets the local session and sample workflow changes.

## Using the application

1. Sign in using the demo account or the **Use demo account** button.
2. Start on **Summary** to see open cases, approaching deadlines, cases awaiting a decision, and the prioritised queue.
3. Open **Applications** to filter or search. Select a row to inspect evidence, progress, history, and the current action.
4. Request the stage guide if needed. The default local guide is immediately available and does not send application data.
5. Advance a case through document review and field verification. At the decision stage, approve, return with a note, or reject with a note.
6. Open **Reports** for the sample category and resolution summaries. Use the language control to switch between Hindi and English.

The return action preserves the earlier stage. The officer can resume that stage after information is received, or record a decision at the decision stage. Confirm dialogs protect the final approval and rejection actions; history makes actions visible after a refresh.

## AI assistance and privacy

The default field guide is a set of built-in, stage-specific checklists. It is explicitly labeled as a local guide; using it does **not** make a request to an AI service.

An optional Vercel serverless function at `api/guidance.js` can request a concise Gemini checklist. The function accepts only a validated workflow stage, service category, and interface language. It does not receive names, phone numbers, ward descriptions, resident statements, notes, or documents. The Gemini key is read only by the serverless function and must never be placed in frontend code or committed.

The client uses the built-in guide by default. To enable the optional integration on Vercel, configure:

| Variable | Where | Value |
|---|---|---|
| `VITE_AI_ENABLED` | Vercel build environment | `true` |
| `AI_ENABLED` | Vercel serverless-function environment | `true` |
| `GEMINI_API_KEY` | Vercel serverless-function environment only | Your provider key |

If the endpoint is disabled, missing, or unavailable, the UI uses the built-in checklist instead. Provider responses are generic guidance—not verified local policy. Officers must check applicable procedures and retain control over every decision. Set provider spending limits before enabling the integration. A local `vite` development server does not run Vercel serverless functions; local development therefore uses the built-in guide.

An `.env.example` lists variable names only. Never put a real key in that file, the repository, a browser variable, or a screenshot.

## The extra feature: resident-ready status updates

The case detail view includes a **Resident status update** with a Hindi- or English-language summary, the application ID, current status, next step, and recorded service deadline. The officer can copy it for an existing communication channel.

The update deliberately omits the resident's name, phone number, and complaint description, so it is safer to forward and quick to prepare. It is **not sent automatically**: the copied text says so, and the interface does not claim that a message was delivered. If the browser does not allow clipboard access, the full message remains visible for manual selection and copying.

This feature is intended to make progress easier to explain and may reduce “what is happening with my case?” follow-ups. Its impact should be measured in a real, consented pilot—not assumed from the demo.

## Measuring whether it helps

Establish a baseline before a ward pilot, then compare the same measures after introducing the workflow:

- Median time from receipt to first review and resolution.
- Percentage resolved within a locally approved service deadline.
- Age and count of overdue cases, split by service category.
- Number of handoffs and returns for missing information.
- Percentage of field checks and final decisions with a recorded reason.
- Officer time per case and resident follow-up enquiries.
- Resident-reported clarity and satisfaction, with accessible feedback options.

Review the quality of verification and resident outcomes alongside speed; faster closures alone are not evidence of improvement. Agree the meaning of each metric and the service deadlines with the responsible office before collecting real operational data.

## Technical design

- **Frontend:** React 18, TypeScript, Vite, and plain CSS. No component or chart framework is required.
- **Workflow model:** a typed `Status` union and sample `CaseRecord` objects in `src/App.tsx`; explicit state transitions add timestamped history entries.
- **Persistence:** browser `localStorage` for the demo. Stored case data is schema-checked on load, writes report storage errors to the interface, and changes survive refresh in the same browser. New history timestamps use ISO values and are formatted for the selected language; older saved entries retain their recorded display text.
- **Localization:** parallel Hindi and English UI strings, Hindi and English sample issue text and ward names, locale-aware dates, and a matching document language declaration.
- **Field guide:** local checklists are the dependable no-key path. The optional `api/guidance.js` serverless endpoint validates requests, limits its upstream context, times out, and returns a fallback-friendly error for the UI.
- **Status sharing:** generates text from the current status without adding names or contact data, then uses the browser clipboard only after an officer clicks the copy action.
- **Tests:** `tests/guidance.test.js` runs against the endpoint handler with a mocked provider; no real API key or external request is needed.

## Deploying a demo

**Vercel is the simplest deployment target** because it can host both the Vite frontend and `api/guidance.js`.

1. Push the repository to GitHub and import it into Vercel.
2. Use the project root as the Vercel root directory.
3. Set the build command to `npm run build`; Vercel detects the static output in `dist`.
4. Deploy with AI disabled first. Confirm the login, workflow, and built-in guide on the public preview.
5. If you choose to test connected guidance, add the three server-side/client-build variables in the [AI assistance and privacy](#ai-assistance-and-privacy) section, redeploy, and verify that the browser never receives the Gemini key.

The static frontend can also be hosted without the AI endpoint on any static host that serves the `dist` directory. On static-only hosting, connected guidance is unavailable and the local guide remains usable. A static demo is not appropriate for real resident records.

## Before any real-world use

A production service would need, at minimum, an approved operating procedure and service deadlines; a secured shared database and backups; verified staff identity, least-privilege access and audit controls; encrypted transport and retention rules; accessible citizen intake and status channels; secure evidence upload and review; incident response; and a privacy/legal assessment. Any AI feature would require an approved provider, data-processing review, source-grounded local guidance, monitoring, and meaningful human oversight.
