import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiResponse } from "../models/api-types";
import { User } from "../models/user";
import { UsersQuery } from "../services/users.service";

@Injectable({
  providedIn: "root",
})
export class AdminUsersApiService {
  private readonly http = inject(HttpClient);
  private readonly url = "admin/users";

  getUsers(page = 1, limit = 10, searchQuery?: UsersQuery): Observable<ApiResponse<User[]>> {
    let params = new HttpParams()
      .set("page", page)
      .set("limit", limit);

    if (searchQuery) {
      const { searchTerm, orderBy, orderDirection } = searchQuery;

      if (searchTerm) {
        params = params.set("q", searchTerm);
      }
      if (orderBy) {
        params = params.set("order_by", orderBy);
      }
      if (orderDirection) {
        params = params.set("order_direction", orderDirection);
      }

    }

    return this.http.get<ApiResponse<User[]>>(this.url, { params });
  }
}
