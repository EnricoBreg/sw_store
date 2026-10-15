import { test, expect, Page } from "@playwright/test";
import { submitLogin } from "./support/e2e-user";
import {
  API_URL,
  apiCancelOrder,
  apiEmptyCart,
  apiEnsureUser,
  apiGetCart,
  apiLogin,
  apiProductWithMostStock,
} from "./support/api";

// Utente dedicato al checkout: il suo carrello e i suoi ordini non interferiscono con gli altri test.
// Ogni ordine creato scala 1 pezzo di stock: si usa il prodotto con lo stock più alto.
const checkoutUser = {
  email: process.env["E2E_CHECKOUT_USER_EMAIL"] ?? "e2e.checkout@swstore.test",
  password: process.env["E2E_CHECKOUT_USER_PASSWORD"] ?? "E2eTest-2026!",
};

test.describe.configure({ mode: "serial" });

let token: string;
// Ordini creati dal test corrente: vengono annullati alla fine (DELETE /orders/:id ripristina lo stock)
let createdOrderIds: number[] = [];

test.beforeAll(async ({ request }) => {
  await apiEnsureUser(request, checkoutUser.email, checkoutUser.password, "Checkout");
});

test.beforeEach(async ({ page, request }) => {
  token = await apiLogin(request, checkoutUser.email, checkoutUser.password);
  await apiEmptyCart(request, token);

  createdOrderIds = [];
  page.on("response", async (response) => {
    if (response.url().endsWith("/api/v1/orders") && response.request().method() === "POST" && response.status() === 201) {
      createdOrderIds.push((await response.json()).data.id);
    }
  });
});

test.afterEach(async ({ request }) => {
  await apiEmptyCart(request, token);
  for (const orderId of createdOrderIds) {
    const cancelled = await apiCancelOrder(request, token, orderId);
    expect(cancelled, `annullamento dell'ordine ${orderId}`).toBe(200);
  }
});

