import { TestBed } from "@angular/core/testing";
import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { Router } from "@angular/router";
import { AuthService } from "../../services/auth.service";
import { Toaster } from "../../services/toaster";
import { ApiError } from "../api-error";
import { errorInterceptor } from "./error-interceptor";
import { BYPASS_GLOBAL_ERROR_HANDLING } from "./tokens";

describe("errorInterceptor", () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  const toaster = { error: vi.fn(), success: vi.fn(), info: vi.fn() };
  const authService = { clearAuth: vi.fn() };
  const router = { navigate: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: Toaster, useValue: toaster },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  function request(url: string, context?: HttpContext): Promise<ApiError> {
    return new Promise((resolve) => {
      http.get(url, { context }).subscribe({ error: (err: ApiError) => resolve(err) });
    });
  }

  it("rilancia un ApiError uniforme per un 422", async () => {
    const result = request("orders");
    httpTesting
      .expectOne("orders")
      .flush(
        { success: false, message: "Checkout non riuscito", errors: ["Carrello vuoto"] },
        { status: 422, statusText: "Unprocessable Entity" },
      );

    expect(await result).toEqual({
      success: false,
      status: 422,
      message: "Checkout non riuscito",
      errors: ["Carrello vuoto"],
    });
    expect(router.navigate).not.toHaveBeenCalled();
    expect(toaster.error).not.toHaveBeenCalled();
  });

  it("non reindirizza su un 404: lo gestisce la pagina", async () => {
    const result = request("products/999");
    httpTesting
      .expectOne("products/999")
      .flush({ success: false, message: "Non trovato" }, { status: 404, statusText: "Not Found" });

    const err = await result;
    expect(err.status).toBe(404);
    expect(err.message).toBe("Non trovato");
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it("su 401 pulisce la sessione e porta al login", async () => {
    const result = request("cart");
    httpTesting
      .expectOne("cart")
      .flush({ error: "Unauthorized", message: "Autenticazione richiesta" }, { status: 401, statusText: "Unauthorized" });

    const err = await result;
    expect(err.message).toBe("Autenticazione richiesta");
    expect(authService.clearAuth).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(["/login"]);
    expect(toaster.error).toHaveBeenCalledTimes(1);
  });

  it("su 403 porta alla pagina forbidden", async () => {
    const result = request("admin/products");
    httpTesting
      .expectOne("admin/products")
      .flush({ error: "Forbidden", message: "Accesso negato" }, { status: 403, statusText: "Forbidden" });

    await result;
    expect(router.navigate).toHaveBeenCalledWith(["/forbidden"]);
  });

  it("con BYPASS_GLOBAL_ERROR_HANDLING non fa redirect né toast", async () => {
    const result = request("auth/login", new HttpContext().set(BYPASS_GLOBAL_ERROR_HANDLING, true));
    httpTesting
      .expectOne("auth/login")
      .flush({ error: "Email o password non validi." }, { status: 401, statusText: "Unauthorized" });

    const err = await result;
    expect(err.message).toBe("Email o password non validi.");
    expect(authService.clearAuth).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(toaster.error).not.toHaveBeenCalled();
  });
});
