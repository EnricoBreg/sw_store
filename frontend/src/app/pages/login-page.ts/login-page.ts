import { Component, inject, signal } from "@angular/core";
import { NonNullableFormBuilder, Validators } from "@angular/forms";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatDivider } from "@angular/material/divider";
import { FormGroup, FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormField, MatLabel, MatPrefix, MatSuffix } from "@angular/material/select";
import { MatInput } from "@angular/material/input";
import { MatIcon } from "@angular/material/icon";
import { AuthService } from "../../core/services/auth.service";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { ErrorPanel } from "../../core/directives/error-panel";
import { LoadingService } from "../../core/http/services/loading.service";

/** Messaggio da mostrare per il codice di errore OAuth ricevuto nella query string. */
export function oauthErrorMessage(code: string | null): string | null {
  switch (code) {
    case "oauth_failed":
      return $localize`:@@login.oauthFailed:Accesso con Google non riuscito. Riprova o accedi con email e password.`;
    case "oauth_canceled":
      return $localize`:@@login.oauthCanceled:Accesso con Google annullato.`;
    default:
      return null;
  }
}

@Component({
  selector: "app-login-page.ts",
  imports: [
    MatButton,
    MatDivider,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatIcon,
    MatPrefix,
    MatIconButton,
    MatSuffix,
    RouterLink,
    ErrorPanel
],
  template: `
    <div class="w-full h-screen overflow-auto flex items-center ">
      <div class="max-w-[500px] mx-auto bg-white p-8 elevated rounded-xl space-y-4">
        <div>
          <h2 i18n="@@login.title" class="text-2xl">Accedi al tuo account</h2>
          <p i18n="@@login.description" class="text-sm text-gray-500">Accedi al tuo account per continuare lo shopping</p>
        </div>
        <div>
          <mat-divider />
        </div>

        @if (oauthError) {
          <div appErrorPanel role="alert" data-testid="oauth-error">
            {{ oauthError }}
          </div>
        }

        @if (error()) {
          <div appErrorPanel role="alert">
            {{ error()?.message }}
          </div>
        }

        <form [formGroup]="signInForm" (ngSubmit)="logInWithCredentials()">
          <mat-form-field>
            <mat-label i18n="@@login.email.label">Email</mat-label>
            <input
              matInput
              type="email"
              autocomplete="email"
              formControlName="email"
              i18n-placeholder="@@login.email.placeholder"
              placeholder="Inserisci la tua email"
            />
            <mat-icon matPrefix>email</mat-icon>
          </mat-form-field>

          <mat-form-field>
            <mat-label i18n="@@login.password.label">Password</mat-label>
            <input
              matInput
              autocomplete="current-password"
              [type]="passwordVisible() ? 'text' : 'password'"
              formControlName="password"
              i18n-placeholder="@@login.password.placeholder"
              placeholder="Inserisci la tua password"
            />
            <mat-icon matPrefix>lock</mat-icon>
            <button
              matSuffix
              matIconButton
              type="button"
              class="mr-2"
              [attr.aria-label]="passwordVisible() ? hidePasswordLabel : showPasswordLabel"
              [attr.aria-pressed]="passwordVisible()"
              (click)="passwordVisible.set(!passwordVisible())"
            >
              <mat-icon
                [fontIcon]="passwordVisible() ? 'visibility_off' : 'visibility_on'"
              ></mat-icon>
            </button>
          </mat-form-field>

          <button matButton="filled" type="submit" class="w-full" [disabled]="signInForm.invalid || isLoading()" i18n="@@login.submit">Accedi</button>
        </form>

        <div class="w-full flex flex-col justify-center items-center">
          <span class="text-sm text-gray-500 mb-4" i18n="@@login.or">oppure</span>
          <button mat-stroked-button (click)="loginWithGoogle()" class="w-full">
            <div class="flex items-center justify-center gap-2">
              <img src="assets/google_favicon_2025.svg" class="w-5 h-5" alt="Google" />
              <span i18n="@@login.google">Accedi con Google</span>
            </div>
          </button>
        </div>

        <p class="text-gray-500 text-sm text-center">
          <ng-container i18n="@@login.noAccount">Non hai ancora un account?</ng-container>
          <a i18n="@@login.signUp" routerLink="/sign-up" class="text-blue-700 underline">Registrati ora</a>
        </p>
      </div>
    </div>
  `,
  styles: ``,
})
export default class LoginPage {
  private fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly loadingService = inject(LoadingService);
  readonly passwordVisible = signal(false);

  readonly showPasswordLabel = $localize`:@@password.show:Mostra password`;
  readonly hidePasswordLabel = $localize`:@@password.hide:Nascondi password`;

  isLoading = this.loadingService.isLoading;
  error = this.authService.error;

  // Esito del login con Google: il backend reindirizza a /login?error=oauth_failed|oauth_canceled
  readonly oauthError = oauthErrorMessage(inject(ActivatedRoute).snapshot.queryParamMap.get("error"));

  signInForm = this.fb.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required]],
  });

  logInWithCredentials() {
    if (!this.signInForm.valid) {
      this.signInForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.signInForm.value;
    this.authService.signIn(email!, password!);
  }

  loginWithGoogle() {
    this.authService.startGoogleOAuth();
  }
}
