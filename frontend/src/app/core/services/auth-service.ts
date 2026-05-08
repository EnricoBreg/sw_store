import { inject, Injectable, signal } from '@angular/core';
import { AuthApiService } from '../http/auth-api.service';
import { Router } from '@angular/router';
import { AuthStore } from '../state/auth.store';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private api = inject(AuthApiService);
  private store = inject(AuthStore);
  private router = inject(Router);

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
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        console.error("Login failed: ", err);
        const msg = `${err?.error.error}` || 'Credenziali errate, riprova di nuovo.';
        this.#error.set(msg);
      },
    });
  }

  signOut() {
    this.api.logout().subscribe({
      next: (response) => {
        console.log(response.message);
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

  getCurrentUserInfo(jwtToken: string) {
    const user = this.api.getCurrentUserInfo(jwtToken);
  }

  saveToken(jwtToken: string) {
    localStorage.setItem('token-sw-store', jwtToken);
  }
}
