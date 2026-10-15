# SW Store — Contratto API

Contratto tra backend (Rails) e frontend (Angular). Lo mantiene `backend-dev`; `frontend-dev` lo usa in sola lettura.
Ogni endpoint nuovo o modificato va documentato qui nello stesso task.

Ricavato da `config/routes.rb` e dai controller al tag `baseline-pre-team`.

## Convenzioni generali

- **Base URL:** `http://localhost:3000/api/v1` (in sviluppo). CORS consentito solo da `http://localhost:4200`.
- **Formato:** JSON. I payload sono annidati sotto il nome della risorsa (es. `{ "product": { ... } }`).
- **Lingua:** i messaggi (`message`) sono localizzati in base all'header `Accept-Language` (`it` di default, `en`).

### Autenticazione

JWT tramite `devise-jwt`.

- Il token viene restituito nell'header di risposta `Authorization: Bearer <token>` di `POST /auth/login` e `POST /auth/signup`. L'header è esposto via CORS.
- Le richieste autenticate inviano `Authorization: Bearer <token>`.
- Scadenza: 1 giorno. Il logout revoca il token (strategia JTI).

Livelli di accesso usati in questo documento:

| Livello    | Significato                                                     |
| ---------- | --------------------------------------------------------------- |
| Pubblico   | Nessun token richiesto                                           |
| Utente     | Token valido richiesto, altrimenti `401`                         |
| Admin      | Token valido di un utente con `admin: true`, altrimenti `401`/`403` |

Errori di accesso (formato diverso da quello standard):

```json
// 401
{ "error": "Unauthorized", "message": "Autenticazione richiesta: accedi per continuare." }
// 403
{ "error": "Forbidden", "message": "Accesso negato: non hai i permessi richiesti da amministratore." }
```

### Formato delle risposte

Successo (`render_success`), le chiavi `null`/vuote vengono omesse:

```json
{ "success": true, "message": "…", "data": { … } | [ … ], "meta": { … } }
```

Errore (`render_error`):

```json
{ "success": false, "message": "…", "errors": [ "…" ] }
```

Errori gestiti in modo comune per tutti i controller `api/v1`:

| Caso                                  | Status | `message`                 |
| ------------------------------------- | ------ | ------------------------- |
| Record non trovato                    | 404    | `not_found` (tradotto)    |
| Parametro radice mancante / record non valido | 422 | `parameters_missing` (tradotto) |

### Paginazione

Gli endpoint di lista accettano `page` e `limit` in query string e restituiscono in `meta` i dati di Pagy (`@pagy.data_hash`: pagina corrente, totale elementi, ultima pagina, ecc.).

### Ordinamento (solo endpoint admin di lista)

`order_by` (nome di colonna) e `order_direction` (`asc` | `desc`, default `asc`).

## Oggetti restituiti

**User**

```json
{ "id": 1, "email": "…", "first_name": "…", "last_name": "…", "number": "…", "admin": false,
  "full_name": "Mario Rossi", "created_at": "dd/mm/yyyy", "date_of_birth": "dd/mm/yyyy" | null,
  "orders_count": 0, "last_order_date": "dd/mm/yyyy" | null, "addresses_count": 0 }
```

**Category**: `{ "id", "name", "description" }`

**Product**

```json
{ "id", "name", "description", "discount_percentage", "price", "stock_quantity", "active",
  "image_url": "…" | null, "thumbnail_url": "…" | null, "category": Category }
```

**Importi:** i valori decimali (prezzi, sconti, totali) sono serializzati come **stringhe** (es. `"89.91"`), come per `Product.price`. I valori calcolati sono arrotondati a 2 decimali.

**Cart**

```json
{ "id", "user_id",
  "items": [ CartItem ],
  "items_count": 3,          // somma delle quantità (numero di pezzi)
  "total_amount": "268.73" } // somma dei total_price delle righe: è l'importo che POST /orders addebiterà
```

**CartItem**

```json
{ "id": 12,                         // id del CartItem: si usa in PATCH/DELETE /cart/items/:id
  "cart_id", "product_id", "quantity",
  "unit_price": "99.9",             // prezzo di listino attuale del prodotto (non scontato)
  "discount_percentage": "10.0",    // sconto attuale del prodotto
  "discounted_unit_price": "89.91", // unit_price scontato
  "total_price": "179.82",          // discounted_unit_price × quantity
  "product": Product }
```

