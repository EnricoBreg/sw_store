import { Component, inject, signal } from "@angular/core";
import { MatDivider } from "@angular/material/divider";
import { MatFormField, MatPrefix, MatSuffix } from "@angular/material/select";
import { MatIcon } from "@angular/material/icon";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { AuthService, SignUpData } from "../../core/services/auth-service";
import { MatInput } from "@angular/material/input";
import { MatButton, MatIconButton } from "@angular/material/button";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-signup-page",
  imports: [
    MatButton,
    MatDivider,
    MatFormField,
    MatIcon,
    MatInput,
    MatIconButton,
    MatPrefix,
    MatSuffix,
    ReactiveFormsModule,
    RouterLink,
  ],
  template: ` <div class="w-full h-screen overflow-auto flex items-center">
    <div class="max-w-[500px] mx-auto bg-white p-8 elevated rounded-xl space-y-4">
      <div>
        <h2 class="text-2xl">Registrati</h2>
        <p class="text-sm text-gray-500">Registrati per iniziare ora lo shopping.</p>
      </div>
      <div>
        <mat-divider />
      </div>

      <form [formGroup]="signUpForm" (ngSubmit)="signUp()">
        <section formGroupName="user">
          <mat-form-field>
            <input
              matInput
              type="text"
              formControlName="firstName"
              placeholder="Inserisci il tuo nome"
            />
          </mat-form-field>
          <mat-form-field>
            <input
              matInput
              type="text"
              formControlName="lastName"
              placeholder="Inserisci il cognome"
            />
          </mat-form-field>
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
          <mat-form-field>
            <input
              matInput
              [type]="passwordVisible() ? 'text' : 'password'"
              formControlName="passwordConfirmation"
              placeholder="Ripeti la tua password"
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
        </section>

        <button matButton="filled" type="submit" class="w-full" [disabled]="!signUpForm.valid">
          Registrati
        </button>
      </form>

      <div class="w-full flex flex-col justify-center items-center">
        <span class="text-sm text-gray-500 mb-4">oppure</span>
        <button mat-stroked-button (click)="signUpWithGoogle()" class="w-full">
          <div class="flex items-center justify-center gap-2">
            <img src="assets/google_favicon_2025.svg" class="w-5 h-5" alt="Google" />
            <span>Registrati con Google</span>
          </div>
        </button>
      </div>

      <p class="text-gray-500 text-sm text-center">
        Hai già un account? <a class="text-blue-400 underline" routerLink="/login">Accedi ora.</a>
      </p>
    </div>
  </div>`,
  styles: ``,
})
export default class SignupPage {
  private readonly fb = inject(FormBuilder);

  private authService = inject(AuthService);
  readonly passwordVisible = signal(false);

  readonly signUpForm = this.fb.nonNullable.group({
    user: this.fb.nonNullable.group({
      firstName: ["", [Validators.required, Validators.minLength(2)]],
      lastName: ["", [Validators.required, Validators.minLength(2)]],
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(8)]],
      passwordConfirmation: ["", [Validators.required, Validators.minLength(8)]],
    }),
  });

  signUp() {
    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }

    this.authService.signUp(this.signUpForm.value.user as SignUpData);
  }

  signUpWithGoogle() {
    const url = "http://localhost:3000/api/v1/auth/google_oauth2";
    const form = document.createElement("form");
    form.method = "POST";
    form.action = url;

    document.body.appendChild(form);
    form.submit();
  }

  focusFirstInvalid() {
    const firstInvalid = document.querySelector(
      "form .ng-invalid[formControlName]",
    ) as HTMLElement | null;
    firstInvalid?.focus();
  }
}
