# Analisi dei requisiti – SW Store

Stato del progetto rispetto a `docs/Progetto_di_sistemi_web_Specifiche.pdf`.
Ultimo aggiornamento: 2026-10-15 (Fase 1, analisi iniziale). Tutti i path backend hanno prefisso `/api/v1`.

Legenda stato: **fatto** / **parziale** / **mancante**.

## Requisiti funzionali obbligatori (§4)

| # | Requisito | Stato | Parte | File coinvolti | Cosa manca |
|---|-----------|-------|-------|----------------|------------|
| 4.1a | `GET /products` con filtro/ricerca/paginazione | fatto | backend | `api/v1/products_controller.rb` | Supporta `q`, `category_id`, `page`/`limit`. Difetti: espone prodotti `active=false`; `GET /categories?q=` va in 500 (`search_by_name` privato di ProductsController) |
| 4.1b | `GET /products/:id` | fatto | backend | `api/v1/products_controller.rb` | Espone anche prodotti inattivi |
| 4.1c | ProductService su endpoint reali, nessun dato hardcoded | parziale | frontend | `core/http/products-api.service.ts`, `core/services/products.service.ts`, `pages/products-grid`, `pages/product-detail`, `components/categories-list` | Nessuna UI di ricerca; reset pagina al cambio filtro; categorie troncate alla prima pagina; pannello errore con condizione invertita; handler di errore che leggono `err.error.error` (TypeError) |
| 4.2a | Modelli Cart / CartItem | parziale | backend | `models/cart.rb`, `models/cart_item.rb` | CartItem senza validazioni (quantità ≤ 0 accettate, nessun controllo stock/active); nessun indice unique; codice morto in `carts_controller.rb` |
| 4.2b | Endpoint `/cart`, `/cart/items` | parziale | backend | `users/cart_items_controller.rb`, `carts_controller.rb` | `destroy` senza `return` dopo l'errore (500). Il path usa `:product_id` invece dell'id del CartItem (differenza dalle specifiche da decidere/documentare) |
| 4.2c | CartService inizializzato da `/cart`, sync a ogni modifica, sopravvive al reload | parziale | frontend | `core/services/cart.service.ts`, `core/state/cart.store.ts`, `core/http/cart-api.service.ts` | Stato letto da localStorage al reload, `/cart` chiamato solo al login/guard; side effect dentro `signal.update()`; `cartItemCount` conta le righe |
| 4.2d | Carrello guest (plus) | mancante | entrambi | – | Non supportato dal backend |
| 4.3a | Modelli Order / OrderItem | fatto | backend | `models/order.rb`, `models/order_item.rb` | – |
| 4.3b | `POST /orders` dal carrello, svuota carrello | parziale | backend | `users/orders_controller.rb` | 500 invece di 422 su validazione fallita; nessun controllo stock (può andare negativo); doppio sconto in `OrderItemSerializer#total_price` |
| 4.3c | `GET /orders`, `GET /orders/:id` solo dell'utente | parziale | backend | `users/orders_controller.rb` | **IDOR**: `Order.find` permette di leggere/modificare/annullare ordini altrui; filtro `status` scartato; annullamento consentito anche su ordini spediti, senza ripristino stock |
| 4.3d | Checkout con Reactive Forms + OrderService | parziale | frontend | `pages/checkout-page`, `core/services/orders.service.ts`, `core/http/orders-api.service.ts` | Manca conferma ordine (redirect a /products), loading locale, pulsante "Riprova"; carrello non ricaricato dal server dopo l'ordine; token di pagamento fittizio |
| 4.3e | Pagina lista ordini | parziale | frontend | `pages/my-orders-page`, `pages/order-detail-page` | Paginatore dentro il `@for` e mai visibile; `per_page` invece di `limit`; `/my-orders/:orderId` senza guard |
| 4.4a | `POST /auth/login`, logout, `GET /auth/me` | parziale | backend | `auth/sessions_controller.rb`, `auth/current_user_controller.rb`, `config/initializers/devise.rb` | Logout è `DELETE` (specifiche: `POST`); `PUT /auth/me` va in 500 (`exept`, parametri errati) |
| 4.4b | Login Google OAuth2 | parziale | backend | `auth/omniauth_callbacks_controller.rb`, `models/user.rb` | **Sicurezza**: `auth.id` è nil, quindi tutti gli utenti Google condividono `uid=nil` (account mixup); CSRF sulla request phase; JWT in query string |
| 4.4c | Pagina login, token, HttpInterceptor, route guard | parziale | frontend | `pages/login-page.ts/`, `pages/signup-page`, `core/services/auth.service.ts`, `core/guards/*`, `core/http/interceptors/*` | `apiHeadersInterceptor` sostituisce tutti gli header (`Bearer null`, `Accept-Language` sempre `it`); signup invia `passwordConfirmation` e non `date_of_birth`; adminGuard reindirizza a /login invece di /forbidden; `auth-interceptor.ts` inutilizzato; URL backend hardcoded |

