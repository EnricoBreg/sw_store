import { Component } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-header-actions',
  imports: [MatIconButton, MatIcon, MatButton],
  template: `
    <div class="flex items-center gap-2">
      <button matIconButton>
        <mat-icon>shopping_cart</mat-icon>
      </button>

      <button matButton (click)="signInClicked()">Sign In</button>
      <button matButton="filled" (click)="signUpClicked()">Sign Up</button>
    </div>
  `,
  styles: ``,
})
export class HeaderActions {
  signInClicked() {
    console.log("Sign In cliccato");
  }

  signUpClicked() {
    console.log("Sign up clicked");
  }
}
