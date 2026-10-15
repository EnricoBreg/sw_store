import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { ActivatedRoute, convertToParamMap, provideRouter } from "@angular/router";
import LoginPage, { oauthErrorMessage } from "./login-page";
import { AuthService } from "../../core/services/auth.service";

describe("LoginPage", () => {
  function create(error: string | null) {
    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { error: signal(undefined), signIn: vi.fn(), startGoogleOAuth: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(error ? { error } : {}) } },
        },
      ],
    });
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it("mostra il messaggio per oauth_failed", () => {
    const el = create("oauth_failed");
    expect(el.querySelector("[data-testid=oauth-error]")?.textContent).toContain("Accesso con Google non riuscito");
  });

  it("mostra il messaggio per oauth_canceled", () => {
    const el = create("oauth_canceled");
    expect(el.querySelector("[data-testid=oauth-error]")?.textContent).toContain("Accesso con Google annullato");
  });

  it("non mostra nulla senza errore o con un codice sconosciuto", () => {
    expect(create(null).querySelector("[data-testid=oauth-error]")).toBeNull();
    expect(oauthErrorMessage("altro")).toBeNull();
  });
});
