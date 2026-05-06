import { computed, Injectable, signal } from '@angular/core';
import { User } from '../models/user';

interface AuthState {
  authenticated: boolean;
  jwtToken?: string;
  user?: User;
  isLoading: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  private state = signal<AuthState>({
    authenticated: false,
    isLoading: false
  });

  readonly authenticated = computed(() => this.state().authenticated);
  readonly user = computed(() => this.state().user);
  readonly jwtToken = computed(() => this.state().jwtToken)
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);

  setAuthenticatedUser(user: User, jwtToken?: string) {
    this.state.update(s => ({ user, jwtToken, isLoading: false, authenticated: true }));
  }

  setLoading() {
    this.state.update(s => ({ ...s, isLoading: false, error: undefined }));
  }

  setError(error: string) {
    this.state.update(s => ({...s, authenticated: false, isLoading: false, error}))
  }

  logout() {
    this.state.update(s => ({ user: undefined, jwtToken: undefined, authenticated: false, isLoading: false }))
  }
}
