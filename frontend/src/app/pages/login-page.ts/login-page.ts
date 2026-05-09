import { Component, inject, signal } from "@angular/core";
import { NonNullableFormBuilder } from "@angular/forms";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatDivider } from "@angular/material/divider";
import { FormGroup, FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormField, MatPrefix, MatSuffix } from "@angular/material/select";
import { MatInput } from "@angular/material/input";
import { MatIcon } from "@angular/material/icon";
import { AuthService } from "../../core/services/auth-service";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-login-page.ts",
  imports: [
    MatButton,
    MatDivider,
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatIcon,
    MatPrefix,
    MatIconButton,
    MatSuffix,
    RouterLink,
  ],
  template: `
    <div class="w-full h-screen overflow-auto flex items-center ">
      <div class="max-w-[500px] mx-auto bg-white p-8 elevated rounded-xl space-y-4">
        <div>
          <h2 class="text-2xl">Accedi al tuo account</h2>
          <p class="text-sm text-gray-500">Accedi al tuo account per continuare lo shopping</p>
        </div>
        <div>
          <mat-divider />
        </div>

        <form [formGroup]="signInForm" (ngSubmit)="logInWithCredentials()">
          <mat-form-field>
            <input
              matInput
              type="email"
              formControlName="email"
              placeholder="Inserisci la tua email"
            />
            <mat-icon matPrefix>email</mat-icon>
          </mat-form-field>

          <mat-form-field>
            <input
              matInput
              [type]="passwordVisible() ? 'text' : 'password'"
              formControlName="password"
              placeholder="Inserisci la tua password"
            />
            <mat-icon matPrefix>lock</mat-icon>
            <button
              matSuffix
              matIconButton
              type="button"
              class="mr-2"
              (click)="passwordVisible.set(!passwordVisible())"
            >
              <mat-icon
                [fontIcon]="passwordVisible() ? 'visibility_off' : 'visibility_on'"
              ></mat-icon>
            </button>
          </mat-form-field>

          <button matButton="filled" type="submit" class="w-full">Accedi</button>
        </form>

        <div class="w-full flex flex-col justify-center items-center">
          <span class="text-sm text-gray-500 mb-4">oppure</span>
          <button mat-stroked-button (click)="loginWithGoogle()" class="w-full">
            <div class="flex items-center justify-center gap-2">
              <img src="assets/google_favicon_2025.svg" class="w-5 h-5" alt="Google" />
              <span>Accedi con Google</span>
            </div>
          </button>
        </div>

        <p class="text-gray-500 text-sm text-center">
          Non hai ancora un account?
          <a routerLink="/sign-up" class="text-blue-400 underline">Registrati ora</a>
        </p>
      </div>
    </div>
  `,
  styles: ``,
})
export default class LoginPage {
  private fb = inject(NonNullableFormBuilder);
  private authService = inject(AuthService);
  readonly passwordVisible = signal(false);

  signInForm = this.fb.group({
    email: "",
    password: "",
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
    const url = "http://localhost:3000/api/v1/auth/google_oauth2";
    const form = document.createElement("form");
    form.method = "POST";
    form.action = url;

    document.body.appendChild(form);
    form.submit();
  }
}
