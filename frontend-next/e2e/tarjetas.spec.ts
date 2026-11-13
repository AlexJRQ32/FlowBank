import { test, expect, type Page } from "@playwright/test";
import { loginQA, suffix } from "./helpers";

/**
 * /tarjetas list, new-card form, and edit page flows.
 * Card creation goes through the same form the users use, so the tests stay
 * self-sufficient (no direct DB writes).
 */

test.describe("Tarjetas (/tarjetas)", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginQA(page);
  });

  /** Create a card through /tarjetas/nueva and wait for the list page. */
  async function createCard(page: Page, nombre: string): Promise<void> {
    await page.goto("/tarjetas/nueva");
    await page.getByLabel("Nombre de la tarjeta").fill(nombre);
    const bancoSelect = page.getByLabel("Banco");
    const bancoOptions = await bancoSelect.locator("option").count();
    expect(bancoOptions).toBeGreaterThan(0);
    if (bancoOptions > 1) await bancoSelect.selectOption({ index: 1 });
    await page.getByLabel("Ultimos 4 digitos").fill("1234");
    await page.getByLabel("Dia de corte").fill("10");
    await page.getByLabel("Dia de pago").fill("20");
    await page.getByRole("button", { name: "Guardar tarjeta" }).click();
    await expect(page).not.toHaveURL(/\/nueva$/, { timeout: 15_000 });
  }

  function cardLink(page: Page, nombre: string) {
    return page.locator(`a[aria-label="Editar ${nombre}"]`);
  }

  test("renders page header, card or empty state", async ({ page }) => {
    await page.goto("/tarjetas");
    await expect(page.getByRole("heading", { name: "Mis tarjetas" })).toBeVisible();
    // Either an existing card link or the empty state must render.
    await expect(
      page.locator('a[aria-label^="Editar "]').first().or(page.getByText("Sin tarjetas todavia"))
    ).toBeVisible();
  });

  test("nueva tarjeta form renders all fields", async ({ page }) => {
    await page.goto("/tarjetas/nueva");
    await expect(page.getByRole("heading", { name: "Registrar tarjeta" })).toBeVisible();
    await expect(page.getByLabel("Nombre de la tarjeta")).toBeVisible();
    await expect(page.getByLabel("Banco")).toBeVisible();
    await expect(page.getByLabel("Ultimos 4 digitos")).toBeVisible();
    await expect(page.getByLabel("Tipo")).toBeVisible();
    await expect(page.getByLabel("Dia de corte")).toBeVisible();
    await expect(page.getByLabel("Dia de pago")).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar tarjeta" })).toBeVisible();
  });

  test("nueva tarjeta validation reports digitos error when digitos missing", async ({ page }) => {
    await page.goto("/tarjetas/nueva");
    await page.getByLabel("Nombre de la tarjeta").fill("Test Card");
    await page.getByLabel("Dia de corte").fill("15");
    await page.getByLabel("Dia de pago").fill("2");
    await page.getByRole("button", { name: "Guardar tarjeta" }).click();
    // The select defaults to the first banco, so validation proceeds past the
    // banco check and reports the next missing field: the 4-digit number.
    await expect(page.getByRole("alert").first()).toContainText(/4 digitos/i, { timeout: 10_000 });
  });

  test("nueva tarjeta create succeeds with valid data", async ({ page }) => {
    const nombre = `QA Card ${suffix()}`;
    await createCard(page, nombre);
    await expect(page).toHaveURL(/\/tarjetas$/, { timeout: 15_000 });
    await expect(cardLink(page, nombre)).toBeVisible();
  });

  test("edit page renders with card data and delete zone", async ({ page }) => {
    const nombre = `QA Card ${suffix()}`;
    await createCard(page, nombre);
    await page.goto("/tarjetas");
    await cardLink(page, nombre).click();
    await expect(page).toHaveURL(/\/tarjetas\/.+\/editar$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Editar tarjeta" })).toBeVisible();
    await expect(page.getByLabel("Nombre de la tarjeta")).toHaveValue(nombre);
    await expect(page.getByText("Zona de riesgo: eliminar tarjeta")).toBeVisible();
  });

  test("delete requires confirmation checkbox", async ({ page }) => {
    const nombre = `QA Card ${suffix()}`;
    await createCard(page, nombre);
    await page.goto("/tarjetas");
    await cardLink(page, nombre).click();
    await expect(page).toHaveURL(/\/editar$/, { timeout: 15_000 });

    // Expand the risk zone and try to delete without confirming.
    await page.getByText("Zona de riesgo: eliminar tarjeta").click();
    await page.getByRole("button", { name: "Eliminar tarjeta" }).click();
    // The required checkbox blocks submission: we stay on the edit page.
    await expect(page).toHaveURL(/\/editar$/);
    await expect(page.getByLabel("Nombre de la tarjeta")).toHaveValue(nombre);

    // Confirm and delete: back at the list, card gone.
    await page.getByLabel("Confirmo eliminar esta tarjeta").check();
    await page.getByRole("button", { name: "Eliminar tarjeta" }).click();
    await expect(page).toHaveURL(/\/tarjetas$/, { timeout: 15_000 });
    await expect(cardLink(page, nombre)).toHaveCount(0);
  });
});
