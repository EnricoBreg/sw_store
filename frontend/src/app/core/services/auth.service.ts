import { inject, Injectable, signal } from '@angular/core';
import { AuthApiService } from '../http/auth-api.service';
import { Router } from '@angular/router';
import { AuthStore } from '../state/auth.store';
import { CartService } from './cart.service';
import { Toaster } from './toaster';
import { ApiResponse } from '../models/api-types';
import { tap } from 'rxjs';
import { User } from '../models/user';
import { WishlistsService } from './wishlists.service';
import { getApiError } from "../http/api-error";

export interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  dateOfBirth?: string | null; // formato ISO yyyy-MM-dd, facoltativo
}

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private api = inject(AuthApiService);
  private store = inject(AuthStore);
  private router = inject(Router);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistsService);
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
          this.wishlistService.loadWishlist();
          this.router.navigate(["/"]);
        }
      },
      error: (err) => {
        this.#error.set(getApiError(err, $localize`:@@authService.loginError:Login fallito. Riprova.`));
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
          this.wishlistService.loadWishlist();
          this.router.navigate(["/"]);
        }
      },
      error: (error) => {
        this.router.navigate(["/login"]);
        this.toaster.error("Authenticazione OAuth fallita. Riprova.");
      },
    });
  }

  /**
   * Avvia il login con Google: la rotta OAuth del backend accetta solo POST,
   * quindi viene inviato un form verso l'URL configurato.
   */
  startGoogleOAuth() {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = this.api.googleOAuthUrl();

    document.body.appendChild(form);
    form.submit();
  }

  signUp(user: SignUpData) {
    const { firstName, lastName, email, password, passwordConfirmation, dateOfBirth } = user;
    // Payload nel formato previsto da POST /auth/signup (vedi backend/API.md)
    const userRequest = {
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      password_confirmation: passwordConfirmation,
      ...(dateOfBirth ? { date_of_birth: dateOfBirth } : {}),
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
          this.wishlistService.loadWishlist();
          this.router.navigate(["/"]);
        }
      },
      error: (error) => {
        this.toaster.error("Registrazione non riuscita. Riprova.");
        this.#error.set(getApiError(error, $localize`:@@authService.signUpError:Registrazione fallita. Riprova.`));
      },
    });
  }

  me() {
    return this.api.getCurrentUserInfo().pipe(
      tap((response: ApiResponse<User>) => {
        const user = response.data;
        this.store.setAuth(user, this.jwtToken()!);
        this.cartService.loadCart();
        this.wishlistService.loadWishlist();
      })
    );
  }

  signOut() {
    this.api.logout().subscribe({
      next: (response) => {
        this.store.clearAuth();
        this.cartService.clearCart();
        this.wishlistService.clearWishlist();
        this.router.navigate(["/login"]);
      },
      error: (err) => {
        this.#error.set(getApiError(err, $localize`:@@authService.logoutError:Logout fallito. Riprova.`));
        this.router.navigate(["/login"]);
      },
    });
  }

  clearAuth() {
    this.store.clearAuth();
    this.cartService.clearCart();
    this.wishlistService.clearWishlist();
    this.#error.set(undefined);
  }
}
