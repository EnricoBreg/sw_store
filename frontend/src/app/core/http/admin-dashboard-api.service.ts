import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiResponse } from "../models/api-types";
import { AdminDashboard } from "../models/dashboard";
import { mapData, normalizeDashboard } from "../models/normalize";

@Injectable({
  providedIn: "root",
})
export class AdminDashboardApiService {
  private readonly http = inject(HttpClient);

  getDashboard(): Observable<ApiResponse<AdminDashboard>> {
    return this.http.get<ApiResponse<AdminDashboard>>("admin/dashboard").pipe(mapData(normalizeDashboard));
  }
}
