import { HttpEvent, HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs";

export function ApiInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  
  const apiReq = req.clone({ url: `http://localhost:3000/api/v1/${req.url}` });
  return next(apiReq);
}