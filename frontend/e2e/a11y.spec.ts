import { test, expect, Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const API_URL = process.env["E2E_API_URL"] ?? "http://localhost:3000/api/v1";

/** Preme Tab finché il focus non arriva su un elemento che soddisfa il predicato (max `limit` volte). */
async function tabUntil(page: Page, predicate: string, limit = 60): Promise<boolean> {
  for (let i = 0; i < limit; i++) {
    await page.keyboard.press("Tab");
    const matches = await page.evaluate(
      (selector) => !!document.activeElement && document.activeElement.matches(selector),
      predicate,
    );
    if (matches) return true;
  }
  return false;
}

test.describe("Accessibilità", () => {
  test("da tastiera si filtra il catalogo per categoria e si apre un prodotto", async ({ page }) => {
    await page.goto("/products");
    await expect(page.locator("app-product-card").first()).toBeVisible();

    // Categoria: le voci sono bottoni raggiungibili con Tab e attivabili con Invio
    const categoryButtons = page.locator("app-categories-list button[mat-list-item]");
    const secondCategory = (await categoryButtons.nth(1).innerText()).trim();
    const productsRequest = page.waitForRequest((r) => r.url().includes("/api/v1/products?") && r.url().includes("category_id="));
    expect(await tabUntil(page, "app-categories-list button[mat-list-item]:nth-of-type(2)")).toBe(true);
    await page.keyboard.press("Enter");
    await productsRequest;
    await expect(categoryButtons.nth(1)).toHaveAttribute("aria-current", "true");
    await expect(categoryButtons.nth(1)).toContainText(secondCategory);

    // Prodotto: il titolo della card è un link raggiungibile con Tab
    expect(await tabUntil(page, "app-product-card h3 a")).toBe(true);
    const productName = (await page.evaluate(() => document.activeElement?.textContent ?? "")).trim();
    await expect(page.locator("app-product-card h3 a:focus-visible")).toHaveCount(1);
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/\/products\/\d+$/);
    await expect(page.getByRole("heading", { level: 1, name: productName })).toBeVisible();
  });

  for (const path of ["/products", "/login", "/sign-up"]) {
    test(`nessuna violazione axe (WCAG A/AA) su ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const summary = results.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.help}`);
      expect(summary).toEqual([]);
    });
  }

  test("nessuna violazione axe (WCAG A/AA) sul dettaglio prodotto", async ({ page, request }) => {
    const response = await request.get(`${API_URL}/products?limit=1`);
    const [product] = (await response.json()).data;

    await page.goto(`/products/${product.id}`);
    await expect(page.getByRole("heading", { level: 1, name: product.name })).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const summary = results.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.help}`);
    expect(summary).toEqual([]);
  });
});
