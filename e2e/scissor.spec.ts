import { test, expect } from "@playwright/test";

test("homepage shows hero and shorten form", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /short links that/i })).toBeVisible();
  await expect(page.getByLabel(/paste a long url/i)).toBeVisible();
});

test("shortens a URL and reveals short link + QR", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel(/paste a long url/i).fill("https://example.com/very/long");
  await page.getByRole("button", { name: /shorten url/i }).click();
  await expect(page.getByText(/your link is live/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("button", { name: /copy link/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /svg/i })).toBeVisible();
});

test("rejects malformed URL", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel(/paste a long url/i).fill("not a url");
  await page.getByRole("button", { name: /shorten url/i }).click();
  await expect(page.getByText(/not a valid url/i)).toBeVisible();
});

test("custom slug collision is rejected", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel(/paste a long url/i).fill("https://example.com/a");
  await page.getByLabel(/custom slug/i).fill("api"); // reserved
  await expect(page.getByText(/reserved word/i)).toBeVisible();
});

test("redirect short link returns the original or 404 page", async ({ page }) => {
  const res = await page.goto("/nonexistent-slug-xyz123");
  expect([404, 410, 200]).toContain(res?.status() ?? 0);
});

test("dashboard requires auth", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/auth/);
});
