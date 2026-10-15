import { test, expect, APIRequestContext } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { submitLogin } from "./support/e2e-user";
import { API_URL, apiLogin } from "./support/api";

// Dati demo del seed (backend/API.md, "Dati demo")
const admin = {
  email: process.env["E2E_ADMIN_EMAIL"] ?? "admin@swstore.com",
  password: process.env["E2E_ADMIN_PASSWORD"] ?? "password123",
};

// PNG 1×1 valido, generato in memoria: niente file binari nel repository
const pngImage = {
  name: "e2e-prodotto.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  ),
};

test.describe.configure({ mode: "serial" });

// Il test crea una categoria e un prodotto con nomi univoci e li elimina;
// l'afterAll rimuove via API quello che fosse rimasto in caso di errore.
const suffix = Date.now();
const categoryName = `E2E Categoria ${suffix}`;
const productName = `E2E Prodotto ${suffix}`;
let createdProductId: number | undefined;
let token: string;

async function apiDeleteLeftovers(request: APIRequestContext) {
  const headers = { Authorization: `Bearer ${token}` };
  if (createdProductId) {
    await request.delete(`${API_URL}/admin/products/${createdProductId}`, { headers });
  }
  const categories = await request.get(`${API_URL}/admin/categories?all=true`, { headers });
  for (const category of (await categories.json()).data ?? []) {
    if (category.name === categoryName) {
      await request.delete(`${API_URL}/admin/categories/${category.id}`, { headers });
    }
  }
}

test.beforeAll(async ({ request }) => {
  token = await apiLogin(request, admin.email, admin.password);
});

test.afterAll(async ({ request }) => {
  await apiDeleteLeftovers(request);
});

