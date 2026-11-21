# AI Quality Assurance Release Gate

A small QA project built to demonstrate how I would validate an AI-generated support-ticket summary before allowing a user to approve it.

The application generates a summary from synthetic ticket data and checks whether the response meets basic quality requirements. It combines deterministic evaluation rules, React, TypeScript, Vitest, Playwright and GitHub Actions.

The AI service is mocked, so the project runs locally without an API key, external AI provider or paid service.

## Tech Stack

- React and TypeScript
- Vite
- Vitest for unit testing
- Playwright for browser automation
- GitHub Actions for CI
- Deterministic structural and semantic evaluation rules

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm
- Git

### Installation

Clone the repository:

```bash
git clone https://github.com/jitsinghsdet/ai-quality-assurance-gate.git
cd ai-quality-assurance-gate
```

Install dependencies and the Playwright browser:

```bash
npm ci
npx playwright install chromium
```

### Run the application

```bash
npm run dev
```

Open the local URL printed in the terminal.

## Running the Tests

Run the unit tests:

```bash
npm run test:unit
```

Run the production build:

```bash
npm run build
```

Run the Playwright browser tests:

```bash
npm run test:e2e
```

Run the complete test suite:

```bash
npm test
```

The current test suite contains:

| Test area | Tests |
|---|---:|
| Structural evaluation | Included in unit suite |
| Semantic evaluation | Included in unit suite |
| Combined release-gate evaluation | Included in unit suite |
| Total unit tests | 22 |
| Playwright E2E tests | 5 |
| Total automated tests | 27 |

These are the results from the current local test suite. The CI workflow also runs the unit tests, production build and browser tests independently.

## What the Release Gate Validates

The application evaluates a summary before allowing approval.

### 1. Structural validation

The structural evaluator checks that:

- The summary is not empty.
- At least one source citation is provided.
- Source IDs have a valid format.
- Duplicate citations are rejected.
- Every citation belongs to the current ticket.
- Email addresses and phone-like information are flagged.

### 2. Semantic validation

The semantic evaluator checks selected claims against the messages cited by the summary.

It currently uses deterministic rules for known scenarios, including reset-link expiration, payment gateway outages, account lockouts and repeated failed login attempts.

These rules demonstrate how unsupported claims can be caught before approval. They are not a general-purpose hallucination detector or a substitute for evaluating a real language model.

### 3. Combined release-gate decision

The release-gate evaluator combines structural and semantic results.

A summary is eligible for approval only when it passes the required checks. Otherwise, the application displays the validation reasons and keeps approval disabled.

## Test Design

I kept the browser tests independent of an external AI service.

Playwright intercepts:

```text
POST /api/tickets/T-100/summary
```

The tests provide controlled responses for:

- Successful summary generation.
- Insufficient information.
- Service unavailable (503) followed by retry.
- Invalid or cross-ticket citations.
- Semantically unsupported claims.

The browser tests cover the user-visible workflow, while Vitest tests the evaluation functions and their combined release-gate behavior.

Each Playwright test uses its own browser context and route handler to avoid shared test state.

## CI Pipeline and Release-Blocking Criteria

GitHub Actions runs the quality gate on pull requests, pushes to `main` and manual workflow dispatch.

The workflow executes:

1. Dependency installation using `npm ci`.
2. Structural, semantic and release-gate unit tests.
3. TypeScript compilation and production build.
4. Playwright browser tests.
5. Upload of Playwright test evidence.

The required GitHub Actions check is:

```text
AI Quality Release Gate / AI Summary Quality Gate
```

A pull request must pass the required check before it can be merged into the protected `main` branch.

The release is blocked if:

- Any required unit test fails.
- The production build fails.
- Any required Playwright release test fails.

Playwright reports and available test evidence are retained as workflow artifacts for troubleshooting.

## Intentional Regression Test

I also tested whether the release gate could catch a deliberately introduced defect.

The scenario was simple: a summary contained a citation from another ticket, but the evaluator was temporarily changed to accept it.

In `src/summaryRules.ts`, I disabled the ticket-ownership validation:

```typescript
// INTENTIONAL REGRESSION
if (false) {
  reasons.push(
    "One or more citations do not belong to this ticket."
  );
}
```

I then ran:

```bash
npm run test:unit
```

### Observed result

```text
Test Files  2 failed | 1 passed (3)
Tests       4 failed | 18 passed (22)
```

The failures included:

- Rejecting citations belonging to another ticket.
- Reporting multiple validation failures together.
- Blocking summaries with invalid citations in the combined release gate.
- Combining structural and semantic failures correctly.

I committed the intentional change on a separate feature branch and opened a pull request.

GitHub Actions detected the failures, and the required status check prevented the pull request from being merged.

After restoring the original ticket-ownership validation, the local unit tests passed again.

This exercise helped verify that the release gate was actually enforcing the intended quality rule rather than simply reporting a successful pipeline.

**Note:** The regression is documented for demonstration purposes. The normal application must retain the original ownership validation.

## Limitations and What I Would Add Next

The current project uses synthetic ticket data and a mocked AI service. Its deterministic rules cover selected scenarios, not every possible quality issue in generated text.

If I extended this into a production-oriented solution, I would work on:

1. **Broader semantic evaluation:** Check whether each important summary claim is supported by its cited messages, using a larger evaluation dataset and human-reviewed examples.
2. **Hallucination and omission testing:** Measure unsupported claims, missing information and contradictions.
3. **Prompt-injection testing:** Check how the system handles malicious instructions embedded in ticket messages.
4. **Privacy validation:** Improve PII detection and introduce an explicit redaction policy.
5. **API contract validation:** Validate request and response schemas at the service boundary.
6. **Model regression testing:** Compare model versions against a curated evaluation dataset and track changes in quality.
7. **Accessibility testing:** Add automated checks for the approval workflow and keyboard navigation.
8. **Production observability:** Capture evaluation results, failure categories and trends across releases.

I would introduce these incrementally, keeping the release-blocking criteria measurable and repeatable.

## AI Tools and Verification

I used codex during development to discuss the project structure, refine evaluation scenarios, review test coverage, troubleshoot implementation issues and configure the GitHub Actions workflow.

I reviewed the suggested changes and applied them to the project rather than treating generated code as automatically correct.

I verified the implementation by running the unit tests, production build and Playwright tests locally. I also introduced an intentional citation-ownership regression and confirmed that the unit tests and GitHub Actions pipeline detected it.

The final verification was based on actual test execution and CI results, not on AI-generated explanations alone.

## Project Repository

[GitHub - AI Quality Assurance Release Gate](https://github.com/jitsinghsdet/ai-quality-assurance-gate)