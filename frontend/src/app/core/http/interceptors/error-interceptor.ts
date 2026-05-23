import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { catchError, throwError } from "rxjs";
import { ApiResponse } from "../../models/api-types";
import { inject } from "@angular/core";
import { Toaster } from "../../services/toaster";
import { Router } from "@angular/router";
import { AuthService } from "../../services/auth-service";
import { BYPASS_GLOBAL_ERROR_HANDLING } from "./tokens";

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toaster = inject(Toaster);
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Gestione dell'errore in modo che tutti i service abbiano un comportamento uniforme
      console.error("HTTP Error:", error);

      const shapedError: ApiResponse<null> = {
        success: false,
        data: null,
        message: "Si è verificato un errore inaspettato. Riprova.",
        errors: [],
      };

      if (error.error && typeof error.error === "object") {
        shapedError.message = error.error.message || shapedError.message;
        shapedError.errors = error.error.errors || [];
      }

      const bypassGlobalErrorHandling = req.context.get(BYPASS_GLOBAL_ERROR_HANDLING);

      if (!bypassGlobalErrorHandling) {
        // Gestione globale di eventuali redirect specifici in caso di errori
        if (error.status === 0) {
          toaster.error("Impossibile connettersi al server. Controlla la tua connessione.");
        } else if (error.status === 401) {
          // utente non loggato o il token è scaduto
          toaster.error("Sessione scaduta. Effettua nuovamente il login.");
          authService.clearAuth();
          router.navigate(["/login"]);
        } else if (error.status === 403) {
          // L'utente è loggato ma non ha i permessi per accedere alla risorsa
          router.navigate(["/forbidden"]);
        } else if (error.status === 404) {
          router.navigate(["not-found"]);
        } else if (error.status >= 500) {
          toaster.error("Sì è verificato un errore interno al server. Riprova più tardi.");
        }
      }
      // l'errore 422 (Unprocessable Entity) viene ignorato di proposito in modo
      // che sia il service specifico a gestirlo (come ad esempio, per mostrare errori nei form)

      return throwError(() => shapedError);
    }),
  );
};
