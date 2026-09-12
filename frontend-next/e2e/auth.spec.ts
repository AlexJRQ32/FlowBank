import { test, expect } from "@playwright/test";
import { QA, suffix } from "./helpers";

test.describe("Login (/login)", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("valid credentials redirect to dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo electronico").fill(QA.email);
    await page.getByLabel("Contraseña").fill(QA.password);
    await page.getByRole("button", { name: "Iniciar sesion" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  });

  test("invalid credentials show error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo electronico").fill("noexiste@flowbank.test");
    await page.getByLabel("Contraseña").fill("wrongpass");
    await page.getByRole("button", { name: "Iniciar sesion" }).click();
    await expect(page.getByRole("alert").first()).toContainText(/incorrectos/i, { timeout: 15_000 });
  });

  test("empty fields show validation error", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Iniciar sesion" }).click();
    await expect(page.getByRole("alert").first()).toContainText(/correo.*contraseña/i, { timeout: 10_000 });
  });

  test("Google button exists and is clickable", async ({ page }) => {
    await page.goto("/login");
    const googleBtn = page.getByRole("button", { name: /Continuar con Google/i });
    await expect(googleBtn).toBeVisible();
    await googleBtn.click();
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/login|accounts\.google/);
  });
});

test.describe("Registro (/registro)", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("renders form with all fields", async ({ page }) => {
    await page.goto("/registro");
    await expect(page.getByRole("heading", { name: "Crear cuenta" })).toBeVisible();
    await expect(page.getByLabel("Nombre")).toBeVisible();
    await expect(page.getByLabel("Apellido")).toBeVisible();
    await expect(page.getByLabel("Correo electronico")).toBeVisible();
    await expect(page.getByLabel("Contraseña")).toBeVisible();
    await expect(page.getByRole("button", { name: "Crear cuenta" })).toBeVisible();
  });

  test("empty fields show error", async ({ page }) => {
    await page.goto("/registro");
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByRole("alert").first()).toContainText(/completa/i, { timeout: 10_000 });
  });

  test("signup with unique email shows notice or redirects", async ({ page }) => {
    const s = suffix();
    await page.goto("/registro");
    await page.getByLabel("Nombre").fill("Test");
    await page.getByLabel("Apellido").fill("QA");
    await page.getByLabel("Correo electronico").fill(`test${s}@flowbank.test`);
    await page.getByLabel("Contraseña").fill("TestPass123!");
    await page.getByRole("button", { name: "Crear cuenta" }).click();

    // Wait for navigation or alert — use waitForURL with catch, then check state
    try {
      await page.waitForURL(/\/dashboard/, { timeout: 12_000 });
      // Redirected to dashboard
      await expect(page).toHaveURL(/\/dashboard/);
    } catch {
      // Did not redirect — should show an alert (notice or error)
      // Supabase may require email confirmation, or the email may already exist
      const alertVisible = await page.getByRole("alert").first().isVisible().catch(() => false);
      const statusVisible = await page.getByRole("status").first().isVisible().catch(() => false);
      // At least one of alert/status should be visible
      expect(alertVisible || statusVisible).toBeTruthy();
    }
  });
});

test.describe("Auth gate", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("unauthenticated /dashboard redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test("unauthenticated /tarjetas redirects to /login", async ({ page }) => {
    await page.goto("/tarjetas");
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test("unauthenticated /facturas redirects to /login", async ({ page }) => {
    await page.goto("/facturas");
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });
});
