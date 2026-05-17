import { Component, input } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-back-button",
  imports: [MatButton, RouterLink, MatIcon],
  template: `
    <button
      matButton="text"
      [routerLink]="navigateTo() ?? null"
      class="-ms-2 flex items-center gap-1"
    >
      <mat-icon>arrow_back</mat-icon>
      <ng-content />
    </button>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class BackButton {
  // label = input("");
  navigateTo = input<string>();
}
