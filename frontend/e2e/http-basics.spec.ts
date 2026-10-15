import { test, expect } from "@playwright/test";
import { e2eUser, loginAsE2eUser, submitLogin } from "./support/e2e-user";

const API_PATH = "/api/v1/";

test.describe("Basi HTTP", () => {
  test("catalogo da ospite: lista caricata senza header Authorization", async ({ page }) => {
    const apiRequests: { url: string; authorization?: string; language?: string }[] = [];
    page.on("request", (request) => {
      if (request.url().includes(API_PATH)) {
        const headers = request.headers();
        apiRequests.push({
          url: request.url(),
          authorization: headers["authorization"],
          language: headers["accept-language"],
        });
      }
    });

    await page.goto("/products");

    await expect(page.locator("app-product-card").first()).toBeVisible();
    expect(apiRequests.some((r) => r.url.includes(`${API_PATH}products`))).toBe(true);
    for (const request of apiRequests) {
      expect(request.authorization, request.url).toBeUndefined();
      expect(request.language, request.url).toBe("it");
    }
  });

  test("login con password errata: compare il messaggio del backend", async ({ page }) => {
    const loginResponse = page.waitForResponse((r) => r.url().includes(`${API_PATH}auth/login`));

    await submitLogin(page, e2eUser.email, "password-sbagliata");

    const response = await loginResponse;
    expect(response.status()).toBe(401);
    const body = await response.json();
    const backendMessage: string = body.message ?? body.error;

    const errorPanel = page.locator("[appErrorPanel]");
    await expect(errorPanel).toBeVisible();
    await expect(errorPanel).toContainText(backendMessage);
    await expect(page).toHaveURL(/\/login$/);
  });

  test("utente loggato: un prodotto inesistente porta a /not-found", async ({ page }) => {
    await loginAsE2eUser(page);

    const productRequest = page.waitForRequest((r) => r.url().includes(`${API_PATH}products/999999`));
    await page.goto("/products/999999");

    // Le richieste dell'utente autenticato portano il token
    expect((await productRequest).headers()["authorization"]).toMatch(/^Bearer .+/);
    await expect(page).toHaveURL(/\/not-found$/);
  });
});
