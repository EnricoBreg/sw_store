import { test, expect, Page } from "@playwright/test";
import { e2eUser, loginAsE2eUser } from "./support/e2e-user";
import { API_URL, apiEmptyCart, apiGetCart, apiLogin } from "./support/api";

// I test modificano il carrello dell'utente e2e: girano in serie e lo lasciano vuoto
test.describe.configure({ mode: "serial" });

let token: string;

test.beforeEach(async ({ request }) => {
  token = await apiLogin(request, e2eUser.email, e2eUser.password);
  await apiEmptyCart(request, token);
});

test.afterEach(async ({ request }) => {
  await apiEmptyCart(request, token);
});

async function addFromProductPage(page: Page, productId: number) {
  await page.goto(`/products/${productId}`);
  const added = page.waitForResponse((r) => r.url().endsWith("/api/v1/cart/items") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Aggiungi al carrello" }).click();
  expect((await added).status()).toBe(201);
}

const euro = (amount: number | string) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(Number(amount));

test("carrello persistente: aggiunta, quantità, reload e rimozione", async ({ page, request }) => {
  // Due prodotti attivi con stock sufficiente
  const productsResponse = await request.get(`${API_URL}/products?limit=30`);
  const products = (await productsResponse.json()).data.filter(
    (p: { active: boolean; stock_quantity: number }) => p.active && p.stock_quantity >= 3,
  );
  expect(products.length).toBeGreaterThanOrEqual(2);
  const [first, second] = products;

  await loginAsE2eUser(page);
  await addFromProductPage(page, first.id);
  await addFromProductPage(page, second.id);

  await page.goto("/cart");
  const rows = page.locator("app-cart-list-item");
  await expect(rows).toHaveCount(2);
  await expect(page.locator(`app-header-actions [aria-label="Carrello"]`)).toContainText("2");

  // Cambio di quantità: +1 sulla riga del primo prodotto
  const firstRow = rows.filter({ hasText: first.name });
  const patched = page.waitForResponse((r) => /\/api\/v1\/cart\/items\/\d+$/.test(r.url()) && r.request().method() === "PATCH");
  await firstRow.getByRole("button", { name: "Aumenta la quantità" }).click();
  expect((await patched).status()).toBe(200);
  await expect(firstRow.getByRole("status")).toHaveText("2");

  // Totali mostrati = totali calcolati dal backend
  const serverCart = await apiGetCart(request, token);
  expect(serverCart.items_count).toBe(3);
  await expect(page.locator("app-summarize-order")).toContainText(euro(serverCart.total_amount));

  // Reload: il carrello viene riletto dal server ed è identico
  await page.reload();
  await expect(rows).toHaveCount(2);
  await expect(rows.filter({ hasText: first.name }).getByRole("status")).toHaveText("2");
  await expect(rows.filter({ hasText: second.name }).getByRole("status")).toHaveText("1");
  await expect(page.locator(`app-header-actions [aria-label="Carrello"]`)).toContainText("3");
  await expect(page.locator("app-summarize-order")).toContainText(euro(serverCart.total_amount));

  // Rimozione di entrambe le righe: carrello vuoto
  for (const product of [first, second]) {
    const removed = page.waitForResponse((r) => r.request().method() === "DELETE" && r.url().includes("/api/v1/cart/items/"));
    await page.getByRole("button", { name: `Rimuovi ${product.name} dal carrello` }).click();
    expect((await removed).status()).toBe(200);
  }
  await expect(rows).toHaveCount(0);
  await expect(page.getByText("Il tuo carrello è vuoto")).toBeVisible();
  expect((await apiGetCart(request, token)).items).toHaveLength(0);
});

test("una quantità oltre lo stock mostra l'errore del backend e il carrello resta invariato", async ({ page, request }) => {
  const productsResponse = await request.get(`${API_URL}/products?limit=30`);
  const product = (await productsResponse.json()).data.find(
    (p: { active: boolean; stock_quantity: number }) => p.active && p.stock_quantity >= 1 && p.stock_quantity <= 30,
  );
  test.skip(!product, "nessun prodotto con stock adatto al test");

  // Carrello già al limite dello stock: un ulteriore pezzo deve essere rifiutato (422)
  await request.post(`${API_URL}/cart/items`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { cart_item: { product_id: product.id, quantity: product.stock_quantity } },
  });

  await loginAsE2eUser(page);
  await page.goto(`/products/${product.id}`);
  const rejected = page.waitForResponse((r) => r.url().endsWith("/api/v1/cart/items") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Aggiungi al carrello" }).click();
  const response = await rejected;
  expect(response.status()).toBe(422);
  const detail: string = (await response.json()).errors[0];

  await expect(page.getByText(detail)).toBeVisible();
  expect((await apiGetCart(request, token)).items_count).toBe(product.stock_quantity);
});
