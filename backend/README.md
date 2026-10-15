# SW Store — Backend (API Rails)

API JSON dell'e-commerce SW Store, usata dalla SPA Angular in `../frontend`.
Il contratto degli endpoint (payload, risposte, errori, autenticazione) è in [`API.md`](API.md).

## Prerequisiti

| Software | Versione | Note |
| -------- | -------- | ---- |
| Ruby | 3.4.8 | vedi `.ruby-version` (es. con mise, rbenv o asdf) |
| Bundler | incluso con Ruby | |
| Rails | 8.1.3 | installato da `bundle install` |
| PostgreSQL | 17 (testato con 17.7) | serve un ruolo con permesso `CREATEDB` |
| libvips | 8.x | anteprime delle immagini prodotto (Active Storage) |
| libpq | client PostgreSQL | per compilare la gem `pg` (`libpq-dev` su Debian/Ubuntu) |

Stack principale: Devise + devise-jwt (autenticazione con JWT), OmniAuth Google, Pagy (paginazione), jsonapi-serializer, rack-cors.

## Configurazione

### Credentials e master key

Segreti (`secret_key_base`, `devise_jwt_secret_key`, `oauth_google_client_id`, `oauth_google_client_secret`) sono in `config/credentials.yml.enc`, cifrato con la master key.

- In sviluppo la chiave sta in `config/master.key` (ignorato da git, va ricevuto a parte dal responsabile del progetto).
- In alternativa, o in produzione/Docker, si passa con la variabile `RAILS_MASTER_KEY`.
- Per vedere o modificare le credentials: `bin/rails credentials:show` / `bin/rails credentials:edit`.

Senza master key l'app non si avvia (le chiavi JWT e OAuth sono lette all'avvio).

### Variabili d'ambiente

| Variabile | Ambiente | Default | Descrizione |
| --------- | -------- | ------- | ----------- |
| `RAILS_MASTER_KEY` | tutti | contenuto di `config/master.key` | decifra le credentials |
| `DB_HOST`, `DB_PORT` | tutti | sviluppo/test: `100.82.90.49`, `5432`; produzione: `localhost`, `5432` | server PostgreSQL |
| `DB_USERNAME`, `DB_PASSWORD` | test, produzione | test: `swstoredev`; produzione: `sw_store` e nessuna password | credenziali del database |
| `DB_NAME` | produzione | `sw_store_production` | database principale; Solid Cache/Queue/Cable usano `<DB_NAME>_cache`, `_queue`, `_cable` |
| `FRONTEND_URL` | tutti | `http://localhost:4200` | origine consentita da CORS e destinazione dei redirect del login Google |
| `BACKEND_URL` | produzione | `http://localhost:3000` | URL pubblico dell'API, usato per generare `image_url` |
| `SOLID_QUEUE_IN_PUMA` | produzione | non impostata | se `true` i job in background (analisi immagini) girano dentro Puma |
| `PORT` | tutti | `3000` | porta di Puma |

Le impostazioni di sviluppo (database `sw_store_dev`) sono in `config/database.yml`.

### Login con Google

Nella console Google Cloud il client OAuth deve avere come URI di reindirizzamento autorizzato
`<BACKEND_URL>/api/v1/auth/google_oauth2/callback` (in sviluppo `http://localhost:3000/api/v1/auth/google_oauth2/callback`).

## Setup del database

```bash
bundle install
bin/rails db:create      # crea sw_store_dev (e sw_store_test)
bin/rails db:migrate     # applica le migrazioni
bin/rails db:seed        # dati demo: categorie, prodotti con immagine, utenti
```

Il seed è **idempotente e non distruttivo**: crea solo ciò che manca e non modifica né cancella dati esistenti, quindi si può rieseguire. Credenziali degli utenti demo (admin, cliente, utenti E2E) in `API.md`, sezione *Dati demo*.

Con `bin/rails db:prepare` si fanno create, migrate e seed in un solo comando (il seed viene eseguito solo alla creazione del database).

## Avvio

```bash
bin/rails server -p 3000
```

L'API risponde su `http://localhost:3000/api/v1` (health check: `GET /up`). Il frontend in sviluppo gira su `http://localhost:4200`, l'unica origine accettata da CORS se `FRONTEND_URL` non è impostata.

## Test e controlli di qualità

```bash
RAILS_ENV=test bin/rails db:create   # solo la prima volta
bin/rails db:test:prepare            # carica lo schema nel database di test
bin/rails test                       # test Minitest (modelli, request, seed)
bin/rubocop                          # stile (rubocop-rails-omakase)
bundle exec brakeman --no-pager -q   # analisi di sicurezza statica
```

- I test usano solo il database `sw_store_test`. Credenziali sovrascrivibili con `DB_USERNAME`/`DB_PASSWORD`.
- Il ruolo PostgreSQL non deve essere superuser: `test/support/fixture_load_order.rb` carica le fixture rispettando le chiavi esterne.
- Usare `bundle exec brakeman` e non `bin/brakeman`: quest'ultimo aggiunge `--ensure-latest` e fallisce se la gem non è all'ultima versione.

## Docker

Il `Dockerfile` produce un'immagine di produzione (PostgreSQL, libvips, Thruster davanti a Puma sulla porta 80).

```bash
docker build -t sw-store-api .
docker run -d -p 3000:80 \
  -e RAILS_MASTER_KEY=$(cat config/master.key) \
  -e DB_HOST=<host> -e DB_USERNAME=<utente> -e DB_PASSWORD=<password> \
  -e FRONTEND_URL=http://localhost:4200 -e BACKEND_URL=http://localhost:3000 \
  -e SOLID_QUEUE_IN_PUMA=true \
  --name sw-store-api sw-store-api
```

All'avvio il container esegue `bin/rails db:prepare` (crea i database, applica lo schema e, la prima volta, carica i dati demo). Le immagini caricate sono in `/rails/storage`: montare un volume per non perderle. Per l'ambiente completo (database, API e frontend) c'è il `docker-compose.yml` nella root del repository.

## Struttura

- `app/controllers/api/v1/`: endpoint pubblici; `users/` per l'utente autenticato; `admin/` per gli amministratori.
- `app/controllers/auth/`: login, logout, registrazione, callback OAuth Google.
- `app/controllers/concerns/`: formato delle risposte (`api_responses.rb`), controllo degli accessi (`authorization.rb`), ordinamento (`sortable.rb`), filtro per stato degli ordini.
- `app/models/`: Product, Category, Cart, CartItem, Order, OrderItem, User, Address, Wishlist, WishlistItem.
- `app/serializers/`: forma JSON delle risorse.
- `config/locales/`: messaggi in italiano e inglese (scelti con l'header `Accept-Language`).
- `db/seeds.rb`, `db/seeds/images/`: dati demo.
