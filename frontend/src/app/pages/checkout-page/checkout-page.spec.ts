import { ComponentFixture, TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import CheckoutPage from "./checkout-page";
import { CheckoutStatus, OrdersError, OrdersService } from "../../core/services/orders.service";
import { CartService } from "../../core/services/cart.service";
import { Cart } from "../../core/models/cart";

const cartWithItem: Cart = {
  id: 1,
  user_id: 1,
  items_count: 1,
  total_amount: 90,
  items: [
    {
      id: 11,
      cart_id: 1,
      product_id: 5,
      quantity: 1,
      unit_price: 100,
      discount_percentage: 10,
      discounted_unit_price: 90,
      total_price: 90,
      product: {
        id: 5,
        name: "Lampada",
        description: "Lampada da tavolo",
        price: 100,
        discount_percentage: 10,
        stock_quantity: 3,
        image_url: null,
        active: true,
        category: { id: 1, name: "Varie", description: "" },
      },
    },
  ],
};

describe("CheckoutPage", () => {
  let fixture: ComponentFixture<CheckoutPage>;
  const checkoutStatus = signal<CheckoutStatus>("idle");
  const checkoutError = signal<OrdersError | undefined>(undefined);
  const ordersService = {
    checkoutStatus,
    checkoutError,
    checkout: vi.fn(),
    retryCheckout: vi.fn(),
    resetCheckout: vi.fn(),
  };
  const cart = signal<Cart | null>(cartWithItem);
  const cartService = {
    cart,
    isEmpty: signal(false),
    totalAmount: signal(90),
    loadCart: vi.fn(),
  };

  const el = () => fixture.nativeElement as HTMLElement;
  const submitButton = () => el().querySelector<HTMLButtonElement>("[data-testid=checkout-submit]")!;

  function fill(name: string, value: string) {
    const input = el().querySelector<HTMLInputElement>(`input[formcontrolname=${name}]`)!;
    input.value = value;
    input.dispatchEvent(new Event("input"));
  }

  function fillValidForm() {
    fill("first_name", "Mario");
    fill("last_name", "Rossi");
    fill("street", "Via Roma 1");
    fill("city", "Rovigo");
    fill("zip_code", "45100");
    fill("country", "Italia");
    fixture.componentInstance.checkoutForm.get("payment.payment_method")!.setValue("card");
    fixture.detectChanges();
  }

  beforeEach(() => {
    vi.clearAllMocks();
    checkoutStatus.set("idle");
    checkoutError.set(undefined);
    cart.set(cartWithItem);
    cartService.isEmpty.set(false);

    TestBed.configureTestingModule({
      imports: [CheckoutPage],
      providers: [
        provideRouter([]),
        { provide: OrdersService, useValue: ordersService },
        { provide: CartService, useValue: cartService },
      ],
    });
    fixture = TestBed.createComponent(CheckoutPage);
    fixture.detectChanges();
  });

  it("all'ingresso azzera lo stato del checkout e rilegge il carrello", () => {
    expect(ordersService.resetCheckout).toHaveBeenCalled();
    expect(cartService.loadCart).toHaveBeenCalled();
  });

  it("invia i dati del form con il token di pagamento", () => {
    fillValidForm();
    expect(submitButton().disabled).toBe(false);

    submitButton().click();

    expect(ordersService.checkout).toHaveBeenCalledTimes(1);
    const data = ordersService.checkout.mock.calls[0][0];
    expect(data.order).toEqual({
      first_name: "Mario",
      last_name: "Rossi",
      street: "Via Roma 1",
      zip_code: "45100",
      city: "Rovigo",
      country: "Italia",
    });
    expect(data.payment.stripe_payment_token).toMatch(/^tok_demo_card_/);
  });

  it("durante l'invio il bottone è disabilitato e mostra il caricamento", () => {
    fillValidForm();
    checkoutStatus.set("submitting");
    fixture.detectChanges();

    expect(submitButton().disabled).toBe(true);
    expect(submitButton().getAttribute("aria-busy")).toBe("true");
    expect(submitButton().querySelector("mat-progress-spinner")).not.toBeNull();
    expect(submitButton().textContent).toContain("Invio dell'ordine...");
  });

  it("in caso di errore mostra il messaggio del backend e il pulsante Riprova", () => {
    fillValidForm();
    checkoutStatus.set("error");
    checkoutError.set({ message: "Checkout non riuscito", errors: ["Stock insufficiente per Lampada"] });
    fixture.detectChanges();

    const panel = el().querySelector("[data-testid=checkout-error]")!;
    expect(panel.getAttribute("role")).toBe("alert");
    expect(panel.textContent).toContain("Checkout non riuscito");
    expect(panel.textContent).toContain("Stock insufficiente per Lampada");

    const retry = Array.from(panel.querySelectorAll("button")).find((b) => b.textContent?.includes("Riprova"))!;
    retry.click();
    expect(ordersService.retryCheckout).toHaveBeenCalled();

    // I dati del form restano quelli inseriti
    expect(fixture.componentInstance.checkoutForm.get("order.first_name")!.value).toBe("Mario");
  });

  it("con il carrello vuoto non mostra il form ma un messaggio", () => {
    cartService.isEmpty.set(true);
    fixture.detectChanges();

    expect(el().querySelector("[data-testid=checkout-empty-cart]")?.textContent).toContain("Il tuo carrello è vuoto");
    expect(el().querySelector("form")).toBeNull();
  });
});
