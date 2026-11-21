import { test, expect } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("successful generation shows cited summary and allows approval", async ({ page, mockSummaryApi }) => {
  await mockSummaryApi([{ status: 200, body: {
    status: "ok", summary: "Customer cannot sign in because the password reset link expired.",
    sourceIds: ["m1", "m3"]
  }}]);
  await page.getByRole("button", { name: "Generate summary" }).click();
  await expect(page.getByTestId("summary-result")).toContainText("password reset link expired");
  await expect(page.getByRole("button", { name: "Approve summary" })).toBeEnabled();
  await page.getByRole("button", { name: "Approve summary" }).click();
  await expect(page.getByRole("status")).toContainText("Approved");
});

test("503 offers retry; approval stays disabled until a valid retry", async ({ page, mockSummaryApi }) => {
  await mockSummaryApi([
    { status: 503, body: { error: "unavailable" } },
    { status: 200, body: { status: "ok", summary: "The reset link expired, preventing sign-in.", sourceIds: ["m1", "m3"] } }
  ]);
  await page.getByRole("button", { name: "Generate summary" }).click();
  await expect(page.getByRole("alert")).toContainText("temporarily unavailable");
  await expect(page.getByRole("button", { name: "Approve summary" })).toBeDisabled();
  await page.getByRole("button", { name: "Retry generation" }).click();
  await expect(page.getByTestId("summary-result")).toContainText("reset link expired");
  await expect(page.getByRole("button", { name: "Approve summary" })).toBeEnabled();
});

test("cross-ticket citations display the result but block approval", async ({ page, mockSummaryApi }) => {
  await mockSummaryApi([{ status: 200, body: {
    status: "ok", summary: "Customer reports an expired reset link.",
    sourceIds: ["m1", "message-from-another-ticket"]
  }}]);
  await page.getByRole("button", { name: "Generate summary" }).click();
  await expect(page.getByTestId("approval-blocked")).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve summary" })).toBeDisabled();
});

test("insufficient information never enables approval", async ({ page, mockSummaryApi }) => {
  await mockSummaryApi([{ status: 200, body: { status: "insufficient_information" } }]);
  await page.getByRole("button", { name: "Generate summary" }).click();
  await expect(page.getByRole("status")).toContainText("Insufficient information");
  await expect(page.getByRole("button", { name: "Approve summary" })).toBeDisabled();
});


test("unsupported semantic claims block approval despite valid citations", async ({ page, mockSummaryApi }) => {
  await mockSummaryApi([{
    status: 200,
    body: {
      status: "ok",
      summary: "Customer cannot sign in because the payment gateway is unavailable.",
      sourceIds: ["m1", "m3"]
    }
  }]);

  await page.getByRole("button", { name: "Generate summary" }).click();

  // Summary should be displayed because its structure and citations are valid.
  await expect(page.getByTestId("summary-result"))
    .toContainText("payment gateway is unavailable");

  // Semantic validation must identify the unsupported claim.
  await expect(page.getByTestId("approval-blocked"))
    .toContainText("Payment gateway outage");

  // Release gate must prevent approval.
  await expect(page.getByRole("button", { name: "Approve summary" }))
    .toBeDisabled();
});
