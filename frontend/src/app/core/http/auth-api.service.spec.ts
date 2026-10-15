import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { AuthApiService } from "./auth-api.service";
import { BYPASS_GLOBAL_ERROR_HANDLING } from "./interceptors/tokens";

describe("AuthApiService.logout", () => {
  it("usa POST /auth/logout e gestisce gli errori in AuthService (bypass del gestore globale)", () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const api = TestBed.inject(AuthApiService);
    const httpTesting = TestBed.inject(HttpTestingController);

    api.logout().subscribe();

    const req = httpTesting.expectOne("auth/logout");
    expect(req.request.method).toBe("POST");
    expect(req.request.context.get(BYPASS_GLOBAL_ERROR_HANDLING)).toBe(true);
    req.flush({ success: true, message: "Logout effettuato" });
    httpTesting.verify();
  });
});
