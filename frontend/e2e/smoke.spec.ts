import { test, expect } from "@playwright/test";

test("la home si carica senza errori", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();

  // Angular ha montato l'app: il componente radice non è vuoto
  await expect(page.locator("app-root")).not.toBeEmpty();

  expect(errors).toEqual([]);
});
