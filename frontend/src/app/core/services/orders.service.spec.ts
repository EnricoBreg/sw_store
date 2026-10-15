import { TestBed } from "@angular/core/testing";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { provideRouter, Router } from "@angular/router";
import { OrderData, OrdersService } from "./orders.service";
import { CartService } from "./cart.service";
import { Toaster } from "./toaster";
import { AuthService } from "./auth.service";
import { errorInterceptor } from "../http/interceptors/error-interceptor";

const formData: OrderData = {
  order: {
    first_name: "Mario",
    last_name: "Rossi",
    street: "Via Roma 1",
    city: "Rovigo",
    zip_code: "45100",
    country: "Italia",
  },
  payment: { payment_method: "card", stripe_payment_token: "tok_demo_card_abc" },
};

const expectedPayload = {
  order: { ...formData.order, stripe_payment_token: "tok_demo_card_abc" },
};

const rawOrder = (id: number) => ({
  id,
  code: `ORD-${id}`,
  ...formData.order,
  total_amount: "179.82",
  stripe_payment_token: "tok_demo_card_abc",
  status: "pending",
  created_at: "2026-10-15T20:00:00Z",
  updated_at: "2026-10-15T20:00:00Z",
  items: [{ id: 1, order_id: id, quantity: 2, unit_price: "89.91", discount_percentage: "10.0", total_price: "179.82" }],
});

describe("OrdersService", () => {
  let service: OrdersService;
  let httpTesting: HttpTestingController;
  let router: Router;
  const cartService = { loadCart: vi.fn() };
  const toaster = { success: vi.fn(), error: vi.fn(), info: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: CartService, useValue: cartService },
        { provide: Toaster, useValue: toaster },
        { provide: AuthService, useValue: { clearAuth: vi.fn() } },
      ],
    });
    service = TestBed.inject(OrdersService);
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, "navigate").mockResolvedValue(true);
  });

  afterEach(() => httpTesting.verify());

  describe("checkout", () => {
    it("invia POST /orders e in caso di successo rilegge il carrello e va alla conferma", () => {
      service.checkout(formData);
      expect(service.checkoutStatus()).toBe("submitting");

      const req = httpTesting.expectOne("orders");
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual(expectedPayload);
      req.flush({ success: true, message: "Ordine creato", data: rawOrder(42) }, { status: 201, statusText: "Created" });

      expect(service.checkoutStatus()).toBe("success");
      expect(service.order()!.total_amount).toBe(179.82);
      expect(cartService.loadCart).toHaveBeenCalled();
      expect(toaster.success).toHaveBeenCalledWith("Ordine creato");
      expect(router.navigate).toHaveBeenCalledWith(["/checkout/confirmation", 42], { replaceUrl: true });
    });

    it("in caso di 422 espone messaggio ed errori del backend, senza navigare", () => {
      service.checkout(formData);
      httpTesting.expectOne("orders").flush(
        { success: false, message: "Checkout non riuscito", errors: ["Stock insufficiente per Lampada (disponibili: 0)."] },
        { status: 422, statusText: "Unprocessable Entity" },
      );

      expect(service.checkoutStatus()).toBe("error");
      expect(service.checkoutError()).toEqual({
        message: "Checkout non riuscito",
        errors: ["Stock insufficiente per Lampada (disponibili: 0)."],
      });
      expect(router.navigate).not.toHaveBeenCalled();
      expect(cartService.loadCart).not.toHaveBeenCalled();
    });

    it("retry rimanda la stessa richiesta e azzera l'errore", () => {
      service.checkout(formData);
      httpTesting.expectOne("orders").flush(
        { success: false, message: "Errore", errors: [] },
        { status: 422, statusText: "Unprocessable Entity" },
      );

      service.retryCheckout();
      expect(service.checkoutStatus()).toBe("submitting");
      expect(service.checkoutError()).toBeUndefined();

      const retry = httpTesting.expectOne("orders");
      expect(retry.request.body).toEqual(expectedPayload);
      retry.flush({ success: true, data: rawOrder(43) }, { status: 201, statusText: "Created" });

      expect(service.checkoutStatus()).toBe("success");
    });

    it("retry senza un invio precedente non fa nulla", () => {
      service.retryCheckout();
      httpTesting.expectNone("orders");
      expect(service.checkoutStatus()).toBe("idle");
    });

    it("ignora un secondo invio mentre il primo è in corso", () => {
      service.checkout(formData);
      service.checkout(formData);

      httpTesting.expectOne("orders").flush({ success: true, data: rawOrder(44) }, { status: 201, statusText: "Created" });
    });

    it("resetCheckout riporta allo stato iniziale", () => {
      service.checkout(formData);
      httpTesting.expectOne("orders").flush(
        { success: false, message: "Errore", errors: [] },
        { status: 422, statusText: "Unprocessable Entity" },
      );

      service.resetCheckout();

      expect(service.checkoutStatus()).toBe("idle");
      expect(service.checkoutError()).toBeUndefined();
      service.retryCheckout();
      httpTesting.expectNone("orders");
    });
  });

  describe("loadOrders", () => {
    it("usa page, limit e il filtro per stato e salva i meta di paginazione", () => {
      service.loadOrders(2, 5, ["paid", "shipped"]);

      const req = httpTesting.expectOne((r) => r.url === "orders");
      expect(req.request.params.get("page")).toBe("2");
      expect(req.request.params.get("limit")).toBe("5");
      expect(req.request.params.get("status")).toBe("paid,shipped");
      expect(req.request.params.has("per_page")).toBe(false);
      req.flush({
        success: true,
        data: [rawOrder(1), rawOrder(2)],
        meta: { count: 7, limit: 5, page: 2, pages: 2, previous: 1 },
      });

      expect(service.orders()).toHaveLength(2);
      expect(service.orders()[0].total_amount).toBe(179.82);
      expect(service.paginationMeta()).toEqual({ count: 7, limit: 5, page: 2, pages: 2, previous: 1 });
      expect(service.listLoaded()).toBe(true);
    });

    it("senza filtro non invia il parametro status", () => {
      service.loadOrders();

      const req = httpTesting.expectOne((r) => r.url === "orders");
      expect(req.request.params.has("status")).toBe(false);
      req.flush({ success: true, data: [], meta: { count: 0, limit: 10, page: 1, pages: 1 } });
    });
  });
});
