import { ComponentFixture, TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import SignupPage from "./signup-page";
import { AuthService } from "../../core/services/auth.service";

describe("SignupPage", () => {
  let fixture: ComponentFixture<SignupPage>;
  const authService = { error: signal(undefined), signUp: vi.fn(), startGoogleOAuth: vi.fn() };

  function input(name: string): HTMLInputElement {
    return fixture.nativeElement.querySelector(`input[formcontrolname=${name}]`);
  }

  function type(name: string, value: string) {
    const el = input(name);
    el.value = value;
    el.dispatchEvent(new Event("input"));
    el.dispatchEvent(new Event("blur"));
    fixture.detectChanges();
  }

  function mismatchAlert(): HTMLElement | null {
    return fixture.nativeElement.querySelector("#password-mismatch-error");
  }

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [SignupPage],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    });
    fixture = TestBed.createComponent(SignupPage);
    fixture.detectChanges();
  });

  it("mostra l'errore se la conferma non coincide, dopo aver toccato il campo", () => {
    type("password", "Password-123");
    expect(mismatchAlert()).toBeNull();

    type("passwordConfirmation", "Password-124");
    expect(mismatchAlert()?.textContent).toContain("Le password non coincidono.");

    type("passwordConfirmation", "Password-123");
    expect(mismatchAlert()).toBeNull();
  });

  it("invia i dati della registrazione solo se il form è valido", () => {
    type("firstName", "Mario");
    type("lastName", "Rossi");
    type("email", "mario.rossi@example.com");
    type("password", "Password-123");
    type("passwordConfirmation", "Password-124");

    fixture.componentInstance.signUp();
    expect(authService.signUp).not.toHaveBeenCalled();

    type("passwordConfirmation", "Password-123");
    type("dateOfBirth", "1990-05-15");
    fixture.componentInstance.signUp();

    expect(authService.signUp).toHaveBeenCalledWith({
      firstName: "Mario",
      lastName: "Rossi",
      email: "mario.rossi@example.com",
      password: "Password-123",
      passwordConfirmation: "Password-123",
      dateOfBirth: "1990-05-15",
    });
  });
});
