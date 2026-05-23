import { Component, inject } from "@angular/core";
import { MatAnchor } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../core/services/auth-service";
import ViewPanel from "../../core/directives/view-panel/view-panel";

@Component({
  selector: "app-forbidden",
  imports: [MatAnchor, RouterLink, ViewPanel],
  template: `
    <div class="w-full h-full flex items-center justify-center text-center">
      <div appViewPanel class="m-4">
        <img
          src="assets/403_forbidden.svg"
          alt="Forbidden"
          class="mx-auto mb-5 w-64 h-64 object-contain"
        />
        <h1 class="text-2xl font-bold text-gray-800">403 - Non hai i permessi necessari</h1>
        <p class="text-lg text-gray-500 italic">
          Sembra che tu non abbia i permessi necessari per accedere a questa risorsa.
        </p>

        <div class="mt-4 flex items-center justify-center gap-6">
          <a matButton="filled" routerLink="/" aria-label="Torna alla Home">Torna alla home</a>
          @if (authService.user()?.admin) {
            <a matButton="outlined" routerLink="/admin/dashboard" aria-label="Torna alla dashboard"
              >Torna alla dashboard</a
            >
          }
        </div>
      </div>
    </div>
  `,
  styles: ``,
})
export default class Forbidden {
  readonly authService = inject(AuthService);
}
