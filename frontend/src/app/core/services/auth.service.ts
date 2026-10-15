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
          this.startSession(user, token);
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
          this.startSession(user, token);
          this.router.navigate(["/"], { replaceUrl: true });
        }
      },
      error: () => {
        // Token non valido o scaduto: la pagina di login mostra il messaggio dedicato
        this.router.navigate(["/login"], { queryParams: { error: "oauth_failed" }, replaceUrl: true });
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
          this.startSession(user, token);
          this.router.navigate(["/"]);
        }
      },
      error: (error) => {
        this.toaster.error($localize`:@@toast.signUpFailed:Registrazione non riuscita. Riprova.`);
        this.#error.set(getApiError(error, $localize`:@@authService.signUpError:Registrazione fallita. Riprova.`));
      },
    });
  }

  /** Aggiorna i dati dell'utente corrente (usato dalla guard delle rotte riservate). */
  me() {
    return this.api.getCurrentUserInfo().pipe(
      tap((response: ApiResponse<User>) => {
        this.store.setAuth(response.data, this.jwtToken()!);
      }),
    );
  }

  /**
   * All'avvio dell'app: se c'è una sessione salvata, carrello e wishlist vengono letti dal backend.
   * Se il token non è più valido, la 401 viene gestita dall'errorInterceptor (logout e login).
   */
  restoreSession() {
    // Vecchie copie locali di carrello e wishlist: non sono più usate
    localStorage.removeItem("sw-store-cart");
    localStorage.removeItem("sw-store-wishlist");

    if (this.authenticated()) {
      this.loadUserData();
    }
  }

  private startSession(user: User, token: string) {
    this.#error.set(undefined);
    this.store.setAuth(user, token);
    this.loadUserData();
  }

  private loadUserData() {
    this.cartService.loadCart();
    this.wishlistService.loadWishlist();
  }

  signOut() {
    // La sessione locale viene chiusa in ogni caso: se il backend risponde con errore
    // (es. token già scaduto o revocato) il token non è comunque più utilizzabile.
    const endSession = () => {
      this.clearAuth();
      this.router.navigate(["/login"]);
    };

    this.api.logout().subscribe({ next: endSession, error: endSession });
  }

  clearAuth() {
    this.store.clearAuth();
    this.cartService.clearCart();
    this.wishlistService.clearWishlist();
    this.#error.set(undefined);
  }
}