/** Login, aggiunta di 1 pezzo del prodotto e apertura del checkout dal carrello. */
async function goToCheckoutWithOneItem(page: Page, product: { id: number; name: string }) {
  await submitLogin(page, checkoutUser.email, checkoutUser.password);
  await expect(page).toHaveURL(/\/products$/);

  await page.goto(`/products/${product.id}`);
  const added = page.waitForResponse((r) => r.url().endsWith("/api/v1/cart/items") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Aggiungi al carrello" }).click();
  expect((await added).status()).toBe(201);

  await page.goto("/cart");
  await expect(page.locator("app-cart-list-item")).toHaveCount(1);
  await page.getByRole("button", { name: "Procedi al checkout" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
}

async function fillCheckoutForm(page: Page) {
  await page.locator("input[formcontrolname=first_name]").fill("Mario");
  await page.locator("input[formcontrolname=last_name]").fill("Rossi");
  await page.locator("input[formcontrolname=street]").fill("Via del Commercio 55");
  await page.locator("input[formcontrolname=city]").fill("Rovigo");
  await page.locator("input[formcontrolname=zip_code]").fill("45100");
  await page.locator("input[formcontrolname=country]").fill("Italia");
  await page.getByRole("radio", { name: /Carta di debito/ }).check();
}

test("flusso completo: carrello → checkout → conferma → I miei ordini → dettaglio", async ({ page, request }) => {
  const product = await apiProductWithMostStock(request);
  expect(product.stock_quantity).toBeGreaterThan(1);

  await goToCheckoutWithOneItem(page, product);
  await fillCheckoutForm(page);

  const created = page.waitForResponse((r) => r.url().endsWith("/api/v1/orders") && r.request().method() === "POST");
  await page.getByTestId("checkout-submit").click();
  const response = await created;
  expect(response.status()).toBe(201);
  const order = (await response.json()).data;

  // Conferma chiara con codice e totale dell'ordine
  await expect(page).toHaveURL(new RegExp(`/checkout/confirmation/${order.id}$`));
  await expect(page.getByTestId("order-confirmation")).toBeVisible();
  await expect(page.getByTestId("order-code")).toHaveText(order.code);
  await expect(page.getByTestId("order-total")).toContainText(
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(Number(order.total_amount)),
  );

  // Il carrello è stato svuotato dal backend e la UI lo riflette
  expect((await apiGetCart(request, token)).items).toHaveLength(0);
  // Badge del carrello nascosto (0 pezzi)
  await expect(page.locator(`app-header-actions [aria-label="Carrello"]`)).toHaveClass(/mat-badge-hidden/);

  // L'ordine compare in "I miei ordini" (più recente prima)
  await page.getByRole("link", { name: "I miei ordini" }).click();
  await expect(page).toHaveURL(/\/my-orders$/);
  const orderLink = page.locator(`[data-testid=orders-list] a[href$="/my-orders/${order.id}"]`);
  await expect(orderLink).toBeVisible();
  await expect(page.locator("[data-testid=orders-list] li").first()).toContainText(`#${order.id}`);

  // Filtro per stato: l'ordine nuovo è "in attesa", quindi sparisce filtrando per "Consegnato"
  const filtered = page.waitForRequest((r) => r.url().includes("/api/v1/orders?") && r.url().includes("status=delivered"));
  await page.getByTestId("orders-status-filter").click();
  await page.getByRole("option", { name: "Consegnato" }).click();
  await filtered;
  await page.keyboard.press("Escape");
  await expect(orderLink).toHaveCount(0);

  // Dettaglio dell'ordine
  await page.goto("/my-orders");
  await page.locator(`[data-testid=orders-list] a[href$="/my-orders/${order.id}"]`).click();
  await expect(page).toHaveURL(new RegExp(`/my-orders/${order.id}$`));
  await expect(page.getByRole("heading", { level: 1 })).toContainText(`#${order.id}`);
  await expect(page.getByText(product.name)).toBeVisible();
});

test("errore al checkout: messaggio del backend e Riprova senza perdere i dati", async ({ page, request }) => {
  const product = await apiProductWithMostStock(request);
  await goToCheckoutWithOneItem(page, product);
  await fillCheckoutForm(page);

  // Il primo invio viene intercettato e riceve una risposta 422 nel formato del backend
  // (stock insufficiente), così non serve modificare lo stock nel DB; il secondo va al backend reale.
  let intercepted = false;
  await page.route(`${API_URL}/orders`, async (route) => {
    if (!intercepted && route.request().method() === "POST") {
      intercepted = true;
      await route.fulfill({
        status: 422,
        json: {
          success: false,
          message: "Non è stato possibile completare l'ordine.",
          errors: [`Quantità supera la disponibilità di ${product.name} (disponibili: 0).`],
        },
      });
      return;
    }
    await route.continue();
  });

  await page.getByTestId("checkout-submit").click();

  const errorPanel = page.getByTestId("checkout-error");
  await expect(errorPanel).toBeVisible();
  await expect(errorPanel).toContainText("Non è stato possibile completare l'ordine.");
  await expect(errorPanel).toContainText(`(disponibili: 0)`);
  // Nessun ordine creato: il carrello è intatto e i dati del form restano
  expect((await apiGetCart(request, token)).items).toHaveLength(1);
  await expect(page.locator("input[formcontrolname=first_name]")).toHaveValue("Mario");

  const retried = page.waitForResponse((r) => r.url().endsWith("/api/v1/orders") && r.request().method() === "POST");
  await errorPanel.getByRole("button", { name: "Riprova" }).click();
  expect((await retried).status()).toBe(201);

  await expect(page).toHaveURL(/\/checkout\/confirmation\/\d+$/);
  await expect(page.getByTestId("order-confirmation")).toBeVisible();
});

test("checkout con il carrello vuoto: messaggio chiaro, nessun form", async ({ page }) => {
  await submitLogin(page, checkoutUser.email, checkoutUser.password);
  await expect(page).toHaveURL(/\/products$/);

  await page.goto("/checkout");
  await expect(page.getByTestId("checkout-empty-cart")).toContainText("Il tuo carrello è vuoto");
  await expect(page.locator("form")).toHaveCount(0);
});
