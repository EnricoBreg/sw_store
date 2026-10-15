import { inject, Injectable, signal } from "@angular/core";
import { User } from "../models/user";
import { AdminUsersApiService } from "../http/admin-users-api.service";
import { PaginationMeta } from "../models/api-types";
import { getApiErrorMessage } from "../http/api-error";

export interface UsersQuery {
  searchTerm?: string;
  orderBy?: string;
  orderDirection?: string;
}

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

  getUsers(page: number = 1, perPage: number = 10, searchQuery?: UsersQuery) {
    this.api.getUsers(page, perPage, searchQuery).subscribe({
      next: (response) => {
        this.#users.set(response.data);
        this.#paginationMeta.set(response.meta);
      },
      error: (err) => {
        this.#error.set(
          getApiErrorMessage(err, $localize`:@@usersService.loadError:Errore nel caricamento degli utenti.`),
        );
      }
    });
  }
}
