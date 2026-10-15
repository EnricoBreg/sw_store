import { TestBed } from "@angular/core/testing";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { WishlistsService } from "./wishlists.service";
import { CartService } from "./cart.service";
import { Toaster } from "./toaster";
import { AuthService } from "./auth.service";
import { errorInterceptor } from "../http/interceptors/error-interceptor";
import Product from "../models/product";

const rawProduct = (id: number) => ({
  id,
  name: `Prodotto ${id}`,
  description: "Descrizione di prova",
  price: "50.0",
  discount_percentage: "0.0",
  stock_quantity: 3,
  active: true,
  image_url: null,
  category: { id: 1, name: "Varie", description: null },
});
const rawWishlist = (productIds: number[]) => ({
  id: 4,
  user_id: 1,
  items: productIds.map((id) => ({ id: 100 + id, wishlist_id: 4, product: rawProduct(id) })),
});

describe("WishlistsService", () => {
  let service: WishlistsService;
  let httpTesting: HttpTestingController;
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
    service = TestBed.inject(WishlistsService);
    httpTesting = TestBed.inject(HttpTestingController);

    service.loadWishlist();
    httpTesting.expectOne("wishlist").flush({ success: true, data: rawWishlist([1]) });
  });

  afterEach(() => httpTesting.verify());

  it("legge la wishlist dal backend convertendo i prezzi", () => {
    expect(service.isInWishlist(1)).toBe(true);
    expect(service.wishlist()!.items[0].product.price).toBe(50);
  });

  it("aggiunge un prodotto e segna la richiesta in corso", () => {
    service.addToWishlist({ id: 2 } as Product);
    expect(service.isPending(2)).toBe(true);

    httpTesting.expectOne("wishlist/items").flush({ success: true, data: rawWishlist([1, 2]) });

    expect(service.isPending(2)).toBe(false);
    expect(service.isInWishlist(2)).toBe(true);
  });

  it("move-to-cart: aggiorna la wishlist e rilegge il carrello", () => {
    service.moveToCart({ id: 1 } as Product);

    const req = httpTesting.expectOne("wishlist/items/1/move");
    expect(req.request.method).toBe("PUT");
    req.flush({ success: true, message: "Aggiunto al carrello", data: rawWishlist([]) });

    expect(service.isInWishlist(1)).toBe(false);
    expect(cartService.loadCart).toHaveBeenCalled();
  });

  it("move-to-cart con 422 (stock insufficiente) lascia la wishlist invariata", () => {
    service.moveToCart({ id: 1 } as Product);

    httpTesting.expectOne("wishlist/items/1/move").flush(
      { success: false, message: "Errore", errors: ["Prodotto non disponibile"] },
      { status: 422, statusText: "Unprocessable Entity" },
    );

    expect(service.isInWishlist(1)).toBe(true);
    expect(cartService.loadCart).not.toHaveBeenCalled();
    expect(toaster.error).toHaveBeenCalledWith("Prodotto non disponibile");
  });
});
