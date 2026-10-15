# SW Store

E-commerce full-stack realizzato per il corso di Programmazione di Sistemi Web:

- `backend/`: API JSON in Ruby on Rails 8.1 su PostgreSQL. Autenticazione con JWT e login con Google.
- `frontend/`: SPA Angular 21 con Angular Material e TailwindCSS, in italiano e inglese.

Funzionalità: catalogo con ricerca, filtri e paginazione; carrello persistente sul server; checkout transazionale; storico ordini; wishlist. L'area admin gestisce prodotti con immagine, categorie, ordini e utenti, e ha una dashboard.

| Documento | Contenuto |
| --- | --- |
| [`backend/README.md`](backend/README.md) | Setup dettagliato del backend, variabili d'ambiente, test, Docker |
| [`frontend/README.md`](frontend/README.md) | Setup dettagliato del frontend, build localizzata, test unitari ed E2E |
| [`backend/API.md`](backend/API.md) | Contratto dell'API (endpoint, payload, errori) e credenziali dei dati demo |
| [`docs/ARCHITETTURA.md`](docs/ARCHITETTURA.md) | Modelli, autenticazione, flusso dell'ordine, gestione dello stato, scelte tecniche |
| [`docs/ANALISI.md`](docs/ANALISI.md) | Stato di ogni requisito delle specifiche |

## Prerequisiti

| Software | Versione |
| --- | --- |
| Ruby | 3.4.8 (`backend/.ruby-version`) |
| PostgreSQL | 17, con un ruolo che possa creare database |
| libvips, libpq | per le immagini dei prodotti e per la gem `pg` |
| Node.js / npm | 24.13 / 11.8 |

Serve anche la **master key** di Rails: non è nel repository, va richiesta al responsabile del progetto. Copiarla in `backend/config/master.key`, oppure passarla nella variabile `RAILS_MASTER_KEY`. Senza la master key il backend non si avvia.

## Avvio in sviluppo

### 1. Backend (http://localhost:3000)

```bash
cd backend
bundle install
# Database: per default il server e le credenziali del progetto (config/database.yml).
# Per un PostgreSQL locale: export DB_HOST=localhost DB_USERNAME=<utente> DB_PASSWORD=<password>
bin/rails db:create db:migrate db:seed   # oppure: bin/rails db:prepare
bin/rails server -p 3000
```

Il seed è idempotente e non distruttivo: crea categorie, prodotti con immagine e gli utenti demo, e si può rieseguire.

### 2. Frontend (http://localhost:4200)

```bash
cd frontend
npm ci
npx ng serve --port 4200
```

Il frontend va servito sulla porta 4200: è l'unica origine accettata dal CORS del backend (`FRONTEND_URL`).

### 3. Accesso

Utenti demo (creati dal seed):

| Ruolo | Email | Password |
| --- | --- | --- |
| Amministratore | `admin@swstore.com` | `password123` |
| Cliente | `cliente@swstore.com` | `password123` |

Il login con Google richiede, nella console Google Cloud, l'URI di reindirizzamento `http://localhost:3000/api/v1/auth/google_oauth2/callback`.

## Build di produzione

```bash
cd frontend
npx ng build                 # una build per lingua: dist/frontend/browser/it e /en
node e2e/serve-dist.mjs      # la serve su http://localhost:4200/it/ e /en/
```

`ng serve` serve una sola lingua: il selettore di lingua si prova sulla build.

### Docker (opzionale)

```bash
RAILS_MASTER_KEY=$(cat backend/config/master.key) docker compose up --build
```

Avvia PostgreSQL, l'API (http://localhost:3000) e il frontend (http://localhost:4200). Al primo avvio il backend crea il database e carica i dati demo. I Dockerfile non sono stati provati nell'ambiente di sviluppo, dove Docker non era disponibile.

## Test

| Area | Comando (dalla cartella dell'area) |
| --- | --- |
| Backend | `bin/rails test` (database `sw_store_test`; la prima volta `RAILS_ENV=test bin/rails db:create && bin/rails db:test:prepare`) |
| Backend | `bin/rubocop`, `bundle exec brakeman --no-pager -q`, `bin/bundler-audit` |
| Frontend | `npx ng test --watch=false` (unitari, Vitest) |
| Frontend | `npx ng build` |
| Frontend | `npx playwright test` (E2E: backend e frontend avviati, seed caricato, `npx playwright install chromium` la prima volta) |
| Frontend | `npm run e2e:i18n` (E2E del cambio lingua: backend avviato, `ng serve` fermo) |

La CI di GitHub (`.github/workflows/ci.yml`) esegue i test e i controlli del backend, poi i test unitari e la build del frontend. Richiede il secret di repository `RAILS_MASTER_KEY`.
