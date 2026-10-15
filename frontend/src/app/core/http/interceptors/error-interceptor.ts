import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { catchError, throwError } from "rxjs";
import { inject } from "@angular/core";
import { Toaster } from "../../services/toaster";
import { Router } from "@angular/router";
import { AuthService } from "../../services/auth.service";
import { BYPASS_GLOBAL_ERROR_HANDLING } from "./tokens";
import { toApiError } from "../api-error";

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toaster = inject(Toaster);
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Gestione dell'errore in modo che tutti i service ricevano un ApiError uniforme
      const apiError = toApiError(
        error,
        $localize`:@@httpError.unexpected:Si è verificato un errore inaspettato. Riprova.`,
      );

      const bypassGlobalErrorHandling = req.context.get(BYPASS_GLOBAL_ERROR_HANDLING);

      if (!bypassGlobalErrorHandling) {
        // Gestione globale di eventuali redirect specifici in caso di errori
        if (error.status === 0) {
          toaster.error(
            $localize`:@@httpError.network:Impossibile connettersi al server. Controlla la tua connessione.`,
          );
        } else if (error.status === 401) {
          // utente non loggato o il token è scaduto
          toaster.error($localize`:@@httpError.unauthorized:Sessione scaduta. Effettua nuovamente il login.`);
          authService.clearAuth();
          router.navigate(["/login"]);
        } else if (error.status === 403) {
          // L'utente è loggato ma non ha i permessi per accedere alla risorsa
          router.navigate(["/forbidden"]);
        } else if (error.status >= 500) {
          toaster.error(
            $localize`:@@httpError.server:Si è verificato un errore interno al server. Riprova più tardi.`,
          );
        }
      }
      // Gli errori 404 e 422 vengono lasciati di proposito ai service e alle pagine,
      // che sanno come gestirli (es. pagina non trovata, errori nei form)

      return throwError(() => apiError);
    }),
  );
};
