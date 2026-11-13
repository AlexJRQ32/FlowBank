import { test, expect } from "@playwright/test";
import { loginQA } from "./helpers";

test.describe("Alertas (/alertas)", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginQA(page);
  });

  test("renders page header", async ({ page }) => {
    await page.goto("/alertas");
    await expect(page.getByRole("heading", { name: "Mis alertas" })).toBeVisible();
  });

  test("shows alert list or empty state", async ({ page }) => {
    await page.goto("/alertas");
    const hasAlerts = await page.locator("ul").count() > 0;
    if (hasAlerts) {
      await expect(page.getByText(/Fecha de corte|Fecha de pago/i).first()).toBeVisible();
    } else {
      await expect(page.getByText(/Sin alertas/i)).toBeVisible();
    }
  });
});
