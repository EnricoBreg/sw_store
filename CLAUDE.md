# SW Store

Progetto del corso di Programmazione di Sistemi Web: un e-commerce composto da un'API JSON (Rails) e una SPA (Angular).

## Documenti di riferimento

- **Specifiche del progetto:** `docs/Progetto_di_sistemi_web_Specifiche.pdf`, la fonte dei requisiti.
- **Stato dei requisiti:** `docs/ANALISI.md`, con l'elenco dei requisiti, cosa è fatto e cosa manca. Va aggiornato dal PM quando un task viene completato.
- **Contratto API:** `backend/API.md`, l'unica fonte di verità sugli endpoint tra backend e frontend.

## Struttura e ownership

| Cartella    | Contenuto                                                                                                     | Owner          |
| ----------- | ------------------------------------------------------------------------------------------------------------- | -------------- |
| `backend/`  | API Rails 8.1 (Ruby 3.4), PostgreSQL, Devise + devise-jwt, OmniAuth Google, Pagy, jsonapi-serializer          | `backend-dev`  |
| `frontend/` | SPA Angular 21, componenti standalone con template inline, Angular Material, TailwindCSS, i18n it/en, Vitest  | `frontend-dev` |
| `docs/`     | Specifiche e analisi dei requisiti                                                                            | PM             |
| `.claude/`  | Configurazione del team (settings, definizioni degli agent)                                                   | PM             |

- Ogni agent modifica solo la propria cartella. Gli agent sono definiti in `.claude/agents/`.
- `backend/API.md` è scritto e mantenuto da `backend-dev`; `frontend-dev` lo usa in sola lettura.
- Le modifiche che toccano entrambe le parti passano dal PM: prima si aggiorna il contratto, poi il frontend lo implementa.

### Backend (`backend/`)

- Controller API in `app/controllers/api/v1/` (pubblici, `users/` per l'utente autenticato, `admin/` per gli amministratori), autenticazione in `app/controllers/auth/`.
- Formato delle risposte standardizzato da `app/controllers/concerns/api_responses.rb` (`render_success` / `render_error`).
- Controllo degli accessi in `app/controllers/concerns/authorization.rb` (`authenticated_access_only`, `admin_access_only`).
- Messaggi API localizzati (it/en) in base all'header `Accept-Language`.

### Frontend (`frontend/`)

- Codice in `src/app/` (`core/` servizi, modelli, pipe; `components/`; `pages/`; `layout/`).
- Traduzioni in `src/locale/`: `messages.xlf` (sorgente italiano) e `messages.en.xlf`. `npm run i18n` estrae e fa il merge con `ng-extract-i18n-merge`.

## Comandi di verifica

| Area     | Comando (dalla cartella dell'area) | Note                                                                 |
| -------- | ---------------------------------- | -------------------------------------------------------------------- |
| Backend  | `bin/rails test`                   | Test Minitest                                                         |
| Backend  | `bin/rubocop`                      | Lint, controllato in CI                                               |
| Backend  | `bundle exec brakeman --no-pager -q` | Analisi di sicurezza, controllata in CI                             |
| Frontend | `npx ng test --watch=false`        | Test Vitest                                                           |
| Frontend | `npx ng build`                     | Build di produzione (it + en)                                         |

### Baseline al tag `baseline-pre-team`

- `bin/rails test`: 0 test (la cartella `backend/test/` non esiste ancora).
- `bin/rubocop`: nessuna offesa.
- `brakeman`: 1 warning (Weak, Redirect in `auth/omniauth_callbacks_controller.rb`). `bin/brakeman` esce con codice 5 perché forza `--ensure-latest` e la gem non è all'ultima versione.
- `npx ng test`: 2 test su 3 falliscono in `src/app/app.spec.ts` (spec generato dalla CLI, manca `provideRouter`: `NG0201 No provider found for ActivatedRoute`).
- `npx ng build`: ok.

Un task è "verde" quando non introduce nuovi fallimenti rispetto a questa baseline. Quando un fallimento della baseline viene risolto, aggiornare questa sezione.

## Regole git

- Si lavora **solo** sul branch `development`.
- **Nessuno** fa `checkout`, `switch`, `merge`, `rebase` o `push`. Gli agent non eseguono alcun comando git che modifichi il repository.
- **Solo il PM committa**: un commit per ogni task completato, dopo che i comandi di verifica sono verdi.
- Il messaggio di commit inizia con il prefisso `backend:` o `frontend:` in base all'area del task.
- Nei messaggi di commit non inserire **mai** `Co-Authored-By` né altre righe di attribuzione.
