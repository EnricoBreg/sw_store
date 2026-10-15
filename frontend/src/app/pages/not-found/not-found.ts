import { Component, inject } from "@angular/core";
import { MatAnchor } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import ViewPanel from "../../core/directives/view-panel/view-panel";

@Component({
  selector: "app-not-found",
  imports: [MatAnchor, RouterLink, ViewPanel],
  template: `
    <div class="w-full h-full flex items-center justify-center text-center">
      <div appViewPanel class="m-4">
        <img
          src="assets/404_not_found.svg"
          alt="Not Found"
          class="mx-auto mb-5 w-64 h-64 object-contain"
        />
        <h1 i18n="@@notFound.title" class="text-2xl font-bold text-gray-800">404 - Risorsa non trovata</h1>
        <p i18n="@@notFound.description" class="text-lg text-gray-500 italic">
          La pagina o risorsa che stai cercando non esiste o è stata spostata.
        </p>

        <div class="mt-4 flex items-center justify-center gap-6">
          <a i18n="@@tornaHome" matButton="filled" routerLink="/" i18n-arial-label="@@notFound.tornaHome.ariaLabel" aria-label="Torna alla Home">Torna alla home</a>
          @if (authService.user()?.admin) {
            <a i18n="@@tornaDashboard" matButton="outlined" routerLink="/admin/dashboard" i18n-arial-label="@@notFound.tornaDashboard.ariaLabel" aria-label="Torna alla dashboard">
              Torna alla dashboard
            </a>
          }
        </div>
      </div>
    </div>
  `,
  styles: ``,
})
export default class NotFound {
  readonly authService = inject(AuthService);
}
