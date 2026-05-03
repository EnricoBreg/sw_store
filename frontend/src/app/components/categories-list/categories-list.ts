import { TitleCasePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { MatNavList, MatListItem, MatListItemTitle } from "@angular/material/list"

@Component({
  selector: 'app-categories-list',
  imports: [MatNavList, MatListItem, MatListItemTitle, TitleCasePipe],
  template: `
    <div>
      <mat-nav-list>
        @for (category of categories(); track category) {
          <mat-list-item class="my-2">
            <span matListItemTitle class="font-medium">
              {{ category | titlecase }}
            </span>
          </mat-list-item>
        }
      </mat-nav-list>
    </div>
  `,
  styles: ``,
})
export default class CategoriesList {
  categories = signal<string[]>([
    'all',
    'electronics',
    'accessories',
    'home',
    'footwear',
    'furniture',
    'lifestyle',
  ]);
}
