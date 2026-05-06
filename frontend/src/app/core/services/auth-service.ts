import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  saveToken(jwtToken: string) {
    localStorage.setItem("token", jwtToken);
  }
}
