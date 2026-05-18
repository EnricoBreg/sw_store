import { Component, inject, input } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";

@Component({
  selector: "app-back-button",
  imports: [MatButton, MatIcon],
  template: `
    <button
      matButton="text"
      (click)="onClick()"
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
  navigateTo = input<string[]>();

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  onClick() {
    if (this.navigateTo()) {
      this.router.navigate(this.navigateTo()!);
    } else {
      this.router.navigate([".."], { relativeTo: this.route });
    }
  }
}