test("area admin: dashboard, categoria e prodotto con immagine (crea, modifica, elimina)", async ({ page, request }) => {
  await submitLogin(page, admin.email, admin.password);
  await expect(page).toHaveURL(/\/products$/);

  // Dashboard con i dati di GET /admin/dashboard
  const dashboardResponse = page.waitForResponse((r) => r.url().endsWith("/api/v1/admin/dashboard"));
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  const dashboard = (await (await dashboardResponse).json()).data;
  await expect(page.getByTestId("dashboard-summary")).toBeVisible();
  await expect(page.getByTestId("dashboard-orders")).toHaveText(String(dashboard.orders_count));
  await expect(page.getByRole("heading", { name: "Ordini per stato" })).toBeVisible();

  // Nuova categoria
  await page.goto("/admin/categories");
  await page.getByTestId("category-new").click();
  await page.getByTestId("category-name").fill(categoryName);
  await page.getByTestId("category-description").fill("Categoria creata dal test E2E");
  const categoryCreated = page.waitForResponse(
    (r) => r.url().endsWith("/api/v1/admin/categories") && r.request().method() === "POST",
  );
  await page.getByTestId("category-save").click();
  expect((await categoryCreated).status()).toBe(201);
  const categoryRow = page.locator(`tr[data-category="${categoryName}"]`);
  await expect(categoryRow).toContainText("0");

  // Nuovo prodotto con immagine
  await page.goto("/admin/products/new");
  await page.locator("input[formcontrolname=name]").fill(productName);
  await page.locator("textarea[formcontrolname=description]").fill("Prodotto creato dal test E2E dell'area admin.");
  await page.locator("input[formcontrolname=price]").fill("49.90");
  await page.locator("input[formcontrolname=discountPercentage]").fill("10");
  await page.locator("input[formcontrolname=stockQuantity]").fill("7");
  await page.getByTestId("product-category").click();
  await page.getByRole("option", { name: categoryName }).click();
  await page.getByTestId("product-image-input").setInputFiles(pngImage);
  await expect(page.getByTestId("product-image-preview")).toBeVisible();

  const productCreated = page.waitForResponse(
    (r) => r.url().endsWith("/api/v1/admin/products") && r.request().method() === "POST",
  );
  await page.getByTestId("product-submit").click();
  const createResponse = await productCreated;
  expect(createResponse.status()).toBe(201);
  const created = (await createResponse.json()).data;
  createdProductId = created.id;
  expect(created.image_url).toBeTruthy();

  await expect(page).toHaveURL(new RegExp(`/admin/products/${created.id}$`));
  await expect(page.getByRole("heading", { level: 1, name: productName })).toBeVisible();

  // Modifica: nuovo prezzo e rimozione dell'immagine
  await page.getByRole("link", { name: "Modifica" }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/products/${created.id}/edit$`));
  await expect(page.locator("input[formcontrolname=name]")).toHaveValue(productName);
  await expect(page.getByTestId("product-image-preview")).toBeVisible();
  await page.locator("input[formcontrolname=price]").fill("39.90");
  await page.getByTestId("product-image-remove").click();
  await expect(page.getByTestId("product-image-none")).toBeVisible();

  const productUpdated = page.waitForResponse(
    (r) => r.url().endsWith(`/api/v1/admin/products/${created.id}`) && r.request().method() === "PATCH",
  );
  await page.getByTestId("product-submit").click();
  const updateResponse = await productUpdated;
  expect(updateResponse.status()).toBe(200);
  const updated = (await updateResponse.json()).data;
  expect(Number(updated.price)).toBe(39.9);
  expect(updated.image_url).toBeNull();
  await expect(page).toHaveURL(new RegExp(`/admin/products/${created.id}$`));
  await expect(page.getByText("39,90")).toBeVisible();

  // Eliminazione del prodotto, con conferma
  await page.getByRole("button", { name: "Elimina" }).click();
  await expect(page.getByRole("dialog")).toContainText("Eliminare il prodotto?");
  const productDeleted = page.waitForResponse((r) => r.request().method() === "DELETE");
  await page.getByRole("dialog").getByRole("button", { name: "Elimina" }).click();
  expect((await productDeleted).status()).toBe(200);
  await expect(page).toHaveURL(/\/admin\/products$/);
  const gone = await request.get(`${API_URL}/admin/products/${created.id}`, { headers: { Authorization: `Bearer ${token}` } });
  expect(gone.status()).toBe(404);
  createdProductId = undefined;

  // Eliminazione della categoria, ora vuota
  await page.goto("/admin/categories");
  await expect(categoryRow).toBeVisible();
  await categoryRow.getByRole("button", { name: `Elimina ${categoryName}` }).click();
  const categoryDeleted = page.waitForResponse((r) => r.request().method() === "DELETE");
  await page.getByRole("dialog").getByRole("button", { name: "Elimina" }).click();
  expect((await categoryDeleted).status()).toBe(200);
  await expect(categoryRow).toHaveCount(0);
});

test("una categoria che contiene prodotti non si può eliminare", async ({ page, request }) => {
  const headers = { Authorization: `Bearer ${token}` };
  const categories = (await (await request.get(`${API_URL}/admin/categories?all=true`, { headers })).json()).data;
  const withProducts = categories.find((c: { products_count: number }) => c.products_count > 0);
  test.skip(!withProducts, "nessuna categoria con prodotti");

  await submitLogin(page, admin.email, admin.password);
  await expect(page).toHaveURL(/\/products$/);
  await page.goto("/admin/categories");

  const deleteButton = page
    .locator(`tr[data-category="${withProducts.name}"]`)
    .getByRole("button", { name: `Elimina ${withProducts.name}` });
  await expect(deleteButton).toBeDisabled();
});

test("dashboard e categorie admin senza violazioni axe (WCAG A/AA)", async ({ page }) => {
  await submitLogin(page, admin.email, admin.password);
  await expect(page).toHaveURL(/\/products$/);

  for (const path of ["/admin/dashboard", "/admin/categories"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const summary = results.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.help}`);
    expect(summary, path).toEqual([]);
  }
});
