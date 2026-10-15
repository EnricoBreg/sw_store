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

**Cart**: `{ "id", "user_id", "items": [ CartItem ] }`
**CartItem**: `{ "id", "cart_id", "quantity", "unit_price", "product": Product }`

**Wishlist**: `{ "id", "user_id", "items": [ WishlistItem ] }`
**WishlistItem**: `{ "id", "wishlist_id", "product": Product }`

**Order**

```json
{ "id", "code", "first_name", "last_name", "street", "city", "zip_code", "country",
  "total_amount", "stripe_payment_token", "status", "created_at", "updated_at",
  "user": User, "items": [ OrderItem ] }
```

`status` ∈ `pending` (default), `paid`, `shipped`, `delivered`, `cancelled`, `refunded`.

**OrderItem**: `{ "id", "order_id", "unit_price", "quantity", "discount_percentage", "total_price", "product": Product }`

**Address**: campi `first_name`, `last_name`, `street`, `city`, `zip_code`, `country`, `nickname`, `is_default` (vedi *Problemi noti*: il serializer non esiste).

---

## Autenticazione e account

| Metodo | Path                          | Auth     | Descrizione                          |
| ------ | ----------------------------- | -------- | ------------------------------------ |
| POST   | `/auth/login`                 | Pubblico | Login                                 |
| DELETE | `/auth/logout`                | Utente   | Logout (revoca il token)              |
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

### DELETE `/auth/logout`

- **200:** `message: logged_out`.
- **401:** `message: not_logged_in`.

### POST `/auth/signup`

- **Payload:** `{ "user": { "email", "password", "password_confirmation", "first_name", "last_name", "date_of_birth" } }`
- **200:** `message: signed_up`, `data: User`, header `Authorization: Bearer <token>`.
- **422:** `message: signed_up_failed`, `errors: [...]`.

Le altre rotte generate da Devise (`/auth/signup/edit`, `/auth/signup/cancel`, `PUT|PATCH|DELETE /auth/signup`, `/password*`) esistono ma non sono usate dal frontend.

### OAuth Google

- `POST /auth/google_oauth2` avvia il flusso (la rotta è registrata solo in `POST`).
- Al termine il backend fa redirect a:
  - successo: `http://localhost:4200/oauth/callback?token=<jwt>`
  - errore: `http://localhost:4200/login?error=oauth_failed`
  - annullato: `http://localhost:4200/login?error=oauth_canceled`

### GET `/auth/me`

- **200:** `data: User`.

### PUT `/auth/me`

- **Payload:** `{ "user": { "name", "email", "password", "password_confirmation", "current_password" } }`. Se `password` è presente serve anche `current_password`.
- **200:** `message: info_updated_successfully`, `data: User`.
- **422:** `message: info_update_error`, `errors: [...]`.
- Vedi *Problemi noti*.

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

| Metodo | Path                          | Auth   | Descrizione                                   |
| ------ | ----------------------------- | ------ | --------------------------------------------- |
| GET    | `/cart`                       | Utente | Carrello corrente                              |
| POST   | `/cart/items`                 | Utente | Aggiunge un prodotto (o ne somma la quantità)  |
| PUT/PATCH | `/cart/items/:product_id`  | Utente | Imposta la quantità (≤ 0 rimuove)              |
| DELETE | `/cart/items/:product_id`     | Utente | Rimuove il prodotto                            |

- `GET /cart` → **200:** `data: Cart`.
- `POST /cart/items`
  - **Payload:** `{ "cart_item": { "product_id": 1, "quantity": 2 } }`
  - **201:** `message: added_to_cart`, `data: Cart`. **422:** `add_to_cart_error`. **404** se il prodotto non esiste.
- `PUT /cart/items/:product_id`
  - **Payload:** `{ "cart_item": { "quantity": 3 } }`
  - **200:** `message: quantity_updated` (oppure `product_removed_from_cart` se `quantity <= 0`), `data: Cart`.
  - **404:** `product_not_in_cart`. **422:** `quantity_update_error`.
- `DELETE /cart/items/:product_id` → **200:** `message: removed_from_cart`, `data: Cart`. **404:** `product_not_in_cart`.

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
- `PUT /wishlist/items/:product_id/move` → **201:** `message: added_to_cart`, `data: Wishlist`. **404:** `product_not_in_wishlist`. **422:** `add_to_cart_error`.

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
  - Il totale è calcolato dal carrello. Per ogni riga crea un OrderItem con il prezzo scontato, decrementa lo stock e svuota il carrello, tutto in una transazione.
  - **201:** `message: checkout_successful`, `data: Order`.
  - **400:** `message: checkout_empty_cart` se il carrello è vuoto. **422:** `message: checkout_error`.
- `GET /orders/:id` → **200:** `data: Order`.
- `PUT /orders/:id`: payload come `POST`. **200:** `order_updated_successfully`, `data: Order`. **422:** `order_update_error`.
- `DELETE /orders/:id` → **200:** `order_deleted_successfully`. **422:** `order_delete_error`.

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
- ⚠️ Al momento non funzionante, vedi *Problemi noti*.

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
- Risposte: update **200** `order_updated_successfully`, `data: Order`; delete **200** `order_deleted_successfully`, `data: Order`. Errori **422** `order_update_error`.

---

## Altro

| Metodo | Path  | Auth     | Descrizione                                         |
| ------ | ----- | -------- | --------------------------------------------------- |
| GET    | `/up` | Pubblico | Health check Rails (fuori da `/api/v1`), 200 se l'app è avviata |

---

## Problemi noti (al tag `baseline-pre-team`)

Comportamenti attuali del backend che differiscono da quanto ci si aspetterebbe. Vanno risolti con task dedicati, poi questa sezione va aggiornata.

1. **Indirizzi:** `AddressSerializer` non esiste in `app/serializers/`, quindi tutti gli endpoint `/addresses` che restituiscono dati vanno in errore 500.
2. **`PUT /auth/me`:** senza `password` chiama `user_params.exept(...)` (refuso di `except`) e va in errore 500. Inoltre accetta `name`, che non è un attributo di User, al posto di `first_name`/`last_name`.
3. **`GET /orders/:id`, `PUT`, `DELETE`** (utente): l'ordine è cercato con `Order.find` e non tra gli ordini dell'utente corrente, quindi un utente può leggere o modificare gli ordini di altri.
4. **`GET /orders`:** il filtro `status` non viene applicato (il risultato di `where` è scartato).
5. **`DELETE /cart/items/:product_id`:** se il prodotto non è nel carrello manca un `return` dopo la risposta 404: il codice prosegue su `nil` ed è un errore 500.
6. **Admin, `order_by` / `order_direction`:** interpolati direttamente nella clausola SQL `ORDER BY` senza whitelist.
7. **`PUT /admin/products/:id`** risponde `201` invece di `200`; **`PUT /admin/categories/:id`** usa il messaggio `category_created_successfully`.
8. **Revoca JWT:** `jwt.revocation_requests` include `DELETE /admin/users`, che non corrisponde a nessuna rotta.
9. **OAuth:** gli URL di redirect al frontend (`http://localhost:4200`) sono fissi nel codice.
