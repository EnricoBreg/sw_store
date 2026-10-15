import { test, expect } from "@playwright/test";
import { loginAsE2eUser } from "./support/e2e-user";

const API_URL = process.env["E2E_API_URL"] ?? "http://localhost:3000/api/v1";

test.describe("Catalogo", () => {
  test("la ricerca testuale filtra i prodotti e resta nell'URL", async ({ page, request }) => {
    // Termine di ricerca preso da un prodotto reale del catalogo
    const response = await request.get(`${API_URL}/products?limit=1`);
    const [firstProduct] = (await response.json()).data;
    const term: string = firstProduct.name.split(" ").at(-1);

    await page.goto("/products");
    await expect(page.locator("app-product-card").first()).toBeVisible();

    const searchRequest = page.waitForRequest(
      (r) => r.url().includes("/api/v1/products?") && new URL(r.url()).searchParams.get("q") === term,
    );
    await page.getByTestId("products-search").fill(term);

    const searchUrl = new URL((await searchRequest).url());
    expect(searchUrl.searchParams.get("page")).toBe("1");
    await expect(page).toHaveURL(new RegExp(`/products\\?q=${encodeURIComponent(term)}$`));

    // La griglia si aggiorna con i soli prodotti che contengono il termine cercato
    const names = page.locator("app-product-card h3");
    await expect
      .poll(async () => {
        const texts = await names.allInnerTexts();
        return texts.length > 0 && texts.every((name) => name.toLowerCase().includes(term.toLowerCase()));
      })
      .toBe(true);

    // Ricaricando la pagina la ricerca viene ripristinata dall'URL
    await page.reload();
    await expect(page.getByTestId("products-search")).toHaveValue(term);
    await expect(names.first()).toBeVisible();
  });

  test("una ricerca senza risultati mostra il messaggio dedicato", async ({ page }) => {
    await page.goto("/products?q=zzz-nessun-prodotto-zzz");

    await expect(page.locator("app-no-product-found")).toBeVisible();
    await expect(page.locator("app-product-card")).toHaveCount(0);
  });

  test("da ospite il pulsante della wishlist non è mostrato", async ({ page }) => {
    await page.goto("/products");
    await expect(page.locator("app-product-card").first()).toBeVisible();

    await expect(page.locator("app-toggle-wishlist-button button")).toHaveCount(0);
  });
});

test.describe("Area admin", () => {
  test("un ospite che apre /admin viene mandato al login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("un utente normale che apre /admin viene mandato a /forbidden", async ({ page }) => {
    await loginAsE2eUser(page);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/forbidden$/);
  });
});
