import { test, expect } from "@playwright/test";
import { loginQA } from "./helpers";

test.describe("Dashboard (/dashboard)", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginQA(page);
  });

  test("renders greeting with QA name", async ({ page }) => {
    const heading = page.getByRole("heading", { name: /Bienvenido/i });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/QA/);
  });

  test("renders stat cards", async ({ page }) => {
    // Stat cards are inside <main>; sidebar and bottom-nav also have these labels
    const main = page.getByRole("main");
    await expect(main.getByText("Tarjetas", { exact: true })).toBeVisible();
    await expect(main.getByText("Bancos", { exact: true })).toBeVisible();
    await expect(main.getByText("Facturas", { exact: true })).toBeVisible();
    await expect(main.getByText("Alertas", { exact: true })).toBeVisible();
  });

  test("renders acciones rapidas section", async ({ page }) => {
    await expect(page.getByText("Acciones rapidas", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Registrar tarjeta/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Subir factura/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Mis alertas/i })).toBeVisible();
  });

  test("sidebar navigation works", async ({ page }) => {
    const sidebar = page.locator('aside[aria-label="Dashboard navigation"]');
    await expect(sidebar.getByRole("link", { name: "Tarjetas" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Facturas" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Alertas" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Dashboard" })).toBeVisible();
  });
});
