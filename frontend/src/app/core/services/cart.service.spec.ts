import { TestBed } from "@angular/core/testing";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { CartService, QUANTITY_DEBOUNCE_MS } from "./cart.service";
import { Toaster } from "./toaster";
import { AuthService } from "./auth.service";
import { errorInterceptor } from "../http/interceptors/error-interceptor";
import Product from "../models/product";

// Risposte nel formato reale del backend: i decimali arrivano come stringhe
const rawProduct = (id: number) => ({
  id,
  name: `Prodotto ${id}`,
  description: "Descrizione di prova",
  price: "100.0",
  discount_percentage: "10.0",
  stock_quantity: 5,
  active: true,
  image_url: null,
  thumbnail_url: null,
  category: { id: 1, name: "Varie", description: null },
});

const rawItem = (id: number, productId: number, quantity: number) => ({
  id,
  cart_id: 7,
  product_id: productId,
  quantity,
  unit_price: "100.0",
  discount_percentage: "10.0",
  discounted_unit_price: "90.0",
  total_price: (90 * quantity).toFixed(1),
  product: rawProduct(productId),
});

const rawCart = (items: ReturnType<typeof rawItem>[]) => ({
  id: 7,
  user_id: 1,
  items,
  items_count: items.reduce((sum, item) => sum + item.quantity, 0),
  total_amount: items.reduce((sum, item) => sum + Number(item.total_price), 0).toFixed(1),
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("CartService", () => {
  let service: CartService;
  let httpTesting: HttpTestingController;
  const toaster = { success: vi.fn(), error: vi.fn(), info: vi.fn() };

  /** Carica il carrello iniziale con le righe indicate. */
  function loadWith(items: ReturnType<typeof rawItem>[]) {
    service.loadCart();
    httpTesting.expectOne("cart").flush({ success: true, data: rawCart(items) });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        // Con l'errorInterceptor reale gli errori arrivano al service già nel formato ApiError
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: Toaster, useValue: toaster },
        { provide: AuthService, useValue: { clearAuth: vi.fn() } },
      ],
    });
    service = TestBed.inject(CartService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it("si inizializza da GET /cart convertendo gli importi in numeri", () => {
    loadWith([rawItem(11, 1, 2), rawItem(12, 2, 1)]);

    const cart = service.cart()!;
    expect(cart.items).toHaveLength(2);
    expect(cart.items[0].total_price).toBe(180);
    expect(cart.items[0].discounted_unit_price).toBe(90);
    expect(cart.items[0].product.price).toBe(100);
    expect(service.itemsCount()).toBe(3);
    expect(service.totalAmount()).toBe(270);
    expect(service.isEmpty()).toBe(false);
  });

  it("aggiunge un prodotto con POST /cart/items e usa il carrello restituito", () => {
    loadWith([]);

    service.addToCart({ id: 3 } as Product, 2);

    const req = httpTesting.expectOne("cart/items");
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ cart_item: { product_id: 3, quantity: 2 } });
    req.flush({ success: true, message: "Aggiunto", data: rawCart([rawItem(21, 3, 2)]) });

    expect(service.itemsCount()).toBe(2);
    expect(service.totalAmount()).toBe(180);
    expect(toaster.success).toHaveBeenCalledWith("Aggiunto");
  });

  it("in caso di 422 sull'aggiunta lascia il carrello invariato e mostra l'errore del backend", () => {
    loadWith([rawItem(11, 1, 1)]);

    service.addToCart({ id: 1 } as Product, 10);
    httpTesting.expectOne("cart/items").flush(
      { success: false, message: "Errore durante l'aggiunta", errors: ["Quantità supera la disponibilità (disponibili: 5)."] },
      { status: 422, statusText: "Unprocessable Entity" },
    );

    expect(service.itemsCount()).toBe(1);
    expect(toaster.error).toHaveBeenCalledWith("Quantità supera la disponibilità (disponibili: 5).");
    expect(service.error()).toContain("disponibili: 5");
  });

  it("aggiorna la quantità con PATCH /cart/items/:id (id della riga) dopo il debounce", async () => {
    loadWith([rawItem(11, 1, 1)]);
    const item = service.cart()!.items[0];

    service.updateQuantity(item, 2);
    service.updateQuantity(item, 3);

    // La quantità scelta è mostrata subito, i totali restano quelli del server
    expect(service.cart()!.items[0].quantity).toBe(3);
    expect(service.totalAmount()).toBe(90);
    expect(service.hasPendingChanges()).toBe(true);
    httpTesting.expectNone("cart/items/11");

    await wait(QUANTITY_DEBOUNCE_MS + 50);

    // Solo l'ultima quantità viene inviata, come valore finale
    const req = httpTesting.expectOne("cart/items/11");
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({ cart_item: { quantity: 3 } });
    req.flush({ success: true, data: rawCart([rawItem(11, 1, 3)]) });

    expect(service.cart()!.items[0].quantity).toBe(3);
    expect(service.totalAmount()).toBe(270);
    expect(service.hasPendingChanges()).toBe(false);
  });

  it("le modifiche a righe diverse vengono inviate entrambe", async () => {
    loadWith([rawItem(11, 1, 1), rawItem(12, 2, 1)]);
    const [first, second] = service.cart()!.items;

    service.updateQuantity(first, 2);
    service.updateQuantity(second, 4);
    await wait(QUANTITY_DEBOUNCE_MS + 50);

    httpTesting.expectOne("cart/items/11").flush({ success: true, data: rawCart([rawItem(11, 1, 2), rawItem(12, 2, 1)]) });
    httpTesting.expectOne("cart/items/12").flush({ success: true, data: rawCart([rawItem(11, 1, 2), rawItem(12, 2, 4)]) });

    expect(service.itemsCount()).toBe(6);
  });

  it("rollback della quantità se il backend risponde 422", async () => {
    loadWith([rawItem(11, 1, 2)]);
    const item = service.cart()!.items[0];

    service.updateQuantity(item, 5);
    expect(service.cart()!.items[0].quantity).toBe(5);
    await wait(QUANTITY_DEBOUNCE_MS + 50);

    httpTesting.expectOne("cart/items/11").flush(
      { success: false, message: "Errore", errors: ["Stock insufficiente"] },
      { status: 422, statusText: "Unprocessable Entity" },
    );

    expect(service.cart()!.items[0].quantity).toBe(2);
    expect(service.hasPendingChanges()).toBe(false);
    expect(toaster.error).toHaveBeenCalledWith("Stock insufficiente");

    // Dopo un errore il flusso resta attivo: una nuova modifica viene inviata
    service.updateQuantity(item, 3);
    await wait(QUANTITY_DEBOUNCE_MS + 50);
    httpTesting.expectOne("cart/items/11").flush({ success: true, data: rawCart([rawItem(11, 1, 3)]) });
    expect(service.cart()!.items[0].quantity).toBe(3);
  });

  it("rimuove una riga con DELETE /cart/items/:id", () => {
    loadWith([rawItem(11, 1, 1), rawItem(12, 2, 2)]);

    service.removeFromCart(service.cart()!.items[1]);

    const req = httpTesting.expectOne("cart/items/12");
    expect(req.request.method).toBe("DELETE");
    req.flush({ success: true, message: "Rimosso", data: rawCart([rawItem(11, 1, 1)]) });

    expect(service.cart()!.items.map((i) => i.id)).toEqual([11]);
    expect(service.itemsCount()).toBe(1);
  });

  it("clearCart svuota lo stato locale senza chiamate API", () => {
    loadWith([rawItem(11, 1, 1)]);

    service.clearCart();

    expect(service.cart()).toBeNull();
    expect(service.itemsCount()).toBe(0);
    expect(service.isEmpty()).toBe(true);
  });
});
