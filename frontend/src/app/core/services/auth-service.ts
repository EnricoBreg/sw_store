import { inject, Injectable, signal } from '@angular/core';
import { AuthApiService } from '../http/auth-api.service';
import { Router } from '@angular/router';
import { AuthStore } from '../state/auth.store';
import { CartService } from './cart.service';
import { Toaster } from './toaster';

export interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private api = inject(AuthApiService);
  private store = inject(AuthStore);
  private router = inject(Router);
  private cartService = inject(CartService);
  private toaster = inject(Toaster);

  #isLoading = signal<boolean>(false);
  #error = signal<string | undefined>(undefined);

  readonly authenticated = this.store.isAuthenticated;
  readonly user = this.store.user;
  readonly jwtToken = this.store.jwtToken;
  readonly isLoading = this.#isLoading.asReadonly();
  readonly error = this.#error.asReadonly();

  signIn(email: string, password: string) {
    this.#isLoading.set(true);

    this.api.login(email, password).subscribe({
      next: (response) => {
        const authHeader = response.headers.get("Authorization");
        const token = authHeader ? authHeader.replace("Bearer ", "") : undefined;
        const user = response.body?.data;

        if (user && token) {
          this.store.setAuth(user!, token!);
          // caricamento del carrello al login dell'utente
          this.cartService.loadCart();
          this.router.navigate(["/"]);
        }
      },
      error: (err) => {
        console.error("Login failed: ", err);
        const msg = `${err?.error.error}` || "Credenziali errate, riprova di nuovo.";
        this.#error.set(msg);
      },
    });
  }

  oAuthSignIn(token: string) {
    this.api.getCurrentUserInfo(token).subscribe({
      next: (response) => {
        const user = response.data;

        if (user && token) {
          this.store.setAuth(user, token);
          this.cartService.loadCart();
          this.router.navigate(["/"]);
        }
      },
      error: (error) => {
        this.router.navigate(["/login"]);
        this.toaster.error("Authenticazione OAuth fallita. Riprova.");
      },
    });
  }

  signUp(user: SignUpData) {
    const { firstName, lastName, email, password, passwordConfirmation } = user;
    const userRequest = {
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      passwordConfirmation
    };
    this.api.signUp(userRequest).subscribe({
      next: (response) => {
        const authHeader = response.headers.get("Authorization");
        const token = authHeader ? authHeader.replace("Bearer ", "") : undefined;
        const user = response.body?.data;

        if (user && token) {
          this.store.setAuth(user!, token!);
          // caricamento del carrello alla registrazione dell'utente
          this.cartService.loadCart();
          this.router.navigate(["/"]);
        }
      },
      error: (error) => {
        this.router.navigate(["/login"]);
        this.toaster.error("Registrazione non riuscita. Riprova.");
      },
    });
  }

  signOut() {
    this.api.logout().subscribe({
      next: (response) => {
        this.store.clearAuth();
        this.router.navigate(["/login"]);
      },
      error: (err) => {
        console.error("Login failed: ", err);
        const msg = `${err?.error.error}` || "Nessun sessione valida trovata.";
        this.#error.set(msg);
        this.router.navigate(["/login"]);
      },
    });
  }
}
