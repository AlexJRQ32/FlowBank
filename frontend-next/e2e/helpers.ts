import { type Page, expect } from "@playwright/test";

export const QA = {
  email: "qa@flowbank.test",
  password: "FlowBankQA2026!",
};

/**
 * Log in via the /login form using the shared QA account.
 * Asserts redirect to /dashboard after submit.
 */
export async function loginQA(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Correo electronico").fill(QA.email);
  await page.getByLabel("Contraseña").fill(QA.password);
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
}

/**
 * Generate a unique suffix for test data to avoid collisions across runs.
 */
export function suffix(): string {
  return Date.now().toString(36).slice(-6) + Math.random().toString(36).slice(2, 5);
}
