import { defineConfig, devices } from "@playwright/test";

/**
 * E2E della localizzazione (it/en): girano sulla build di produzione, che contiene
 * entrambe le lingue in /it/ e /en/. Il server statico viene avviato da Playwright
 * sulla porta 4200 (l'unica ammessa dal CORS del backend), quindi ng serve va fermato.
 *   npm run e2e:i18n   (= ng build + questo config)
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: /i18n\.spec\.ts$/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:4200",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "node e2e/serve-dist.mjs",
    url: "http://localhost:4200/it/",
    reuseExistingServer: false,
  },
});
