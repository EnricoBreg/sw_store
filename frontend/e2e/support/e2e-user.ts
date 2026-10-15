import { expect, Page } from "@playwright/test";

// Utente di prova usato dagli E2E: sovrascrivibile con le variabili d'ambiente
export const e2eUser = {
  email: process.env["E2E_USER_EMAIL"] ?? "e2e.user@swstore.test",
  password: process.env["E2E_USER_PASSWORD"] ?? "E2eTest-2026!",
};

/** Compila e invia il form di login. */
export async function submitLogin(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator("input[formcontrolname=email]").fill(email);
  await page.locator("input[formcontrolname=password]").fill(password);
  await page.locator("form button[type=submit]").click();
}

/** Login con l'utente e2e: al termine si è reindirizzati al catalogo. */
export async function loginAsE2eUser(page: Page) {
  await submitLogin(page, e2eUser.email, e2eUser.password);
  await expect(page).toHaveURL(/\/products$/);
}
