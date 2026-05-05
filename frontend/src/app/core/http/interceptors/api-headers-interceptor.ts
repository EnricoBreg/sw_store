import { HttpEvent, HttpHandlerFn, HttpHeaders, HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs";

export function ApiHeadersInterceptor(
   req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {

  const headers = new HttpHeaders({
    "Accept-Language": "it"
  });

  return next(req.clone({ headers }));
}