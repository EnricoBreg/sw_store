import { inject, Injectable, signal } from "@angular/core";
import { AdminDashboardApiService } from "../http/admin-dashboard-api.service";
import { getApiErrorMessage } from "../http/api-error";
import { AdminDashboard } from "../models/dashboard";

@Injectable({
  providedIn: "root",
})
export class AdminDashboardService {
  private readonly api = inject(AdminDashboardApiService);

  readonly #dashboard = signal<AdminDashboard | null>(null);
  readonly #error = signal<string | undefined>(undefined);

  readonly dashboard = this.#dashboard.asReadonly();
  readonly error = this.#error.asReadonly();

  loadDashboard() {
    this.#error.set(undefined);
    this.api.getDashboard().subscribe({
      next: (response) => this.#dashboard.set(response.data),
      error: (err) =>
        this.#error.set(
          getApiErrorMessage(err, $localize`:@@adminDashboard.loadError:Errore nel caricamento della dashboard.`),
        ),
    });
  }
}
