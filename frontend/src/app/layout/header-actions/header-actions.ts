import { Component, inject } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from "@angular/material/icon";
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-header-actions',
  imports: [MatIconButton, MatIcon, MatButton, RouterLink],
  template: `
    <div class="flex items-center gap-2">
      <button matIconButton>
        <mat-icon>shopping_cart</mat-icon>
      </button>

      <a matButton routerLink="/login">Sign In</a>
      <button matButton="filled" (click)="signUpClicked()">Sign Up</button>
    </div>
  `,
  styles: ``,
})
export class HeaderActions {
  signUpClicked() {
    console.log("Sign up clicked");
  }
}
