import { test, expect } from "@playwright/test";
import { loginQA } from "./helpers";

test.describe("Perfil (/perfil)", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginQA(page);
  });

  test("renders profile page with fields", async ({ page }) => {
    await page.goto("/perfil");
    await expect(page.getByRole("heading", { name: "Mi perfil" })).toBeVisible();

    // Profile card uses <dl> with <dt>/<dd> pairs
    const dl = page.locator("dl");
    await expect(dl.getByText("Nombre", { exact: true })).toBeVisible();
    await expect(dl.getByText("Apellido", { exact: true })).toBeVisible();
    await expect(dl.getByText("Correo electronico", { exact: true })).toBeVisible();
    await expect(dl.getByText("qa@flowbank.test")).toBeVisible();
  });

  test("edit nombre persists and shows success", async ({ page }) => {
    await page.goto("/perfil");
    const nombreInput = page.locator('form input#nombre');
    await expect(nombreInput).toBeVisible();

    await nombreInput.clear();
    await nombreInput.fill("QA-Updated");
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    // Success message: "Perfil actualizado." (with period)
    await expect(page.getByText("Perfil actualizado.")).toBeVisible({ timeout: 15_000 });

    // Restore original value
    await nombreInput.clear();
    await nombreInput.fill("QA");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Perfil actualizado.")).toBeVisible({ timeout: 15_000 });
  });

  test("empty nombre shows error", async ({ page }) => {
    await page.goto("/perfil");
    const nombreInput = page.locator('form input#nombre');
    await nombreInput.clear();
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByRole("alert").first()).toContainText(/nombre/i, { timeout: 10_000 });
  });
});
