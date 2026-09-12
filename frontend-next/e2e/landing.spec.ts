import { test, expect } from "@playwright/test";

test.describe("Landing (/)", () => {
  test("renders hero with title and CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Every due date/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Create free account/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /I already have one/i })).toBeVisible();
  });

  test("renders features section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Features").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Simple to use/i })).toBeVisible();
  });

  test("renders how-it-works section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("How it works").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Three steps/i })).toBeVisible();
  });

  test("renders footer with copyright", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    // Footer has brand span "FlowBank" and copyright "© 2026 FlowBank"
    // Use specific text to avoid strict mode violation
    await expect(footer.getByText(/2026 FlowBank/)).toBeVisible();
    await expect(footer.getByRole("link", { name: /Log in/i })).toBeVisible();
  });

  test("burger menu toggles on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const burger = page.getByLabel("Open menu");
    await expect(burger).toBeVisible();
    await burger.click();
    // After clicking, aria-label changes to "Close menu"
    await expect(page.getByLabel("Close menu")).toBeVisible();
  });

  test("nav links are present", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: /FlowBank/i })).toBeVisible();
  });
});
