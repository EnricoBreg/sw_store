import { Component, signal } from "@angular/core";
import { MatExpansionModule } from "@angular/material/expansion";

@Component({
  selector: "app-expandable-content",
  imports: [MatExpansionModule],
  template: `
    <mat-expansion-panel (opened)="panelOpenState.set(true)" (closed)="panelOpenState.set(false)">
      <mat-expansion-panel-header>
        <mat-panel-title>
          <ng-content select="[title]"></ng-content>
        </mat-panel-title>
      </mat-expansion-panel-header>
      <ng-content select="[content]"></ng-content>
    </mat-expansion-panel>
  `,
  styles: ``,
})
export default class ExpandableContent {
  readonly panelOpenState = signal(false);
}
