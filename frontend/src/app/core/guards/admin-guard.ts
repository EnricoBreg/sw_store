import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Ospite: deve prima autenticarsi
  if (!authService.authenticated()) {
    return router.parseUrl("/login");
  }

  // Utente autenticato ma senza ruolo admin: accesso negato
  if (!authService.user()?.admin) {
    return router.parseUrl("/forbidden");
  }

  return true;
};
