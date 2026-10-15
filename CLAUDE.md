# SW Store

Progetto del corso di Programmazione di Sistemi Web: un e-commerce composto da un'API JSON (Rails) e una SPA (Angular).

## Documenti di riferimento

| Documento | Ruolo | Chi lo aggiorna |
| --- | --- | --- |
| `docs/Progetto_di_sistemi_web_Specifiche.pdf` | Fonte dei requisiti. In caso di dubbio vince questo. | Nessuno (sola lettura) |
| `docs/ANALISI.md` | Stato dei requisiti: cosa è fatto, parziale, mancante. | PM, a ogni task completato |
| `backend/API.md` | Contratto API, unica fonte di verità sugli endpoint. | `backend-dev` |

## Team e ownership

Il lavoro è svolto da un agent team. L'utente parla solo con il PM.

| Ruolo | Chi | Può modificare | Responsabilità |
| --- | --- | --- | --- |
| PM (team lead) | sessione principale | `docs/`, `.claude/`, `CLAUDE.md`, `.mcp.json` | Pianifica, assegna i task, verifica, committa, riferisce all'utente. Non scrive codice applicativo. |
| Backend | teammate `backend` (tipo `backend-dev`) | solo `backend/` | API Rails, `backend/API.md`, test backend, server Rails. |
| Frontend | teammate `frontend` (tipo `frontend-dev`) | solo `frontend/` | SPA Angular, test unitari ed E2E, verifiche visive, server Angular. |

Regole di collaborazione:

- Ogni agent modifica **solo** la propria cartella. Le definizioni degli agent sono in `.claude/agents/`.
- `frontend-dev` usa `backend/API.md` in sola lettura. Se manca qualcosa lo chiede al PM o a `backend`, non inventa il contratto.
- Le modifiche che toccano entrambe le parti passano dal PM: **prima** si aggiorna `backend/API.md`, **poi** il frontend lo implementa.
- Si ferma il lavoro e si chiede all'utente, tramite il PM, per: requisiti ambigui nelle specifiche, scelte che cambiano l'architettura, verifiche che non passano dopo due tentativi, qualsiasi operazione distruttiva sul database.

## Stack e struttura

### Backend (`backend/`)

- Rails 8.1 (Ruby 3.4), PostgreSQL, Devise + devise-jwt, OmniAuth Google, Pagy, jsonapi-serializer.
- Controller API in `app/controllers/api/v1/`: pubblici; `users/` per l'utente autenticato; `admin/` per gli amministratori. Autenticazione in `app/controllers/auth/`.
- Formato delle risposte standardizzato da `app/controllers/concerns/api_responses.rb` (`render_success` / `render_error`). Ogni nuovo endpoint lo usa.
- Controllo degli accessi in `app/controllers/concerns/authorization.rb` (`authenticated_access_only`, `admin_access_only`).
- Messaggi API localizzati (it/en) in base all'header `Accept-Language`. Ogni nuovo messaggio va tradotto in entrambe le lingue.

### Frontend (`frontend/`)

- Angular 21, componenti standalone con template inline, Angular Material, TailwindCSS, i18n it/en, Vitest.
- Codice in `src/app/`: `core/` (servizi, modelli, pipe), `components/`, `pages/`, `layout/`.
- Traduzioni in `src/locale/`: `messages.xlf` (sorgente italiano) e `messages.en.xlf`. Dopo aver aggiunto o modificato testi marcati per l'i18n eseguire `npm run i18n` (estrazione + merge con `ng-extract-i18n-merge`) e completare le traduzioni inglesi.
- Test E2E Playwright in `frontend/e2e/` (fuori da `src/`, così non vengono raccolti da Vitest).

## Ambiente di sviluppo

L'ambiente è attivo e utilizzabile: le applicazioni si possono avviare e il database è disponibile.

