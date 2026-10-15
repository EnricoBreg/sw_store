import { TestBed } from "@angular/core/testing";
import { HttpClient, provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { LOCALE_ID, signal } from "@angular/core";
import { AuthService } from "../../services/auth.service";
import { API_URL } from "../api-config";
import { apiInterceptor } from "./api-interceptor";
import { apiHeadersInterceptor, apiLanguageFromLocale } from "./api-headers-interceptor";

const API = "http://api.test/api/v1";

function setup(options: { token: string | null; locale: string }) {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([apiInterceptor, apiHeadersInterceptor])),
      provideHttpClientTesting(),
      { provide: API_URL, useValue: API },
      { provide: LOCALE_ID, useValue: options.locale },
      { provide: AuthService, useValue: { jwtToken: signal(options.token) } },
    ],
  });

  return {
    http: TestBed.inject(HttpClient),
    httpTesting: TestBed.inject(HttpTestingController),
  };
}

describe("apiHeadersInterceptor", () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it("aggiunge l'URL base del backend e il token se l'utente è autenticato", () => {
    const { http, httpTesting } = setup({ token: "jwt-123", locale: "it" });

    http.get("products").subscribe();

    const req = httpTesting.expectOne(`${API}/products`);
    expect(req.request.headers.get("Authorization")).toBe("Bearer jwt-123");
    expect(req.request.headers.get("Accept-Language")).toBe("it");
    req.flush({ success: true, data: [] });
  });

  it("non invia Authorization se non c'è un token", () => {
    const { http, httpTesting } = setup({ token: null, locale: "it" });

    http.get("products").subscribe();

    const req = httpTesting.expectOne(`${API}/products`);
    expect(req.request.headers.has("Authorization")).toBe(false);
    req.flush({ success: true, data: [] });
  });

  it("deriva Accept-Language dal LOCALE_ID", () => {
    const { http, httpTesting } = setup({ token: null, locale: "en-US" });

    http.get("categories").subscribe();

    const req = httpTesting.expectOne(`${API}/categories`);
    expect(req.request.headers.get("Accept-Language")).toBe("en");
    req.flush({ success: true, data: [] });
  });

  it("mantiene gli header impostati dal chiamante", () => {
    const { http, httpTesting } = setup({ token: "jwt-123", locale: "it" });

    http.get("auth/me", { headers: { "X-Custom": "valore", Authorization: "Bearer altro" } }).subscribe();

    const req = httpTesting.expectOne(`${API}/auth/me`);
    expect(req.request.headers.get("X-Custom")).toBe("valore");
    expect(req.request.headers.get("Authorization")).toBe("Bearer altro");
    expect(req.request.headers.get("Accept-Language")).toBe("it");
    req.flush({ success: true, data: null });
  });

  it("lascia invariati gli URL assoluti", () => {
    const { http, httpTesting } = setup({ token: null, locale: "it" });

    http.get("http://altro.host/risorsa").subscribe();

    httpTesting.expectOne("http://altro.host/risorsa").flush({});
  });
});

describe("apiLanguageFromLocale", () => {
  it("mappa i locale inglesi su en e tutti gli altri su it", () => {
    expect(apiLanguageFromLocale("en")).toBe("en");
    expect(apiLanguageFromLocale("en-GB")).toBe("en");
    expect(apiLanguageFromLocale("it")).toBe("it");
    expect(apiLanguageFromLocale("it-IT")).toBe("it");
    expect(apiLanguageFromLocale("fr")).toBe("it");
  });
});
