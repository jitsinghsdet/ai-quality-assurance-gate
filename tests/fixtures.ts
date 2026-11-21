import { test as base, expect, type Page } from "@playwright/test";

type ApiResponse = { status: number; body: unknown };
type Fixtures = { mockSummaryApi: (responses: ApiResponse[]) => Promise<void> };

export const test = base.extend<Fixtures>({
  mockSummaryApi: async ({ page }: { page: Page }, use) => {
    await use(async (responses: ApiResponse[]) => {
      let call = 0;
      await page.route("**/api/tickets/T-100/summary", async route => {
        const current = responses[Math.min(call, responses.length - 1)];
        call += 1;
        await route.fulfill({
          status: current.status,
          contentType: "application/json",
          body: JSON.stringify(current.body)
        });
      });
    });
  }
});
export { expect };
