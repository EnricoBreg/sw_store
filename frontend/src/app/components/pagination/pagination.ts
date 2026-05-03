import { Component, input } from '@angular/core';
import { MatPaginatorModule } from '@angular/material/paginator';

@Component({
  selector: 'app-pagination',
  imports: [MatPaginatorModule],
  template: `
    <mat-paginator
      [length]="count"
      [pageSize]="10"
      [pageSizeOptions]="[5, 10, 30]"
      aria-label="Seleziona pagina"
    >
    </mat-paginator>
  `,
  styles: ``,
})
export default class Pagination {
  count = input.required<number>();
  pageSize = input<number>(10);
}
