# AI Summary Release Gate

A small, local-only demonstration of a release gate for an AI-assisted support-ticket summary feature. The dashboard uses synthetic ticket data; Playwright intercepts the service boundary, so no AI provider, credentials, network service, or paid account is needed.

## Requirements

- Node.js 20+
- npm
- Chromium (installed by the browser setup command below)

## Setup and passing run

```bash
npm install
npx playwright install chromium
npm test
```

`npm test` runs deterministic evaluation tests, followed by the Playwright browser suite. To run each stage:

```bash
npm run test:unit
npm run build
npm run test:e2e
npm run dev
```

Open the local Vite URL printed by `npm run dev`.

## Design and test boundary

- **UI / browser contract:** Playwright verifies the user-visible states, retry interaction, and whether approval is enabled. Each test owns its own browser context and installs its own route handler; no shared mutable test server or ticket state is used. `fullyParallel` is enabled.
- **Service boundary:** Tests intercept `POST /api/tickets/T-100/summary` and return deterministic success, insufficient-information, 503, or deliberately invalid payloads. This isolates UI behavior from provider availability.
- **Summary evaluation:** `evaluateSummary` is a pure deterministic function. It requires non-empty wording, at least one citation, all citations to belong to the current ticket, and rejects email/phone-like contact data. The same validation is applied before enabling approval in the UI.
- **What is not tested here:** The suite does not prove that an LLM's summary is factually correct, complete, unbiased, or semantically entailed by its cited messages. Those require a separate evaluation layer and representative model outputs.

## Release-blocking criteria

The GitHub Actions `quality-gate` job is required to pass before merge/release:

1. Unit evaluation tests pass.
2. TypeScript production build succeeds.
3. All Playwright release scenarios pass.

Any failure blocks the job. CI retries Playwright once to reduce transient infrastructure noise, but a persistent failure still fails the job. Browser traces, screenshots, video (on failure), and the HTML report are uploaded even after failure for 14 days. Configure branch protection to require the **Unit, build and browser release gate** status check.

## Intentional regression exercise

To demonstrate that the gate catches a defect:

1. Open `src/summaryRules.ts`.
2. Temporarily change `if (ids.length === 0)` to `if (ids.length < 0)`.
3. Run `npm run test:unit`. The missing-citation evaluation test fails.
4. Restore the original condition and run `npm test` to confirm the passing state.

For a UI-only regression, temporarily change `const canApprove = view === "success" && evaluation.eligible && !approved;` to `const canApprove = view === "success" && !approved;`. The cross-ticket-citation browser test should fail because approval becomes enabled.

## Deterministic evaluation: scope and next steps

The current checks establish basic eligibility invariants and a simple privacy-risk guard; they are not an LLM quality benchmark. Against a live model, I would separately test:
- semantic support: each material claim is entailed by the cited messages;
- omission and contradiction rates against human-reviewed reference summaries;
- hallucination, uncertainty handling, and correct abstention on insufficient evidence;
- prompt injection in ticket content and cross-ticket data leakage;
- PII detection with a broader classifier/rule set and approved redaction policy;
- model/version drift across a curated, de-identified evaluation set, with thresholds and human review for borderline cases.

I would also add API contract/schema validation at the service adapter and accessibility checks for the approval workflow.

## AI tooling and verification

AI assistance may be used to scaffold repetitive project structure and test cases. The important verification is executable: inspect the generated code, run the unit suite, production build, and browser tests locally, and deliberately introduce the regressions above to confirm the expected tests fail. No AI-generated result is treated as evidence until these checks pass.
