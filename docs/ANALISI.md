# Analisi dei requisiti – SW Store

Stato del progetto rispetto a `docs/Progetto_di_sistemi_web_Specifiche.pdf`.
Ultimo aggiornamento: 2026-10-15 (Fase 2: chiusi T0, T1, T5, T9, T10a).
Path backend relativi a `backend/app/` salvo indicazione, path frontend relativi a `frontend/src/app/`. Tutte le rotte hanno prefisso `/api/v1`.

Legenda stato: **fatto** / **parziale** / **mancante**.

## Stato delle verifiche (baseline)

| Comando | Esito |
|---|---|
| `bin/rails test` | Dopo T1: 24 test, 67 asserzioni, tutti verdi |
| `bin/rubocop` | 88 file, 0 offese |
| `brakeman` | 1 warning (Redirect, `auth/omniauth_callbacks_controller.rb:8`), come la baseline |
| `npx ng test --watch=false` | Dopo T10a: 61/61 verdi |
| `npx ng build` | ok (it + en); warning sul budget (initial 719 kB > 500 kB) |
| `npx playwright test` | Dopo T10a: 9/9 verdi; `npm run e2e:i18n` 3/3 verdi |

## Decisioni dell'utente (2026-10-15)

- **S1:** la chiave viene tolta dal README (fatto); master key e segreto JWT vengono rigenerati; il nuovo client secret Google è fornito dall'utente in `docs/.new_google_secret.txt` (ignorato da git). Nessuna riscrittura della history.
- **Carrello:** `PATCH`/`DELETE /cart/items/:id` usano l'id del CartItem, come da specifiche (modifica incompatibile: prima backend + `API.md`, poi frontend).
- **Funzionalità avanzate:** si completano Area admin (7.1) e i18n (7.5). Coupon esclusi per ora.
- **DB di test:** ok a creare `sw_store_test` e caricarvi lo schema.

## Sicurezza (bloccanti)

| # | Problema | Gravità | Parte | File | Note |
|---|---|---|---|---|---|
| S1 | (risolto in T0: rimossa dal README, segreti ruotati; la vecchia chiave resta nella history) Master key Rails in chiaro nel `README.md` di root (commit `f0413a3`, già su `origin/main` e `origin/development`): decifra `credentials.yml.enc`, quindi espone il segreto JWT e il client secret Google | critica | repo | `README.md`, `backend/config/credentials.yml.enc` | Serve la decisione dell'utente: rotazione dei segreti e rimozione dal README. Riscrivere la history è un'operazione distruttiva. |
| S2 | Account takeover OAuth: `uid: auth.id` è sempre nil, quindi ogni login Google entra nell'account Google già esistente con uid nil | critica | backend | `models/user.rb:24`, `auth/omniauth_callbacks_controller.rb` | In dev esiste già un utente con uid nil |
| S3 | IDOR sugli ordini: `set_order` usa `Order.find`, quindi chiunque legge, modifica e annulla ordini di altri utenti | alta | backend | `controllers/api/v1/users/orders_controller.rb` | |
| S4 | CSRF della request phase OmniAuth disattivato; JWT passato in query string nel redirect | alta | backend | `config/initializers/oauth.rb`, `omniauth_callbacks_controller.rb` | |
| S5 | `ApplicationController#debug_params` logga `params.inspect`, password comprese | bassa | backend | `controllers/application_controller.rb` | |
| S6 | `db/seeds.rb` esegue `destroy_all` su utenti, categorie e prodotti: `db:seed` cancella i dati di dev | media | backend | `db/seeds.rb` | Da **non** eseguire finché il seed non viene riscritto |

## Requisiti funzionali obbligatori (§4)