## Requisiti tecnici (§5, §6)

| # | Requisito | Stato | Parte | File coinvolti | Cosa manca |
|---|-----------|-------|-------|----------------|------------|
| 5a | Rails API mode, DB relazionale | fatto | backend | `config/application.rb`, `config/database.yml` | – |
| 5b | Validazioni di base sui modelli | parziale | backend | `models/*` | CartItem e WishlistItem senza validazioni; messaggi di alcuni modelli non localizzati |
| 5c | Gestione errori: status coerenti + JSON con messaggio | parziale | backend | `api/v1/base_controller.rb`, `concerns/authorization.rb`, `concerns/api_responses.rb` | Mancano rescue per 500 generici, `InvalidForeignKey`, `ArgumentError`; 401/403 di `authorization.rb` in formato diverso e non localizzati; `AddressSerializer` mancante (tutti gli `/addresses` vanno in 500) |
| 5d | Test: ≥1 test di modello e ≥1 request test | mancante | backend | `backend/test/` (assente) | Infrastruttura di test, fixture, helper JWT, test |
| 6a | Nessun dato hardcoded per prodotti/carrello/ordini | parziale | frontend | `core/state/*` | Carrello e wishlist persistiti in localStorage |
| 6b | Servizi dedicati (Product/Cart/Order/Auth) | fatto | frontend | `core/http/*`, `core/services/*` | – |
| 6c | Reactive Forms nel checkout | fatto | frontend | `pages/checkout-page` | – |
| 6d | HttpClient + HttpInterceptor (token, errori centralizzati) | parziale | frontend | `core/http/interceptors/*` | Bug degli header (vedi 4.4c); messaggi dell'errorInterceptor non i18n; redirect su 404 anche per DELETE carrello |

## Funzionalità avanzate (§7)

| # | Funzionalità | Stato | Parte | File coinvolti | Cosa manca |
|---|--------------|-------|-------|----------------|------------|
| 7.1 | Area admin prodotti (ruolo admin + guard) | parziale | entrambi | `api/v1/admin/*`, `pages/admin/*`, `core/guards/admin*` | FE: eliminazione prodotto, label i18n del form, dashboard placeholder, CRUD categorie. BE: whitelist `order_by`, `PUT products` risponde 201, admin può eliminare se stesso |
| 7.2 | Storico ordini avanzato (filtri data/stato, dettaglio) | parziale | entrambi | `users/orders_controller.rb`, `pages/my-orders-page`, `pages/order-detail-page` | Dettaglio ordine fatto. Filtri data/stato assenti lato utente (BE e FE) |
| 7.3 | Wishlist | parziale | entrambi | `users/wishlist*`, `core/services/wishlists.service.ts` | BE: unique sugli item. FE: localStorage e side effect come il carrello |
| 7.4 | Coupon | mancante | entrambi | – | Tutto |
| 7.5 | i18n it/en con scelta lingua | parziale | entrambi | `config/locales/*`, `src/locale/*` | FE: selettore lingua, `Accept-Language` dal LOCALE_ID, testi residui non marcati. BE: messaggi 401/403 e di alcuni modelli |
| 7.6 | Test (3-4 BE, 2 service + 2 component FE, 1-2 E2E) | mancante | entrambi | – | Tutti i test; `app.spec.ts` rotto; nessun framework E2E |

## Consegna e qualità (§8, criteri)

| # | Requisito | Stato | Parte | File coinvolti | Cosa manca |
|---|-----------|-------|-------|----------------|------------|
| 8a | Seed iniziale prodotti | parziale | backend | `db/seeds.rb` | Non idempotente, metà prodotti inattivi, nessuna immagine |
| 8b | README principale (prerequisiti, setup DB, avvio) | mancante | entrambi | `README.md` (root assente), `backend/README.md` placeholder | Tutto |
| 8c | Documento di architettura (modelli, flusso, funzionalità avanzate) | mancante | PM | – | `ARCHITETTURA.md` |
| 8d | docker-compose (opzionale) | mancante | entrambi | `backend/Dockerfile` | Dockerfile installa sqlite e non libpq; compose assente |
| Q1 | UX / a11y minima | parziale | frontend | `components/*`, `pages/*` | Alt errati o mancanti, bottoni icona senza `aria-label`, login senza `mat-label`, solo loading globale |
| Q2 | CI | parziale | – | `backend/.github/workflows/ci.yml` | Il workflow sta in `backend/`, quindi GitHub non lo esegue; nessun job di test |
