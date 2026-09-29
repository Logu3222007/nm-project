import { test, expect } from "@playwright/test";

// Requires an authenticated storage state (see Playwright's `storageState`
// setup) wired to a seeded test account — omitted here since it depends on
// a live Supabase project this environment cannot provision.

test.describe("Document creation flow", () => {
  test.skip(true, "Requires a live Supabase project — wire up storageState before enabling.");

  test("creates an NDA end to end", async ({ page }) => {
    await page.goto("/documents/new");
    await page.getByText("Non-Disclosure Agreement").click();
    await page.getByLabel("Disclosing party").fill("Acme Inc");
    await page.getByLabel("Receiving party").fill("Jane Doe");
    await page.getByLabel("Purpose of disclosure").fill("Evaluating a potential partnership.");
    await page.getByLabel("Governing law / jurisdiction").fill("Delaware");
    await page.getByRole("button", { name: "Review" }).click();
    await page.getByRole("button", { name: "Generate document" }).click();
    await expect(page.getByText("Generating your document")).toBeVisible();
    await expect(page).toHaveURL(/\/documents\/[0-9a-f-]+/, { timeout: 30000 });
  });
});