| # | Requisito | Stato | Parte | File coinvolti | Cosa manca |
|---|---|---|---|---|---|
| 4.1a | `GET /products` con filtro/ricerca/paginazione | fatto | backend | `controllers/api/v1/products_controller.rb` | Supporta `q`, `category_id`, `page`/`limit`. Restituisce anche i prodotti inattivi (28 su 56 in dev) |
| 4.1b | `GET /products/:id` | fatto | backend | idem | Restituisce anche i prodotti inattivi |
| 4.1c | `GET /categories` | parziale | backend | `controllers/api/v1/categories_controller.rb:4` | `?q=` dà 500 (`search_by_name` non definito) |
| 4.1d | ProductService su API reali, nessun dato hardcoded | parziale | frontend | `core/http/products-api.service.ts`, `core/services/products.service.ts`, `pages/products-grid`, `components/categories-list` | Nessun dato hardcoded. Ricerca `q` (sincronizzata con l'URL), reset pagina e pannello errore sistemati in T9. Resta: categorie limitate alle prime 10 (serve modifica BE) |
| 4.2a | Modelli Cart / CartItem | parziale | backend | `models/cart.rb`, `models/cart_item.rb`, `db/schema.rb` | CartItem senza validazioni (quantità ≤ 0 accettate); nessun unique index su (cart_id, product_id) né su carts.user_id; codice morto in `users/carts_controller.rb` |
| 4.2b | `GET /cart`, `POST /cart/items`, `PATCH`/`DELETE /cart/items/:id` | parziale | backend | `users/cart_items_controller.rb`, `config/routes.rb:43` | Il path usa l'id del **prodotto**, non del CartItem (le specifiche dicono `:id` dell'articolo). DELETE senza `return` dopo il 404, quindi 500. Nessun controllo su stock e stato active. Chiave i18n `product_removed_from_cart` mancante |
| 4.2c | CartService: init da `/cart`, sync a ogni modifica, sopravvive al reload | parziale | frontend | `core/services/cart.service.ts`, `core/state/cart.store.ts` | Stato iniziale letto da localStorage, non da `GET /cart`. HTTP dentro `signal.update()`: con stato `null` la remove non parte. `unit_price` ottimistico scontato due volte. Il badge conta le righe, non i pezzi |
| 4.2d | Carrello guest (plus) | mancante | entrambi | – | Non supportato |
| 4.3a | Modelli Order / OrderItem | fatto | backend | `models/order.rb`, `models/order_item.rb` | Transizioni di stato non vincolate (es. cancelled→pending); messaggio di errore non tradotto |
| 4.3b | `POST /orders` dal carrello, svuota carrello | parziale | backend | `users/orders_controller.rb:24-70`, `serializers/order_item_serializer.rb` | 500 invece di 422 con dati mancanti; `decrement!` porta lo stock sotto zero; nessun controllo su active; `total_price` dell'item scontato due volte; carrello vuoto: 400 senza `errors` |
| 4.3c | `GET /orders`, `GET /orders/:id` solo dell'utente | parziale | backend | `users/orders_controller.rb` | IDOR (S3). Filtro `status` ignorato. Annullamento senza controllo di stato e senza ripristino dello stock |
| 4.3d | Checkout: Reactive Forms + OrderService, loading, conferma, errore con retry | parziale | frontend | `pages/checkout-page`, `core/services/orders.service.ts` | Loading solo globale. Dopo il successo solo un toast e redirect a /products, nessuna conferma. Nessun "Riprova". L'errore resta visibile quando si torna sulla pagina. Il carrello non viene ricaricato dal server |
| 4.3e | Pagina lista ordini | parziale | frontend | `pages/my-orders-page`, `pages/order-detail-page`, `core/http/orders-api.service.ts` | Paginatore dentro il `@for`; `paginationMeta` mai impostato; viene inviato `per_page` invece di `limit` |
| 4.4a | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | parziale | backend | `auth/sessions_controller.rb`, `config/initializers/devise.rb`, `api/v1/current_user_controller.rb` | Login e me ok. Logout solo `DELETE` (le specifiche chiedono `POST`). `PUT /auth/me` dà 500 (`exept`, parametri errati) |
| 4.4b | Login Google OAuth2 | parziale | backend | `models/user.rb`, `auth/omniauth_callbacks_controller.rb` | S2, S4. Un utente già registrato con la stessa email non riesce ad accedere con Google. URL frontend hardcoded |
| 4.4c | Login, token, HttpInterceptor | parziale | frontend | `pages/login-page.ts/`, `core/services/auth.service.ts`, `core/http/interceptors/*` | fatto (T5, T9): interceptor, signup con `password_confirmation`, `date_of_birth` e validator di uguaglianza |
| 4.4d | Route guard | parziale | frontend | `core/guards/*`, `app.routes.ts` | `adminGuard` corretto in T9 (ospite → /login, non admin → /forbidden). Manca il guard su `/my-orders/:orderId` (T7) |

## Requisiti tecnici (§5, §6)

| # | Requisito | Stato | Parte | File coinvolti | Cosa manca |
|---|---|---|---|---|---|
| 5a | Rails API mode, DB relazionale | fatto | backend | `config/application.rb`, `config/database.yml` | – |
| 5b | Validazioni di base sui modelli | parziale | backend | `models/*` | CartItem, WishlistItem; `Product.active` senza default; messaggi custom non tradotti |
| 5c | Gestione errori: status coerenti + JSON con messaggio | parziale | backend | `api/v1/base_controller.rb`, `concerns/authorization.rb`, `concerns/api_responses.rb` | Mancano 500 generico, `InvalidForeignKey`, `ArgumentError`, `UnknownAttributeReference`. `ParameterMissing` dovrebbe dare 400. 401/403 in formato diverso e solo in italiano. `AddressSerializer` mancante: tutti gli `/addresses` danno 500 |
| 5d | Test: ≥1 test di modello e ≥1 request test | fatto (T1) | backend | `test/test_helper.rb`, `test/fixtures/*`, `test/models/{product,order}_test.rb`, `test/controllers/api/v1/products_controller_test.rb`, `test/controllers/auth/sessions_controller_test.rb` | – (i task successivi aggiungono i test dei bug che correggono) |
| 6a | Nessun dato hardcoded per prodotti/carrello/ordini | parziale | frontend | `core/state/*` | Carrello e wishlist usano localStorage come fonte di verità |
| 6b | Servizi dedicati | fatto | frontend | `core/http/*`, `core/services/*` | – |
| 6c | Reactive Forms nel checkout | fatto | frontend | `pages/checkout-page` | – |
| 6d | HttpClient + Interceptor, errori centralizzati | fatto (T5) | frontend | `core/http/api-error.ts`, `core/http/api-config.ts`, `core/http/interceptors/*`, `environments/environment.ts`, tutti i service | Helper unico per gli errori, header corretti (token solo se presente, `Accept-Language` dal locale), URL del backend in un solo punto, 404 gestiti dalle pagine. Test: unit su helper e interceptor, E2E `e2e/http-basics.spec.ts` |

