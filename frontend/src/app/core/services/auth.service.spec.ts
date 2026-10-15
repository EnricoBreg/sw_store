import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { NEVER, of, throwError } from "rxjs";
import { AuthService } from "./auth.service";
import { AuthApiService } from "../http/auth-api.service";
import { CartService } from "./cart.service";
import { WishlistsService } from "./wishlists.service";
import { Toaster } from "./toaster";

describe("AuthService.signUp", () => {
  const api = { signUp: vi.fn(() => NEVER) };
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthApiService, useValue: api },
        { provide: CartService, useValue: { loadCart: vi.fn(), clearCart: vi.fn() } },
        { provide: WishlistsService, useValue: { loadWishlist: vi.fn(), clearWishlist: vi.fn() } },
        { provide: Toaster, useValue: { error: vi.fn(), success: vi.fn(), info: vi.fn() } },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it("invia il payload nel formato di POST /auth/signup (password_confirmation, date_of_birth)", () => {
    service.signUp({
      firstName: "Mario",
      lastName: "Rossi",
      email: "mario.rossi@example.com",
      password: "Password-123",
      passwordConfirmation: "Password-123",
      dateOfBirth: "1990-05-15",
    });

    expect(api.signUp).toHaveBeenCalledWith({
      first_name: "Mario",
      last_name: "Rossi",
      email: "mario.rossi@example.com",
      password: "Password-123",
      password_confirmation: "Password-123",
      date_of_birth: "1990-05-15",
    });
  });

  it("omette date_of_birth se non indicata", () => {
    service.signUp({
      firstName: "Mario",
      lastName: "Rossi",
      email: "mario.rossi@example.com",
      password: "Password-123",
      passwordConfirmation: "Password-123",
      dateOfBirth: "",
    });

    expect(api.signUp).toHaveBeenCalledWith(expect.not.objectContaining({ date_of_birth: expect.anything() }));
  });
});

describe("AuthService.signOut", () => {
  const api = { logout: vi.fn() };
  const cartService = { loadCart: vi.fn(), clearCart: vi.fn() };
  const wishlistService = { loadWishlist: vi.fn(), clearWishlist: vi.fn() };
  let service: AuthService;
  let router: Router;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem(
      "sw-store",
      JSON.stringify({ user: { id: 1, first_name: "Mario", admin: false }, jwtToken: "jwt-1" }),
    );
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthApiService, useValue: api },
        { provide: CartService, useValue: cartService },
        { provide: WishlistsService, useValue: wishlistService },
        { provide: Toaster, useValue: { error: vi.fn(), success: vi.fn(), info: vi.fn() } },
      ],
    });
    service = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    vi.spyOn(router, "navigate").mockResolvedValue(true);
  });

  afterEach(() => localStorage.clear());

  it("chiama il logout del backend e chiude la sessione locale", () => {
    api.logout.mockReturnValue(of({ success: true }));
    expect(service.authenticated()).toBe(true);

    service.signOut();

    expect(api.logout).toHaveBeenCalled();
    expect(service.authenticated()).toBe(false);
    expect(service.jwtToken()).toBeNull();
    expect(cartService.clearCart).toHaveBeenCalled();
    expect(wishlistService.clearWishlist).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(["/login"]);
  });

  it("chiude la sessione locale anche se il backend risponde con errore", () => {
    api.logout.mockReturnValue(throwError(() => ({ success: false, status: 401, message: "x", errors: [] })));

    service.signOut();

    expect(service.authenticated()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(["/login"]);
  });
});
