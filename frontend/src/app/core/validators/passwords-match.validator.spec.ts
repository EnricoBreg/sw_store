import { FormControl, FormGroup } from "@angular/forms";
import { passwordsMatchValidator } from "./passwords-match.validator";

function buildGroup(password: string, passwordConfirmation: string) {
  return new FormGroup(
    {
      password: new FormControl(password),
      passwordConfirmation: new FormControl(passwordConfirmation),
    },
    { validators: passwordsMatchValidator() },
  );
}

describe("passwordsMatchValidator", () => {
  it("è valido se le password coincidono", () => {
    const group = buildGroup("Segreta-123", "Segreta-123");
    expect(group.hasError("passwordsMismatch")).toBe(false);
    expect(group.valid).toBe(true);
  });

  it("segnala passwordsMismatch se le password sono diverse", () => {
    const group = buildGroup("Segreta-123", "Segreta-124");
    expect(group.hasError("passwordsMismatch")).toBe(true);
    expect(group.valid).toBe(false);
  });

  it("non segnala nulla finché la conferma è vuota", () => {
    const group = buildGroup("Segreta-123", "");
    expect(group.hasError("passwordsMismatch")).toBe(false);
  });

  it("si aggiorna quando cambia uno dei due campi", () => {
    const group = buildGroup("Segreta-123", "Segreta-123");
    group.controls.password.setValue("Altra-456");
    expect(group.hasError("passwordsMismatch")).toBe(true);

    group.controls.passwordConfirmation.setValue("Altra-456");
    expect(group.hasError("passwordsMismatch")).toBe(false);
  });

  it("accetta nomi di campo personalizzati", () => {
    const group = new FormGroup(
      { pwd: new FormControl("a1"), pwd2: new FormControl("b2") },
      { validators: passwordsMatchValidator("pwd", "pwd2") },
    );
    expect(group.hasError("passwordsMismatch")).toBe(true);
  });
});
