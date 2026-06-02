import { inject, Injectable, signal } from '@angular/core';
import { AuthApiService } from '../http/auth-api.service';
import { Router } from '@angular/router';
import { AuthStore } from '../state/auth.store';
import { CartService } from './cart.service';
import { Toaster } from './toaster';
import { ApiResponse } from '../models/api-types';
import { tap } from 'rxjs';
import { User } from '../models/user';

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

  #error = signal<{message: string, errors: string[]} | undefined>(undefined);

  readonly authenticated = this.store.isAuthenticated;
  readonly user = this.store.user;
  readonly jwtToken = this.store.jwtToken;
  readonly error = this.#error.asReadonly();

  signIn(email: string, password: string) {

    this.api.login(email, password).subscribe({
      next: (response) => {
        const authHeader = response.headers.get("Authorization");
        const token = authHeader ? authHeader.replace("Bearer ", "") : undefined;
        const user = response.body?.data;

        if (user && token) {
          this.#error.set(undefined);
          this.store.setAuth(user!, token!);
          // caricamento del carrello al login dell'utente
          this.cartService.loadCart();
          this.router.navigate(["/"]);
        }
      },
      error: (err: ApiResponse<null>) => {
        console.error("Login failed: ", err);
        this.#error.set({ message: err.message || "Login fallito. Riprova.", errors: err.errors || []});
      },
    });
  }

  oAuthSignIn(token: string) {
    this.api.getCurrentUserInfo(token).subscribe({
      next: (response) => {
        const user = response.data;

        if (user && token) {
          this.#error.set(undefined);
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
          this.#error.set(undefined);
          this.store.setAuth(user!, token!);
          // caricamento del carrello alla registrazione dell'utente
          this.cartService.loadCart();
          this.router.navigate(["/"]);
        }
      },
      error: (error: ApiResponse<null>) => {
        this.toaster.error("Registrazione non riuscita. Riprova.");
        this.#error.set({ message: error.message || "Registrazione fallita. Riprova.", errors: error.errors || [] });
      },
    });
  }

  me() {
    return this.api.getCurrentUserInfo().pipe(
      tap((response: ApiResponse<User>) => {
        const user = response.data;
        this.store.setAuth(user, this.jwtToken()!);
        this.cartService.loadCart();
      })
    );
  }

  signOut() {
    this.api.logout().subscribe({
      next: (response) => {
        this.store.clearAuth();
        this.cartService.clearCart();
        this.router.navigate(["/login"]);
      },
      error: (err: ApiResponse<null>) => {
        this.#error.set({ message: err.message || "Logout fallito. Riprova.", errors: err.errors || [] });
        this.router.navigate(["/login"]);
      },
    });
  }

  clearAuth() {
    this.store.clearAuth();
    this.cartService.clearCart();
    this.#error.set(undefined);
  }
}
