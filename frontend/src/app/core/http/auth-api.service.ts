import { HttpClient, HttpResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { ApiResponse } from "../models/api-types";
import { User } from "../models/user";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly url = "/auth/login";

  login(email: string, password: string): Observable<HttpResponse<ApiResponse<User>>> {
    return this.http.post<ApiResponse<User>>(
      "auth/login",
      { user: { email, password } },
      { observe: "response" },
    );
  }

  logout(): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>("auth/logout");
  }

  getCurrentUserInfo(jwtToken: string) {}
}
