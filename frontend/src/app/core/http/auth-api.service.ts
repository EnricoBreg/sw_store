import { HttpBackend, HttpClient, HttpHeaders, HttpResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { ApiResponse } from "../models/api-types";
import { User } from "../models/user";
import { Observable } from "rxjs";
import { ObservableSuccessOrError } from "@ngxpert/hot-toast";

@Injectable({
  providedIn: "root",
})
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly loginUrl = "auth/login";
  private readonly signUpUrl = "auth/signup";
  private readonly logoutUrl = "auth/logout";
  private readonly meUrl = "http://localhost:3000/api/v1/auth/me";

  private readonly httpBackend = inject(HttpBackend);
  // client senza interceptor (usato esclusivamente nel caso di autenticazione con OAuth)
  private readonly rawHttp = new HttpClient(this.httpBackend);

  login(email: string, password: string): Observable<HttpResponse<ApiResponse<User>>> {
    return this.http.post<ApiResponse<User>>(
      this.loginUrl,
      { user: { email, password } },
      { observe: "response" },
    );
  }

  signUp(user: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    passwordConfirmation: string;
  }): Observable<HttpResponse<ApiResponse<User>>> {
    return this.http.post<ApiResponse<User>>(
      this.signUpUrl, 
      { user: {...user} },
      { observe: "response"}
    );
  }

  logout(): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(this.logoutUrl);
  }

  /**
   * Questo metodo ritorna le informazioni dell'utente attualmente loggato.
   * Accetta come parametro il token JWT, da usare SOLO in caso di
   * flusso autenticazione tramite OminAuth.
   */
  getCurrentUserInfo(token?: string): Observable<ApiResponse<User>> {
    // Caso di autenticazione tramite OAuth: bypass interceptors
    if (token) {
      return this.rawHttp.get<ApiResponse<User>>(this.meUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    // Caso standard: uso di client con interceptor
    return this.http.get<ApiResponse<User>>(this.meUrl);
  }
}
