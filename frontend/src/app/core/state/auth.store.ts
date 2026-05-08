import { User } from '../models/user';
import { computed, effect, Injectable, signal } from '@angular/core';

export interface AuthState {
  user: User | null;
  jwtToken: string | null;
}

@Injectable({
  providedIn: "root"
})
export class AuthStore {
  #initialState: AuthState = !!localStorage.getItem('sw-store')
    ? JSON.parse(localStorage.getItem('sw-store')!)
    : { user: null, jwtToken: null };

  readonly #state = signal<AuthState>(this.#initialState);

  readonly user = computed(() => this.#state().user);
  readonly jwtToken = computed(() => this.#state().jwtToken);
  readonly isAuthenticated = computed(() => !!this.#state().user);

  constructor() {
    // sincronizzazione dello stato con il localStorage ogni qualvolta lo stato cambi
    effect(() => {
      localStorage.setItem('sw-store', JSON.stringify(this.#state()));
    });
  }

  setAuth(user: User, token: string) {
    this.#state.update((s) => ({ ...s, user, jwtToken: token }));
  }

  clearAuth() {
    this.#state.update((s) => ({ ...s, user: null, jwtToken: null }));
  }
}
