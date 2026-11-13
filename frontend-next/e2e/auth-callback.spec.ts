import { test, expect } from "@playwright/test";

test.describe("Auth callback (/auth/callback)", () => {
  /**
   * The route handler must never 500: without a valid code it redirects to
   * /login?error=oauth (Next.js redirects use HTTP 307).
   *
   * Testing with request API to check HTTP status directly (maxRedirects: 0
   * so we inspect the redirect itself instead of the /login response).
   */
  test("GET without code redirects to /login?error=oauth", async ({ request }) => {
    const res = await request.get("/auth/callback", { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    expect(res.headers().location).toContain("/login?error=oauth");
  });

  test("GET with invalid code redirects to /login?error=oauth", async ({ request }) => {
    const res = await request.get("/auth/callback?code=invalid-test-code", { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    expect(res.headers().location).toContain("/login?error=oauth");
  });
});
