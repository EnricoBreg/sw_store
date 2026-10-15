# SW Store – Frontend

SPA Angular dell'e-commerce SW Store: catalogo, carrello persistente, checkout, ordini, wishlist, area admin e interfaccia in italiano e inglese. Parla con l'API Rails di `../backend` (contratto in `../backend/API.md`).

Stack: Angular 21 (componenti standalone, signal), Angular Material, TailwindCSS, `@angular/localize` (i18n a build time), Vitest (unit), Playwright (E2E).

## Prerequisiti

| Strumento   | Versione usata nello sviluppo |
| ----------- | ----------------------------- |
| Node.js     | 24.13                         |
| npm         | 11.8                          |
| Angular CLI | 21.2 (inclusa nelle dipendenze: si usa con `npx ng`) |

Per usare l'app serve il backend avviato su `http://localhost:3000` (vedi `../backend/README.md`). Il backend accetta richieste CORS solo dall'origine della SPA (`FRONTEND_URL`, default `http://localhost:4200`), quindi il frontend va servito sulla porta **4200**.

## Installazione

```bash
npm ci
```

## Avvio in sviluppo

```bash
npx ng serve --port 4200
```

Poi aprire http://localhost:4200. Il server di sviluppo serve una sola lingua (l'italiano, lingua sorgente) e ricompila a ogni modifica. Il selettore di lingua funziona solo sulla build localizzata (vedi sotto).

## URL del backend

L'URL base dell'API è in un solo punto, `src/environments/environment.ts`:

```ts
export const environment = {
  apiUrl: "http://localhost:3000/api/v1",
};
```

Viene letto tramite il token `API_URL` (`src/app/core/http/api-config.ts`) dall'interceptor che antepone l'URL a tutte le chiamate, dal login con Google e dalla verifica del token OAuth. Per puntare a un altro backend basta modificare questo valore prima della build (il `Dockerfile` lo fa con l'argomento `API_URL`).

## Build di produzione (it + en)

```bash
npx ng build
```

Produce una build per lingua in `dist/frontend/browser/it/` e `dist/frontend/browser/en/`, con base href `/it/` e `/en/`. Per servirla in locale c'è un piccolo server statico Node, senza dipendenze:

```bash
npx ng build && node e2e/serve-dist.mjs
```

Serve http://localhost:4200/it/ e http://localhost:4200/en/ con fallback SPA (le rotte di Angular vengono servite dall'`index.html` della lingua) e reindirizza `/` a `/it/`. Usa la porta 4200: va fermato `ng serve`.

In alternativa c'è il `Dockerfile` (build con Node, poi nginx con le stesse regole):

```bash
docker build -t sw-store-frontend --build-arg API_URL=http://localhost:3000/api/v1 .
docker run -p 4200:80 sw-store-frontend
```

## Internazionalizzazione

I testi sono marcati con `i18n="@@id"` nei template e con `$localize` nel codice. Le traduzioni sono in `src/locale/`: `messages.xlf` (sorgente, italiano) e `messages.en.xlf` (inglese).

Dopo aver aggiunto o modificato testi:

```bash
npm run i18n
```

Estrae i testi e aggiorna entrambi i file (`ng-extract-i18n-merge`); le nuove voci vanno poi tradotte in `messages.en.xlf`. La build segnala con un warning eventuali traduzioni mancanti.

## Test unitari

```bash
npx ng test --watch=false
```

Vitest con jsdom: non serve un browser né il backend.

## Test E2E (Playwright)

Prerequisiti:

1. backend avviato su `http://localhost:3000` con i dati demo (`bin/rails db:seed`), che creano anche gli utenti dei test;
2. frontend avviato con `npx ng serve --port 4200`;
3. browser di Playwright installato una volta: `npx playwright install chromium`.

```bash
npx playwright test        # oppure: npm run e2e
```

I test non lasciano dati: svuotano i carrelli che usano, annullano gli ordini che creano (lo stock viene ripristinato) ed eliminano categorie e prodotti creati nell'area admin. Gli utenti usati (sovrascrivibili con variabili d'ambiente):

| Variabile                                                 | Default                     | Uso                                              |
| --------------------------------------------------------- | --------------------------- | ------------------------------------------------ |
| `E2E_USER_EMAIL` / `E2E_USER_PASSWORD`                     | `e2e.user@swstore.test` / `E2eTest-2026!` | utente base (login, carrello)        |
| `E2E_CHECKOUT_USER_EMAIL` / `E2E_CHECKOUT_USER_PASSWORD`   | `e2e.checkout@swstore.test` / `E2eTest-2026!` | checkout e ordini (creato al primo avvio se manca) |
| `E2E_LOGOUT_USER_EMAIL` / `E2E_LOGOUT_USER_PASSWORD`       | `e2e.logout@swstore.test` / `E2eTest-2026!` | logout: revoca tutti i token dell'utente, quindi è separato |
| `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`                   | `admin@swstore.com` / `password123` | area admin                         |
| `E2E_API_URL`                                             | `http://localhost:3000/api/v1` | chiamate dirette all'API (preparazione e pulizia) |

### E2E della localizzazione

Girano sulla build di produzione, che contiene entrambe le lingue. Con il backend avviato e **`ng serve` fermo** (il server statico usa la porta 4200):

```bash
npm run e2e:i18n
```

Esegue `ng build` e poi Playwright con `playwright.i18n.config.ts`, che avvia e ferma da solo `node e2e/serve-dist.mjs`.

## Struttura

```
src/app/
  core/
    http/          API service (uno per risorsa), interceptor, gestione errori, URL dell'API
    services/      stato dell'app con signal (auth, carrello, wishlist, ordini, admin...)
    models/        tipi e normalizzazione delle risposte (decimali da stringa a numero)
    guards/        loggedInGuard, notLoggedInGuard, adminGuard
    i18n/          lingue supportate, selettore, testi del paginatore
    state/         sessione di autenticazione (unico dato in localStorage)
  components/      componenti riutilizzabili
  pages/           pagine (rotte caricate in lazy loading), admin/ per l'area amministrativa
  layout/          header, layout dell'area admin
e2e/               test Playwright e server statico della build
```

Le scelte architetturali sono descritte in [`../docs/ARCHITETTURA.md`](../docs/ARCHITETTURA.md).