| Servizio | Avvio (dalla cartella dell'area) | URL | Gestito da |
| --- | --- | --- | --- |
| PostgreSQL | già in esecuzione su host remoto, non va avviato | `100.82.90.49:5432` (db `sw_store_dev`, utente `swstoredev`; config in `backend/config/database.yml`) | — |
| API Rails | `bin/rails s -p 3000` | http://localhost:3000 | `backend` |
| SPA Angular | `npx ng serve --port 4200` | http://localhost:4200 | `frontend` |

- I server (`rails s`, `ng serve`) non terminano da soli: vanno **sempre avviati in background** e fermati quando non servono più.
- Prima di avviare un server controllare che la porta sia libera (es. `ss -ltnp | grep -E ':3000|:4200'`). Se il server è già attivo, riutilizzarlo.
- Ogni server è gestito solo dal suo owner (vedi tabella). Chi ha bisogno dell'altro server lo chiede all'owner.
- Per verificare un endpoint: `curl` su `http://localhost:3000/api/v1/...` con il server avviato.
- Al primo avvio il PM verifica che porte e URL di questa tabella siano corretti e la aggiorna se necessario.
- Verifica del 2026-10-15: DB di sviluppo raggiungibile; porte 3000 e 4200 libere e coerenti con `puma.rb`, CORS (`localhost:4200`) e URL API del frontend (`localhost:3000/api/v1`). Il database di test `sw_store_test` è stato creato in T1 sullo stesso host.

### Database: regole

- **Ammessi:** `bin/rails db:migrate`, query di sola lettura (`bin/rails runner`, `bin/rails dbconsole`). `bin/rails db:seed` è ammesso **solo** dopo che `db/seeds.rb` sarà reso non distruttivo (oggi esegue `destroy_all`).
- **Database di test:** creazione di `sw_store_test` e caricamento dello schema (`db:create`, `db:test:prepare`, `db:schema:load` con `RAILS_ENV=test`) autorizzati dall'utente il 2026-10-15.
- **Vietati senza l'ok esplicito dell'utente:** `db:drop`, `db:reset`, `db:schema:load`, `db:rollback` su migrazioni già committate, `TRUNCATE`/`DELETE` di massa sul database di sviluppo.
- I test usano **solo** il database di test (`RAILS_ENV=test`), mai quello di sviluppo.
- Ogni migrazione nuova deve essere reversibile e committata insieme allo `schema.rb` aggiornato.

## Test della UI

- **E2E (Playwright):** test in `frontend/e2e/`, eseguiti da `frontend/` con `npx playwright test`. Richiedono backend e frontend avviati. Coprono i flussi principali (es. login, catalogo, carrello, checkout), non ogni componente.
- **Verifiche visive (server MCP `playwright`):** aprire http://localhost:4200, eseguire il flusso, fare screenshot e controllarli per errori evidenti (pagine vuote, elementi sovrapposti, messaggi di errore, testi non tradotti). Utile anche per riprodurre un bug prima di scrivere il test.
- Test E2E e verifiche visive sono responsabilità del teammate `frontend`.
- I file generati da Playwright (`test-results/`, `playwright-report/`, `.playwright-mcp/`) non vanno committati.

## Comandi di verifica

| Area | Comando (dalla cartella dell'area) | Note |
| --- | --- | --- |
| Backend | `bin/rails test` | Test Minitest |
| Backend | `bin/rubocop` | Lint, controllato in CI |
| Backend | `bundle exec brakeman --no-pager -q` | Analisi di sicurezza, controllata in CI |
| Frontend | `npx ng test --watch=false` | Test unitari Vitest |
| Frontend | `npx ng build` | Build di produzione (it + en) |
| Frontend | `npx playwright test` | E2E, con entrambi i server avviati |

### Baseline al tag `baseline-pre-team`

- `bin/rails test`: ~~0 test~~ dal T1 (2026-10-15) 24 test verdi. Richiede il DB `sw_store_test` (setup una tantum: `RAILS_ENV=test bin/rails db:create && bin/rails db:test:prepare`); credenziali sovrascrivibili con `DB_USERNAME` / `DB_PASSWORD`. Il ruolo DB non è superuser: per questo `test/support/fixture_load_order.rb` ordina il caricamento delle fixture in base alle chiavi esterne.
- `bin/rubocop`: nessuna offesa.
- `brakeman`: 1 warning (Weak, Redirect in `auth/omniauth_callbacks_controller.rb`). `bin/brakeman` esce con codice 5 perché forza `--ensure-latest` e la gem non è all'ultima versione: usare il comando della tabella.
- `npx ng test`: ~~2 test su 3 falliscono in `src/app/app.spec.ts`~~ risolto in T5 (2026-10-15): tutti verdi.
- `npx ng build`: ok.
- `npx playwright test`: configurato; dal T5 tutti verdi (9 dopo T9). Gli E2E usano l'utente `e2e.user@swstore.test` del DB di sviluppo (override con `E2E_USER_EMAIL` / `E2E_USER_PASSWORD`); il seed non distruttivo (T8) dovrà crearlo.

Quando un fallimento della baseline viene risolto, aggiornare questa sezione.

## Definizione di "task completato"

Un task è completato solo quando **tutte** queste condizioni sono vere:

1. Il codice soddisfa il requisito delle specifiche a cui il task si riferisce.
2. I comandi di verifica dell'area toccata non introducono nuovi fallimenti rispetto alla baseline.
3. Il codice nuovo ha test: Minitest per il backend, Vitest per la logica del frontend, E2E Playwright per le funzionalità visibili all'utente.
4. Se il task cambia le API, `backend/API.md` è aggiornato.
5. Se il task tocca backend e frontend, il flusso è stato verificato dal vivo con entrambi i server avviati (curl sull'API + E2E o verifica visiva).
6. Il PM ha aggiornato `docs/ANALISI.md` e fatto il commit.

## Regole git

- Si lavora **solo** sul branch `development`.
- **Nessuno** fa `checkout`, `switch`, `merge`, `rebase` o `push`. I teammate non eseguono alcun comando git che modifichi il repository.
- **Solo il PM committa**: un commit per ogni task completato.
- Il messaggio di commit inizia con il prefisso `backend:` o `frontend:` in base all'area del task (`chore:` o `docs:` per configurazione e documentazione).
- Nei messaggi di commit non inserire **mai** `Co-Authored-By` né altre righe di attribuzione.