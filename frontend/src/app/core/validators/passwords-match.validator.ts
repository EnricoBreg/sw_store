import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

/**
 * Validator di gruppo: verifica che i due campi password coincidano.
 * In caso contrario il gruppo riceve l'errore `passwordsMismatch`.
 * Se la conferma è ancora vuota non segnala nulla (ci pensa il `required` del campo).
 */
export function passwordsMatchValidator(
  passwordKey = "password",
  confirmationKey = "passwordConfirmation",
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordKey)?.value;
    const confirmation = group.get(confirmationKey)?.value;

    if (!confirmation) {
      return null;
    }

    return password === confirmation ? null : { passwordsMismatch: true };
  };
}
