import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiResponse } from "../models/api-types";
import { User } from "../models/user";

@Injectable({
  providedIn: "root",
})
export class AdminUsersApiService {
  private readonly http = inject(HttpClient);
  private readonly url = "admin/users";

  getUsers(page = 1, limit = 10, searchTerm?: string): Observable<ApiResponse<User[]>> {
    let params = new HttpParams()
      .set("page", page)
      .set("limit", limit);

    if (searchTerm) {
      params = params.set("q", searchTerm);
    }

    return this.http.get<ApiResponse<User[]>>(this.url, { params });
  }
}
