import { test, expect, APIRequestContext } from "@playwright/test";
import { e2eUser, submitLogin } from "./support/e2e-user";

const API_URL = process.env["E2E_API_URL"] ?? "http://localhost:3000/api/v1";

/** Login via API: restituisce il JWT, come quello che il backend mette nel fragment dopo Google. */
async function apiLogin(request: APIRequestContext): Promise<string> {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: { user: { email: e2eUser.email, password: e2eUser.password } },
  });
  expect(response.ok()).toBe(true);
  return response.headers()["authorization"].replace(/^Bearer\s+/, "");
}

test.describe("Login con Google (callback simulata)", () => {
  test("il token nel fragment autentica l'utente e sparisce dall'URL", async ({ page, request }) => {
    const token = await apiLogin(request);

    const meRequest = page.waitForRequest((r) => r.url().endsWith("/api/v1/auth/me"));
    await page.goto(`/oauth/callback#token=${encodeURIComponent(token)}`);

    expect((await meRequest).headers()["authorization"]).toBe(`Bearer ${token}`);
    await expect(page).toHaveURL(/\/products$/);
    expect(page.url()).not.toContain("token");
    await expect(page.getByRole("button", { name: "Menu utente" })).toBeVisible();

    // Il callback non resta nella cronologia con il token
    const historyHasToken = await page.evaluate(() => window.location.href.includes("token="));
    expect(historyHasToken).toBe(false);
  });

  test("callback senza token: si torna al login con il messaggio di errore", async ({ page }) => {
    await page.goto("/oauth/callback");

    await expect(page).toHaveURL(/\/login\?error=oauth_failed$/);
    await expect(page.getByTestId("oauth-error")).toContainText("Accesso con Google non riuscito");
  });

  test("token non valido: si torna al login con il messaggio di errore", async ({ page }) => {
    await page.goto("/oauth/callback#token=non-valido");

    await expect(page).toHaveURL(/\/login\?error=oauth_failed$/);
    await expect(page.getByTestId("oauth-error")).toBeVisible();
  });

  test("accesso annullato su Google: messaggio dedicato", async ({ page }) => {
    await page.goto("/login?error=oauth_canceled");

    await expect(page.getByTestId("oauth-error")).toContainText("Accesso con Google annullato");
  });
});

// Il logout revoca tutti i token dell'utente (strategia JTI): per non invalidare le sessioni
// degli altri test in parallelo si usa un utente dedicato, creato via API se non esiste ancora.
const logoutUser = {
  email: process.env["E2E_LOGOUT_USER_EMAIL"] ?? "e2e.logout@swstore.test",
  password: process.env["E2E_LOGOUT_USER_PASSWORD"] ?? e2eUser.password,
};

test.describe("Logout", () => {
  test.beforeAll(async ({ request }) => {
    const signup = await request.post(`${API_URL}/auth/signup`, {
      data: {
        user: {
          email: logoutUser.email,
          password: logoutUser.password,
          password_confirmation: logoutUser.password,
          first_name: "E2E",
          last_name: "Logout",
        },
      },
    });
    // 200: utente creato; 422: esiste già
    expect([200, 422]).toContain(signup.status());
  });

  test("il logout chiude la sessione e revoca il token sul backend", async ({ page, request }) => {
    await submitLogin(page, logoutUser.email, logoutUser.password);
    await expect(page).toHaveURL(/\/products$/);
    const token = await page.evaluate(() => JSON.parse(localStorage.getItem("sw-store") ?? "{}").jwtToken);
    expect(token).toBeTruthy();

    const logoutRequest = page.waitForRequest((r) => r.url().endsWith("/api/v1/auth/logout"));
    await page.getByRole("button", { name: "Menu utente" }).click();
    await page.getByRole("menuitem", { name: "Disconnettiti" }).click();

    expect((await logoutRequest).method()).toBe("POST");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("link", { name: "Accedi" })).toBeVisible();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("sw-store") ?? "{}").jwtToken)).toBeNull();

    // Il token non è più accettato dal backend
    const me = await request.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    expect(me.status()).toBe(401);
  });
});
