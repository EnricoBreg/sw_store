import { TestBed } from "@angular/core/testing";
import { Location } from "@angular/common";
import { provideRouter, Router } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import AuthCallback, { tokenFromFragment } from "./auth-callback";
import { AuthService } from "../../core/services/auth.service";

describe("tokenFromFragment", () => {
  it("estrae il token dal fragment, decodificandolo", () => {
    expect(tokenFromFragment("token=abc.def.ghi")).toBe("abc.def.ghi");
    expect(tokenFromFragment("#token=abc.def.ghi")).toBe("abc.def.ghi");
    expect(tokenFromFragment("token=a%2Bb%3D")).toBe("a+b=");
  });

  it("restituisce null se il token manca o è vuoto", () => {
    expect(tokenFromFragment(null)).toBeNull();
    expect(tokenFromFragment("")).toBeNull();
    expect(tokenFromFragment("altro=1")).toBeNull();
    expect(tokenFromFragment("token=")).toBeNull();
  });
});

describe("AuthCallback", () => {
  const authService = { oAuthSignIn: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: "oauth/callback", component: AuthCallback },
          { path: "login", children: [] },
        ]),
        { provide: AuthService, useValue: authService },
      ],
    });
  });

  it("con il token nel fragment avvia il login e toglie il token dall'URL", async () => {
    const harness = await RouterTestingHarness.create();
    const location = TestBed.inject(Location);
    const replaceState = vi.spyOn(location, "replaceState");

    await harness.navigateByUrl("/oauth/callback#token=jwt.di.prova");

    expect(authService.oAuthSignIn).toHaveBeenCalledWith("jwt.di.prova");
    expect(replaceState).toHaveBeenCalledWith("/oauth/callback");
    expect(location.path(true)).not.toContain("token");
  });

  it("senza token torna al login con l'errore oauth_failed", async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl("/oauth/callback");
    await harness.fixture.whenStable();

    expect(authService.oAuthSignIn).not.toHaveBeenCalled();
    expect(TestBed.inject(Router).url).toBe("/login?error=oauth_failed");
  });

  it("con un fragment senza token torna al login con l'errore oauth_failed", async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl("/oauth/callback#error=boh");
    await harness.fixture.whenStable();

    expect(authService.oAuthSignIn).not.toHaveBeenCalled();
    expect(TestBed.inject(Router).url).toBe("/login?error=oauth_failed");
  });
});