## Funzionalità avanzate (§7)

| # | Funzionalità | Stato | Parte | File coinvolti | Cosa manca |
|---|---|---|---|---|---|
| 7.1 | Area admin prodotti (ruolo admin + guard) | parziale | entrambi | `api/v1/admin/*`, `pages/admin/*`, `components/product-form`, `core/guards/admin*` | BE: PUT risponde 201; `order_by` senza whitelist (500); delete di elementi referenziati dà 500; delete categoria a cascata sui prodotti; l'admin può eliminare sé stesso. FE: eliminazione prodotto non implementata, dashboard placeholder, label del form non i18n |
| 7.2 | Storico ordini avanzato (filtri data/stato, dettaglio) | parziale | entrambi | `users/orders_controller.rb`, `pages/my-orders-page`, `pages/order-detail-page` | Dettaglio completo. Filtri lato utente assenti (BE e FE) |
| 7.3 | Wishlist | parziale | entrambi | `users/wishlist*_controller.rb`, `core/services/wishlists.service.ts` | BE: niente unique/validazione, POST risponde 200. FE: localStorage e side effect come il carrello (pulsante nascosto agli ospiti dal T9) |
| 7.4 | Coupon | mancante | entrambi | – | Tutto |
| 7.5 | i18n it/en con scelta lingua | parziale | entrambi | `config/locales/*`, `src/locale/*`, `components/language-selector`, `core/i18n/*` | FE fatto (T10a): selettore di lingua, tutti i testi e toast tradotti, paginatore e pipe localizzati, E2E `e2e/i18n.spec.ts`. BE: 401/403, 404 generico (in italiano anche con `Accept-Language: en`) e messaggi dei modelli (T3) |
| 7.6 | Test (3-4 BE, 2 service + 2 component FE, 1-2 E2E) | mancante | entrambi | – | Tutti |

## Consegna e qualità (§8, criteri)

| # | Requisito | Stato | Parte | File coinvolti | Cosa manca |
|---|---|---|---|---|---|
| 8a | Seed iniziale prodotti | parziale | backend | `db/seeds.rb` | Distruttivo (S6), non idempotente, metà dei prodotti inattivi, nessuna immagine |
| 8b | README principale | mancante | PM + entrambi | `README.md` (contiene la master key), `backend/README.md` (template) | Prerequisiti, setup DB, avvio |
| 8c | Documento di architettura | mancante | PM | – | `docs/ARCHITETTURA.md` |
| 8d | docker-compose (opzionale) | mancante | entrambi | `backend/Dockerfile` | Il Dockerfile installa sqlite e non libpq; compose assente |
| Q1 | UX / a11y minima | parziale | frontend | `components/*`, `pages/*` | alt errati o mancanti; bottoni icona senza aria-label; login senza mat-label; elementi cliccabili non raggiungibili da tastiera |
| Q2 | CI | parziale | – | `backend/.github/workflows/ci.yml` | Il file sta in `backend/`, quindi GitHub non lo esegue; nessun job di test |
| Q3 | Contratto `backend/API.md` | parziale | backend | `backend/API.md` | Allineato alle rotte. Da aggiornare per i bug noti e per il formato reale di `meta` di Pagy (`previous`, `pages`) |

## Avanzamento dei task (Fase 2)

| Task | Descrizione | Stato |
|---|---|---|
| T0 | Rotazione credentials (master key, `secret_key_base`, JWT, secret Google) | **fatto** (resta all'utente: revocare il vecchio secret sulla Google Console) |
| T1 | Infrastruttura test backend | **fatto** |
| T5 | Basi HTTP del frontend | **fatto** |
| T9 | Catalogo e auth (parte frontend): ricerca, paginazione, signup, adminGuard, wishlist ospiti | **fatto** (lista completa categorie in attesa del BE) |
| T10a | i18n frontend (selettore lingua, testi, paginatore, pipe) | **fatto** |
| T2 | Sicurezza e auth backend | in corso |
