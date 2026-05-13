import { Component, computed, inject, signal } from "@angular/core";
import { MatTableModule } from "@angular/material/table";
import { UsersQuery, UsersService } from "../../../../core/services/users.service";
import ApiPaginator from "../../../../components/api-paginator/api-paginator";
import { MatInput, MatFormField, MatLabel, MatHint } from "@angular/material/input";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { debounceTime, distinctUntilChanged, map, Subject, takeUntil } from "rxjs";
import { MatIcon } from "@angular/material/icon";
import { MatIconButton } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { MatCheckbox } from "@angular/material/checkbox";
import {MatSort, MatSortModule, MatSortHeader} from '@angular/material/sort';

@Component({
  selector: "app-users-page",
  imports: [
    MatTableModule,
    ApiPaginator,
    MatInput,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatIcon,
    MatHint,
    MatMenuModule,
    MatCheckbox,
    MatIconButton,
    MatSortHeader,
    MatSortModule,
    MatSort,
],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="font-bold text-2xl">Utenti registrati</h1>
        <p class="text-sm text-grat-40">
          Attualmente nel sistema sono registrati {{ usersCount() }} utenti.
        </p>
      </div>

      <!-- Serach bar -->
      <div>
        <mat-form-field>
          <mat-label>Ricerca un utente</mat-label>
          <input matInput type="text" placeholder="Es. Mario" [formControl]="searchControl" />
          <mat-hint>Ricerca per nome o cognome dell'utente</mat-hint>
        </mat-form-field>
      </div>

      <!-- Menu selezione colonne visibili -->
      <div>
        <div class="flex items-center justify-end">
          <button matIconButton [matMenuTriggerFor]="columnsMenu">
            <mat-icon>view_column</mat-icon>
          </button>
          <mat-menu #columnsMenu="matMenu">
            @for (col of allColumns; track col.key) {
              <div mat-menu-item (click)="$event.stopPropagation()">
                <mat-checkbox
                  [checked]="visibleColumns().includes(col.key)"
                  (change)="toggleColumn(col.key)"
                >
                  {{ col.label }}
                </mat-checkbox>
              </div>
            }
          </mat-menu>
        </div>
        <table mat-table [dataSource]="users()" matSort (matSortChange)="onSortChange($event)">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let user">{{ user.id }}</td>
          </ng-container>
          <ng-container matColumnDef="first_name">
            <th mat-header-cell *matHeaderCellDef mat-sort-header sortActionDescription="Ordina per nome">Nome</th>
            <td mat-cell *matCellDef="let user">{{ user.first_name }}</td>
          </ng-container>
          <ng-container matColumnDef="last_name">
            <th mat-header-cell *matHeaderCellDef mat-sort-header sortActionDescription="Ordina per cognome">Cognome</th>
            <td mat-cell *matCellDef="let user">{{ user.last_name }}</td>
          </ng-container>
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef mat-sort-header sortActionDescription="Ordina per email">Email</th>
            <td mat-cell *matCellDef="let user">{{ user.email }}</td>
          </ng-container>
          <ng-container matColumnDef="admin">
            <th mat-header-cell *matHeaderCellDef>Amministratore</th>
            <td mat-cell *matCellDef="let user">{{ user.admin ? "Sì" : "No" }}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns()"></tr>
        </table>
        <app-api-paginator [meta]="pagination()" (pageChangeEvent)="onPageChangeEvent($event)" />
      </div>
    </div>
  `,
  styles: ``,
})
export default class UsersPage {
  service = inject(UsersService);

  allColumns = [
    { key: "id", label: "ID" },
    { key: "first_name", label: "Nome" },
    { key: "last_name", label: "Cognome" },
    { key: "email", label: "Email" },
    { key: "admin", label: "Amministratore" }
  ];
  visibleColumns = signal<string[]>(["id", "first_name", "last_name", "email"]);
  displayedColumns = computed(() =>
    this.allColumns.map((c) => c.key).filter((key) => this.visibleColumns().includes(key)),
  );

  users = this.service.users;
  pagination = this.service.paginationMeta;
  errorMessage = this.service.error;

  usersCount = computed(() => this.users().length);

  searchControl = new FormControl("");
  searchQuery = signal<UsersQuery>({});

  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.service.getUsers();

    this.searchControl.valueChanges
      .pipe(
        debounceTime(500), // aspetta X ms prima di mandare la richiesta
        map((value) => (value ? value.trim() : "")), // prima di mandare la richista, al valore inserito viene prima fatto il tirm
        distinctUntilChanged(), // effettua una chiamata solo se il testo digitato è effettivamente cambiato
        takeUntil(this.destroy$), // per evitare memory leak quando si cambia pagina
      )
      .subscribe((searchTerm) => {
        this.searchQuery.update((sq) => ({ ...sq, searchTerm }));
        this.service.getUsers(1, this.pagination()?.limit, this.searchQuery());
      });
  }

  onPageChangeEvent(event: { page: number; limit: number }) {
    this.service.getUsers(event.page, event.limit);
  }

  toggleColumn(key: string) {
    this.visibleColumns.update((current) =>
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key],
    );
  }

  onSortChange(event: { active: string, direction: string }) {
    console.log("Event", event);
    this.searchQuery.update(sq => ({ ...sq, orderBy: event.active, orderDirection: event.direction }))
    this.service.getUsers(this.pagination()?.page, this.pagination()?.limit, this.searchQuery())
  }
}
