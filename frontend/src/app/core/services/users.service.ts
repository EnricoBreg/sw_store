import { inject, Injectable, signal } from "@angular/core";
import { User } from "../models/user";
import { AdminUsersApiService } from "../http/admin-users-api.service";
import { PaginationMeta } from "../models/api-types";

@Injectable({
  providedIn: "root",
})
export class UsersService {
  private api = inject(AdminUsersApiService);

  #users = signal<User[]>([]);
  #paginationMeta = signal<PaginationMeta | undefined>(undefined);
  #error = signal<string | undefined>(undefined);

  users = this.#users.asReadonly();
  paginationMeta = this.#paginationMeta.asReadonly();
  error = this.#error.asReadonly();

  getUsers(page: number = 1, perPage: number = 10, searchTerm?: string) {
    this.api.getUsers(page, perPage, searchTerm).subscribe({
      next: (response) => {
        this.#users.set(response.data);
        this.#paginationMeta.set(response.meta);
      },
      error: (err) => {
        const msg =
          `${err?.error.error} - ${err?.error.exception}` || "Errore nel caricamento dei prodotti.";
        this.#error.set(msg);
      }
    });
  }
}