I prezzi del carrello seguono sempre prezzo e sconto **attuali** del prodotto; vengono fissati solo alla creazione dell'ordine. Il frontend può mostrare righe e totale senza ricalcoli.

**Wishlist**: `{ "id", "user_id", "items": [ WishlistItem ] }`
**WishlistItem**: `{ "id", "wishlist_id", "product": Product }`

**Order**

```json
{ "id", "code", "first_name", "last_name", "street", "city", "zip_code", "country",
  "total_amount", "stripe_payment_token", "status", "created_at", "updated_at",
  "user": User, "items": [ OrderItem ] }
```

`status` ∈ `pending` (default), `paid`, `shipped`, `delivered`, `cancelled`, `refunded`.

Transizioni di stato consentite (ogni altra transizione, o uno stato sconosciuto, dà **422** con l'errore di validazione su `status`):

| Da          | A                                  |
| ----------- | ---------------------------------- |
| `pending`   | `paid`, `cancelled`                |
| `paid`      | `shipped`, `cancelled`, `refunded` |
| `shipped`   | `delivered`, `refunded`            |
| `delivered` | `refunded`                         |
| `cancelled`, `refunded` | nessuna (stati finali) |

- L'annullamento (`cancelled`) è possibile solo da `pending` o `paid` e **ripristina lo stock** dei prodotti dell'ordine.
- Il rimborso (`refunded`) **non** ripristina lo stock: la merce resa non è necessariamente rivendibile; eventuali rientri a magazzino si gestiscono modificando il prodotto.
- I dati di spedizione (`first_name`, `last_name`, `street`, `city`, `zip_code`, `country`, `stripe_payment_token`) sono modificabili solo finché l'ordine è `pending` o `paid`.

**OrderItem**

```json
{ "id", "order_id", "quantity",
  "unit_price": "89.91",         // prezzo unitario PAGATO, già scontato, fissato alla creazione dell'ordine
  "discount_percentage": "10.0", // sconto applicato al momento dell'ordine (informativo, già incluso in unit_price)
  "total_price": "179.82",       // unit_price × quantity (nessun ulteriore sconto)
  "product": Product }           // prodotto nello stato attuale (prezzo corrente, può differire)
```

`Order.total_amount` è la somma dei `total_price` delle righe.

**Address**: `{ "id", "nickname", "first_name", "last_name", "street", "city", "zip_code", "country", "is_default" }`

---

## Autenticazione e account

| Metodo | Path                          | Auth     | Descrizione                          |
| ------ | ----------------------------- | -------- | ------------------------------------ |
| POST   | `/auth/login`                 | Pubblico | Login                                 |
| POST/DELETE | `/auth/logout`           | Utente   | Logout (revoca il token)              |
| POST   | `/auth/signup`                | Pubblico | Registrazione                         |
| POST   | `/auth/google_oauth2`         | Pubblico | Avvio login Google (redirect)         |
| GET/POST | `/auth/google_oauth2/callback` | —     | Callback OAuth Google                 |
| GET    | `/auth/me`                    | Utente   | Dati dell'utente corrente             |
| PUT    | `/auth/me`                    | Utente   | Modifica dell'utente corrente         |
| DELETE | `/auth/me`                    | Utente   | Cancellazione dell'account            |

### POST `/auth/login`

- **Payload:** `{ "user": { "email": "…", "password": "…" } }`
- **200:** `message: logged_in`, `data: User`, header `Authorization: Bearer <token>`.
- **401:** credenziali non valide (risposta di Devise).

### POST `/auth/logout` (oppure DELETE)

- `POST` è il metodo indicato dalle specifiche; `DELETE` resta disponibile con lo stesso comportamento.
- Richiede l'header `Authorization`. Il token viene revocato: le richieste successive con lo stesso token ricevono **401**.
- **200:** `message: logged_out`.
- **401:** `message: not_logged_in`.

### POST `/auth/signup`

- **Payload:** `{ "user": { "email", "password", "password_confirmation", "first_name", "last_name", "date_of_birth" } }`
- **200:** `message: signed_up`, `data: User`, header `Authorization: Bearer <token>`.
- **422:** `message: signed_up_failed`, `errors: [...]`.

Le altre rotte generate da Devise (`/auth/signup/edit`, `/auth/signup/cancel`, `PUT|PATCH|DELETE /auth/signup`, `/password*`) esistono ma non sono usate dal frontend.

### OAuth Google

Flusso (il frontend non chiama questi endpoint con HttpClient, ma con una navigazione del browser):

1. **Avvio:** il frontend invia un form HTML `POST {API}/auth/google_oauth2` (navigazione a pagina intera, nessun payload). La rotta esiste solo in `POST`. Il backend reindirizza a Google.
2. **Callback:** Google richiama `GET|POST /auth/google_oauth2/callback` (gestita dal backend, non dal frontend).
3. **Ritorno alla SPA:** il backend fa redirect a `FRONTEND_URL` (variabile d'ambiente del backend, default `http://localhost:4200`):

| Esito      | Redirect                                      | Dove si legge il dato |
| ---------- | --------------------------------------------- | --------------------- |
| Successo   | `{FRONTEND_URL}/oauth/callback#token=<jwt>`   | **fragment** (dopo `#`), non nella query string |
| Errore     | `{FRONTEND_URL}/login?error=oauth_failed`     | query string |
| Annullato  | `{FRONTEND_URL}/login?error=oauth_canceled`   | query string |

- Il token è nel **fragment** perché il browser non lo invia ai server: non finisce nei log di accesso né nell'header `Referer`. Il frontend lo legge dal fragment (es. `new URLSearchParams(fragment).get("token")`), lo usa come `Authorization: Bearer <jwt>` e poi toglie il fragment dalla barra degli indirizzi. Il valore è URL-encoded (form encoding).
- Il token è equivalente a quello restituito da `POST /auth/login`: stessa scadenza (1 giorno), revocabile con `/auth/logout`, e non invalida le altre sessioni dell'utente.
- Associazione dell'account, in quest'ordine:
  1. utente già collegato a quell'account Google;
  2. utente registrato con la **stessa email** (solo se verificata da Google), che viene collegato all'account Google;
  3. nuovo utente.

  Se Google non fornisce un'email verificata, il login fallisce (`oauth_failed`).
- **Rischio residuo noto:** la richiesta di avvio non verifica un token CSRF (`request_validation_phase = nil`, vedi `config/initializers/oauth.rb`). Il rischio è basso: la callback è protetta dal parametro `state` di OAuth2, e un CSRF sull'avvio può solo far partire il login Google della vittima sul suo stesso account, perché non esiste il collegamento di un account Google a un utente già autenticato.

### GET `/auth/me`

- **200:** `data: User`.

### PUT `/auth/me`

- **Payload:** `{ "user": { "first_name", "last_name", "number", "date_of_birth", "email", "password", "password_confirmation", "current_password" } }`. Tutti i campi sono opzionali; gli altri campi (es. `admin`) vengono ignorati.
- Per cambiare `password` o `email` serve anche `current_password` (password attuale), altrimenti **422**.
- **200:** `message: info_updated_successfully`, `data: User`.
- **422:** `message: info_update_error`, `errors: [...]` (validazioni, es. utente minorenne, email già usata, `current_password` mancante o errata); anche se manca l'oggetto `user` (`parameters_missing`).

### DELETE `/auth/me`

- **200:** `message: account_deleted_successfully`.
- **422:** `message: account_delete_error`.

---

## Catalogo (pubblico)

| Metodo | Path               | Auth     | Descrizione          |
| ------ | ------------------ | -------- | -------------------- |
| GET    | `/products`        | Pubblico | Lista prodotti        |
| GET    | `/products/:id`    | Pubblico | Dettaglio prodotto    |
| GET    | `/categories`      | Pubblico | Lista categorie       |
| GET    | `/categories/:id`  | Pubblico | Dettaglio categoria   |

- `GET /products`: query `q` (ricerca sul nome, case-insensitive), `category_id`, `page`, `limit`. Ordinati per nome. **200:** `data: [Product]`, `meta`.
- `GET /products/:id`: **200:** `data: Product`. **404** se non esiste.
- `GET /categories`: query `q`, `page`, `limit`. Ordinate per nome. **200:** `data: [Category]`, `meta`.
- `GET /categories/:id`: **200:** `data: Category`. **404** se non esiste.

---

## Carrello (utente)

> **Breaking change (T4):** `PATCH`/`DELETE` usano l'**id del CartItem** (`items[].id` di `GET /cart`), non più l'id del prodotto. `PATCH` con `quantity <= 0` non rimuove più la riga: risponde 422 (per rimuovere si usa `DELETE`).

| Metodo | Path                  | Auth   | Descrizione                                   |
| ------ | --------------------- | ------ | --------------------------------------------- |
| GET    | `/cart`               | Utente | Carrello corrente                              |
| POST   | `/cart/items`         | Utente | Aggiunge un prodotto (o ne somma la quantità)  |
| PATCH/PUT | `/cart/items/:id`  | Utente | Imposta la quantità di una riga                |
| DELETE | `/cart/items/:id`     | Utente | Rimuove una riga                               |

`:id` è l'id del CartItem. Una riga che non appartiene al carrello dell'utente corrente dà **404** (`not_found`).
Tutte le risposte di successo contengono `data: Cart` (carrello aggiornato).

Regole di disponibilità (POST e PATCH): il prodotto deve essere attivo (`active: true`) e la quantità totale della riga non può superare `stock_quantity`. `quantity` deve essere un intero ≥ 1.

- `GET /cart` → **200:** `data: Cart`.
- `POST /cart/items`
  - **Payload:** `{ "cart_item": { "product_id": 1, "quantity": 2 } }` (`quantity` opzionale, default 1). Se il prodotto è già nel carrello la quantità viene **sommata**.
  - **201:** `message: added_to_cart`, `data: Cart`.
  - **404:** prodotto inesistente (`not_found`).
  - **422:** `message: add_to_cart_error`, `errors: [...]`. Casi: prodotto non attivo (`product_not_available`), quantità oltre lo stock (`insufficient_stock`, indica la quantità disponibile), quantità non valida.
- `PATCH /cart/items/:id`
  - **Payload:** `{ "cart_item": { "quantity": 3 } }` (quantità finale della riga, non un incremento).
  - **200:** `message: quantity_updated`, `data: Cart`.
  - **404:** riga inesistente o di un altro utente.
  - **422:** `message: quantity_update_error`, `errors: [...]` (stessi casi di POST, compreso `quantity <= 0`).
- `DELETE /cart/items/:id` → **200:** `message: removed_from_cart`, `data: Cart`. **404:** riga inesistente o di un altro utente.

## Wishlist (utente)

| Metodo | Path                                  | Auth   | Descrizione                                  |
| ------ | ------------------------------------- | ------ | -------------------------------------------- |
| GET    | `/wishlist`                           | Utente | Wishlist corrente                             |
| POST   | `/wishlist/items`                     | Utente | Aggiunge un prodotto                          |
| DELETE | `/wishlist/items/:product_id`         | Utente | Rimuove un prodotto                           |
| PUT    | `/wishlist/items/:product_id/move`    | Utente | Sposta il prodotto nel carrello (quantità +1) |

- `GET /wishlist` → **200:** `data: Wishlist`.
- `POST /wishlist/items`
  - **Payload:** `{ "wishlist_item": { "product_id": 1 } }`
  - **200:** `message: added_to_wishlist`, `data: Wishlist`. **422:** `already_in_wishlist` oppure `add_to_wishlist_error`.
- `DELETE /wishlist/items/:product_id` → **200:** `message: removed_from_wishlist`, `data: Wishlist`. **404:** `product_not_in_wishlist`.
- `PUT /wishlist/items/:product_id/move` → aggiunge 1 pezzo al carrello (somma se già presente) con le stesse regole di disponibilità di `POST /cart/items`, poi rimuove il prodotto dalla wishlist. **201:** `message: added_to_cart`, `data: Wishlist`. **404:** `product_not_in_wishlist`. **422:** `add_to_cart_error`, `errors: [...]` (prodotto non attivo o stock insufficiente; la wishlist resta invariata).

## Ordini dell'utente

| Metodo | Path             | Auth   | Descrizione                                    |
| ------ | ---------------- | ------ | ---------------------------------------------- |
| GET    | `/orders`        | Utente | Ordini dell'utente (più recenti prima)          |
| POST   | `/orders`        | Utente | Checkout del carrello                           |
| GET    | `/orders/:id`    | Utente | Dettaglio ordine                                |
| PUT/PATCH | `/orders/:id` | Utente | Modifica dati di spedizione                    |
| DELETE | `/orders/:id`    | Utente | Annullamento (soft: `status = cancelled`)      |

- `GET /orders`: query `page`, `limit` (`status` è letto ma non applicato, vedi *Problemi noti*). **200:** `data: [Order]`, `meta`.
- `POST /orders`
  - **Payload:** `{ "order": { "first_name", "last_name", "street", "city", "zip_code", "country", "stripe_payment_token" } }` (tutti obbligatori).
  - In un'unica transazione, con lock sui prodotti: verifica che ogni prodotto sia attivo e con stock sufficiente, crea l'ordine con un OrderItem per riga (prezzo e sconto attuali fissati in `unit_price`), decrementa lo stock e svuota il carrello. Se qualcosa fallisce non viene modificato nulla (carrello e stock restano invariati).
  - `total_amount` = somma dei `total_price` delle righe (uguale a `Cart.total_amount` al momento del checkout).
  - **201:** `message: checkout_successful`, `data: Order`.
  - **422:** `message: checkout_empty_cart`, `errors: [...]` se il carrello è vuoto.
  - **422:** `message: checkout_error`, `errors: [...]` se mancano dati del form (errori di validazione) oppure se uno o più prodotti non sono disponibili (`product_not_available`, `insufficient_stock`, un messaggio per prodotto).
  - **422:** `parameters_missing` se manca l'oggetto `order`.
- Gli endpoint `/orders/:id` agiscono solo sugli ordini dell'utente corrente: un ordine di un altro utente dà **404** (`not_found`).
- `GET /orders/:id` → **200:** `data: Order`.
- `PUT /orders/:id`: payload come `POST` (lo stato non è modificabile dall'utente). **200:** `order_updated_successfully`, `data: Order`. **422:** `order_update_error` (es. ordine già spedito, vedi *Transizioni di stato*).
- `DELETE /orders/:id` → annulla l'ordine e ripristina lo stock. **200:** `order_deleted_successfully`. **422:** `order_delete_error` se l'ordine non è annullabile (già `shipped`, `delivered`, `cancelled` o `refunded`), con il motivo in `errors`.

## Indirizzi dell'utente

| Metodo | Path                | Auth   | Descrizione         |
| ------ | ------------------- | ------ | ------------------- |
| GET    | `/addresses`        | Utente | Lista (per nickname) |
| POST   | `/addresses`        | Utente | Creazione            |
| GET    | `/addresses/:id`    | Utente | Dettaglio            |
| PUT/PATCH | `/addresses/:id` | Utente | Modifica            |
| DELETE | `/addresses/:id`    | Utente | Cancellazione        |

- **Payload** (create/update): `{ "address": { "first_name", "last_name", "street", "city", "zip_code", "country", "nickname", "is_default" } }`. Obbligatori tutti tranne `is_default`; `nickname` è unico per utente.
- Risposte: `address_created_successfully` (201), `address_updated_successfully`, `address_deleted_successfully`; errori `address_create_error`, `address_update_error`, `address_delete_error` (422).
- Accesso limitato agli indirizzi dell'utente corrente (404 per gli altri).
- **200/201:** `data: Address`; lista: `data: [Address]`, `meta`.

---

## Amministrazione

Tutti gli endpoint `/admin/*` richiedono livello **Admin**.

### Prodotti

| Metodo | Path                    | Descrizione  |
| ------ | ----------------------- | ------------ |
| GET    | `/admin/products`       | Lista         |
| POST   | `/admin/products`       | Creazione     |
| GET    | `/admin/products/:id`   | Dettaglio     |
| PUT/PATCH | `/admin/products/:id` | Modifica    |
| DELETE | `/admin/products/:id`   | Cancellazione |

- `GET`: query `q` (nome), `category_id`, `order_by`, `order_direction`, `page`, `limit`. Default: più recenti prima. **200:** `data: [Product]`, `meta`.
- **Payload** (create/update): `{ "product": { "name", "description", "price", "discount_percentage", "stock_quantity", "active", "category_id", "image" } }`. Per caricare `image` serve `multipart/form-data`.
  - Validazioni: `name` obbligatorio; `description` obbligatoria, almeno 10 caratteri; `price` ≥ 0; `discount_percentage` 0–100 (opzionale); `stock_quantity` ≥ 0.
- Risposte: create **201** `product_created_successfully`; update **201** `product_updated_successfully`; delete **200** `product_deleted_successfully`. Errori **422** `product_create_error` / `product_update_error`.

### Categorie

| Metodo | Path                      | Descrizione  |
| ------ | ------------------------- | ------------ |
| GET    | `/admin/categories`       | Lista         |
| POST   | `/admin/categories`       | Creazione     |
| GET    | `/admin/categories/:id`   | Dettaglio     |
| PUT/PATCH | `/admin/categories/:id` | Modifica    |
| DELETE | `/admin/categories/:id`   | Cancellazione |

- `GET`: query `q`, `page`, `limit`.
- **Payload:** `{ "category": { "name", "description" } }` (`name` obbligatorio e unico).
- Risposte: create **201** `category_created_successfully`; update **200** (messaggio `category_created_successfully`, vedi *Problemi noti*); delete **200** `category_deleted_successfully`. Errori **422** `category_create_error` / `category_update_error`.

### Utenti

| Metodo | Path                 | Descrizione  |
| ------ | -------------------- | ------------ |
| GET    | `/admin/users`       | Lista         |
| GET    | `/admin/users/:id`   | Dettaglio     |
| PUT/PATCH | `/admin/users/:id` | Modifica    |
| DELETE | `/admin/users/:id`   | Cancellazione |

La creazione avviene solo tramite `/auth/signup`.

- `GET`: query `q` (nome, cognome, email, telefono), `order_by`, `order_direction`, `page`, `limit`. Default: ordinati per cognome e nome. **200:** `data: [User]`, `meta`.
- **Payload** (update): `{ "user": { "first_name", "last_name", "email", "number", "password", "password_confirmation", "date_of_birth" } }`.
- Risposte: `user_updated_successfully`, `user_deleted_successfully` (200); errori `user_update_error`, `user_delete_error` (422).

### Ordini

| Metodo | Path                  | Descrizione                                  |
| ------ | --------------------- | -------------------------------------------- |
| GET    | `/admin/orders`       | Lista con filtri                              |
| GET    | `/admin/orders/:id`   | Dettaglio                                     |
| PUT/PATCH | `/admin/orders/:id` | Modifica (anche lo stato)                   |
| DELETE | `/admin/orders/:id`   | Annullamento (soft: `status = cancelled`)    |

- `GET`: query
  - `q`: ID ordine, nome, cognome o email del cliente;
  - `status`;
  - `from_date`, `to_date` (date, estremi inclusi);
  - `min_total_amount`, `max_total_amount`;
  - `order_by`, `order_direction`, `page`, `limit`.
  - Default: più recenti prima. **200:** `data: [Order]`, `meta`.
- **Payload** (update): `{ "order": { "first_name", "last_name", "street", "city", "zip_code", "country", "stripe_payment_token", "status", "created_at" } }`.
- `status` segue le *Transizioni di stato* (sezione Order): una transizione non consentita o uno stato sconosciuto dà **422**. Passare a `cancelled` ripristina lo stock.
- Risposte: update **200** `order_updated_successfully`, `data: Order`; delete (annullamento, solo da `pending`/`paid`, ripristina lo stock) **200** `order_deleted_successfully`, `data: Order`. Errori **422** `order_update_error`.

---

## Altro

| Metodo | Path  | Auth     | Descrizione                                         |
| ------ | ----- | -------- | --------------------------------------------------- |
| GET    | `/up` | Pubblico | Health check Rails (fuori da `/api/v1`), 200 se l'app è avviata |

---

## Problemi noti

Comportamenti attuali del backend che differiscono da quanto ci si aspetterebbe. Vanno risolti con task dedicati, poi questa sezione va aggiornata.

1. **`GET /orders`:** il filtro `status` non viene applicato (il risultato di `where` è scartato).
2. **Admin, `order_by` / `order_direction`:** interpolati direttamente nella clausola SQL `ORDER BY` senza whitelist.
3. **`PUT /admin/products/:id`** risponde `201` invece di `200`; **`PUT /admin/categories/:id`** usa il messaggio `category_created_successfully`.
4. **OAuth, request phase:** `POST /auth/google_oauth2` non verifica un token CSRF. Rischio accettato e basso, vedi *OAuth Google*.
