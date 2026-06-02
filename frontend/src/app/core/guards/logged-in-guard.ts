import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { catchError, map, of } from "rxjs";

export const loggedInGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.authenticated()) {
    router.navigate(["/login"]);
    return false;
  }

  // Qui se la chiamata va a buon fine, il 'tap' del servizio si occuperà di aggiornare l'utente,
  // la guard poi dirà 'true' e lascerà passare l'utente alla rotta protetta.
  return authService.me().pipe(
    map(() => true),
    catchError(() => of(false)) // L'interceptor gestirà il redirect al login, qui si blocca solo la rotta attuale
  );
};
