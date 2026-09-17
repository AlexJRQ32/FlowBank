import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const details = page.locator("details").nth(1);
await details.locator("summary").click().catch(() => {});
await details.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await page.screenshot({ path: "shots/faq-desktop.png" });
// banner
await page.evaluate(() => {
  document.querySelectorAll("section").forEach((s) => {
    if (s.className.includes("cta-banner")) s.scrollIntoView();
  });
});
await page.waitForTimeout(400);
await page.screenshot({ path: "shots/banner-desktop.png" });
console.log("done");
await browser.close();
