import { Component, signal } from "@angular/core";
import { MatExpansionModule } from "@angular/material/expansion";

@Component({
  selector: "app-accordion",
  imports: [MatExpansionModule],
  template: `
    <mat-accordion>
      <ng-content></ng-content>
    </mat-accordion>
  `,
  styles: ``,
})
export default class Accordion {}
