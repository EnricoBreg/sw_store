import { test, expect, Page } from "@playwright/test";
import { e2eUser } from "./support/e2e-user";

// Gira sulla build localizzata (/it/ e /en/): npm run e2e:i18n

async function switchLanguage(page: Page, locale: "it" | "en") {
  await page.getByTestId("language-selector").click();
  await page.getByTestId(`language-${locale}`).click();
}

test.describe("Internazionalizzazione", () => {
  test("cambiando lingua si resta sulla stessa pagina, con query string e testi tradotti", async ({ page }) => {
    await page.goto("/it/products?q=steel");
    await expect(page.locator("html")).toHaveAttribute("lang", "it");
    await expect(page.getByRole("heading", { name: "I nostri prodotti" })).toBeVisible();
    await expect(page.getByText("Elementi per pagina:")).toBeVisible();

    await switchLanguage(page, "en");

    await expect(page).toHaveURL(/\/en\/products\?q=steel$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { name: "Our Products" })).toBeVisible();
    await expect(page.getByTestId("products-search")).toHaveValue("steel");
    // Paginatore localizzato (MatPaginatorIntl)
    await expect(page.getByText("Items per page:")).toBeVisible();

    // E si può tornare all'italiano
    await switchLanguage(page, "it");
    await expect(page).toHaveURL(/\/it\/products\?q=steel$/);
    await expect(page.getByRole("heading", { name: "I nostri prodotti" })).toBeVisible();
  });

  test("in inglese i messaggi di errore del backend arrivano in inglese", async ({ page }) => {
    await page.goto("/it/login");
    await expect(page.getByRole("heading", { name: "Accedi al tuo account" })).toBeVisible();

    await switchLanguage(page, "en");
    await expect(page).toHaveURL(/\/en\/login$/);
    await expect(page.getByRole("heading", { name: "Log in to your account" })).toBeVisible();

    const loginRequest = page.waitForRequest((r) => r.url().includes("/api/v1/auth/login"));
    const loginResponse = page.waitForResponse((r) => r.url().includes("/api/v1/auth/login"));

    await page.locator("input[formcontrolname=email]").fill(e2eUser.email);
    await page.locator("input[formcontrolname=password]").fill("password-sbagliata");
    await page.locator("form button[type=submit]").click();

    expect((await loginRequest).headers()["accept-language"]).toBe("en");
    const body = await (await loginResponse).json();
    const backendMessage: string = body.message ?? body.error;

    const errorPanel = page.locator("[appErrorPanel]");
    await expect(errorPanel).toContainText(backendMessage);
    await expect(errorPanel).toContainText(/invalid/i);
  });

  test("il selettore di lingua è accessibile e indica la lingua corrente", async ({ page }) => {
    await page.goto("/en/products");

    const trigger = page.getByRole("button", { name: "Change language" });
    await expect(trigger).toBeVisible();
    await trigger.click();

    await expect(page.getByRole("menuitem", { name: "English" })).toHaveAttribute("aria-current", "true");
    await expect(page.getByRole("menuitem", { name: "Italiano" })).toHaveAttribute("lang", "it");
  });
});
