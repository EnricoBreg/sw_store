import { inject, Injectable } from '@angular/core';
import { AuthApiService } from '../http/auth-api.service';
import { AuthStore } from '../state/auth.store';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private api = inject(AuthApiService);
  private store = inject(AuthStore);
  private router = inject(Router);

  authenticated = this.store.authenticated;
  user = this.store.user;
  jwtToken = this.store.jwtToken;
  isLoading = this.store.isLoading;
  error = this.store.error;
  
  signIn(email: string, password: string) {
    this.store.setLoading();

    this.api.login(email, password).subscribe({
      next: (response) => {
        this.store.setAuthenticatedUser(response.data);
        this.router.navigate(["/"]);
      },
      error: (err) => {
        const msg = `${err?.error.error}` || "Credenziali errate, riprova di nuovo."
        this.store.setError(msg);
      }
    })
  }

  signOut() {
    
  }

  loadCurrentUser() {}

  saveToken(jwtToken: string) {
    localStorage.setItem("token-sw-store", jwtToken);
  }
}
