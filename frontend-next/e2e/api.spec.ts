import { test, expect } from "@playwright/test";

test.describe("API /api/tipo-cambio", () => {
  test("returns JSON with compra and venta", async ({ request }) => {
    const res = await request.get("/api/tipo-cambio");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("compra");
    expect(json).toHaveProperty("venta");
    expect(json).toHaveProperty("fecha");
    expect(json).toHaveProperty("fuente");
    // If sources succeeded, compra/venta should be numbers
    if (json.compra !== null) {
      expect(typeof json.compra).toBe("number");
    }
    if (json.venta !== null) {
      expect(typeof json.venta).toBe("number");
    }
  });
});
