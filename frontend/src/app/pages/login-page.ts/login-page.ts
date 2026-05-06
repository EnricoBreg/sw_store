import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';

@Component({
  selector: 'app-login-page.ts',
  imports: [MatButton, MatDivider],
  template: `
    <div>
      <h2 class="text-2xl">Accedi al tuo account</h2>
      
      <mat-divider />
      <button matButton (click)="loginWithGoogle()">Login con Google</button>
    </div>
  `,
  styles: ``,
})
export default class LoginPage {
  loginWithGoogle() {
    const url = "http://localhost:3000/api/v1/auth/google_oauth2";
    const form = document.createElement("form");
    form.method = "POST";
    form.action = url;

    document.body.appendChild(form);
    form.submit();
  }
}
