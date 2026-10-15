import { HttpEvent, HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject, LOCALE_ID } from "@angular/core";
import { Observable } from "rxjs";
import { AuthService } from "../../services/auth.service";
import { normalizeLocale } from "../../i18n/locales";

// Lingua dei messaggi del backend (header Accept-Language): la stessa dell'interfaccia
export const apiLanguageFromLocale = normalizeLocale;

export function apiHeadersInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const token = inject(AuthService).jwtToken();
  const locale = inject(LOCALE_ID);

  // setHeaders aggiunge gli header senza cancellare quelli già impostati dal chiamante
  const headers: Record<string, string> = {
    "Accept-Language": apiLanguageFromLocale(locale),
  };

  // L'Authorization viene inviato solo se l'utente ha un token e la richiesta non ne ha già uno
  if (token && !req.headers.has("Authorization")) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return next(req.clone({ setHeaders: headers }));
}
