import { HttpEvent, HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { Observable } from "rxjs";
import { API_URL } from "../api-config";

export function apiInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  // Gli URL assoluti vengono lasciati invariati, quelli relativi puntano alle API del backend
  if (/^https?:\/\//i.test(req.url)) {
    return next(req);
  }

  const apiUrl = inject(API_URL);
  const apiReq = req.clone({ url: `${apiUrl}/${req.url}` });
  return next(apiReq);
}
