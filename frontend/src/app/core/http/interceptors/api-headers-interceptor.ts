import { HttpEvent, HttpHandlerFn, HttpHeaders, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { Observable } from "rxjs";
import { AuthService } from "../../services/auth-service";

export function ApiHeadersInterceptor(
   req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {

  const service = inject(AuthService);
  const token = service.jwtToken()

  const headers = new HttpHeaders({
    "Accept-Language": "it",
    "Authorization": `Bearer ${token}`
  });

  return next(req.clone({ headers }));
}