import { Component, inject, LOCALE_ID } from "@angular/core";
import { DOCUMENT, PlatformLocation } from "@angular/common";
import { Router } from "@angular/router";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { AppLocale, buildLocaleUrl, normalizeLocale, SUPPORTED_LOCALES } from "../../core/i18n/locales";

@Component({
  selector: "app-language-selector",
  imports: [MatButton, MatIcon, MatMenuModule],
  template: `
    <button
      matButton
      type="button"
      data-testid="language-selector"
      [matMenuTriggerFor]="languageMenu"
      i18n-aria-label="@@languageSelector.ariaLabel"
      aria-label="Cambia lingua"
    >
      <mat-icon>language</mat-icon>
      <span class="uppercase">{{ currentLocale }}</span>
    </button>

    <mat-menu #languageMenu="matMenu" xPosition="before">
      @for (option of locales; track option.code) {
        <button
          mat-menu-item
          type="button"
          [attr.data-testid]="'language-' + option.code"
          [attr.lang]="option.code"
          [attr.aria-current]="option.code === currentLocale ? 'true' : null"
          (click)="switchTo(option.code)"
        >
          @if (option.code === currentLocale) {
            <mat-icon>check</mat-icon>
          }
          <span>{{ option.label }}</span>
        </button>
      }
    </mat-menu>
  `,
  styles: ``,
})
export default class LanguageSelector {
  private readonly router = inject(Router);
  private readonly platformLocation = inject(PlatformLocation);
  private readonly document = inject(DOCUMENT);

  readonly locales = SUPPORTED_LOCALES;
  readonly currentLocale: AppLocale = normalizeLocale(inject(LOCALE_ID));

  switchTo(targetLocale: AppLocale) {
    if (targetLocale === this.currentLocale) return;

    // Ogni lingua è una build separata: serve un caricamento completo della pagina
    const url = buildLocaleUrl(
      this.platformLocation.getBaseHrefFromDOM(),
      this.currentLocale,
      targetLocale,
      this.router.url,
    );
    this.navigateTo(url);
  }

  /** Caricamento completo dell'URL (separato per poterlo sostituire nei test). */
  navigateTo(url: string) {
    this.document.location.assign(url);
  }
}
