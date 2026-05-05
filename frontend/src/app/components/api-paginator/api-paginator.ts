import { Component, input, output } from '@angular/core';
import { PaginationMeta } from '../../core/models/api-types';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';


@Component({
  selector: 'app-api-paginator',
  imports: [MatPaginatorModule],
  template: `
    @if (meta(); as m) {
      <mat-paginator
        [length]="m.count || 0"
        [pageSize]="m.limit"
        [pageIndex]="(m.page || 1) - 1"
        [pageSizeOptions]="pageSizeOptions()"
        [aria-label]="ariaLabel()"
        (page)="onPaginatorPageEvent($event)"
      >
      </mat-paginator>
    }
  `,
  styles: ``,
})
export default class ApiPaginator {
  meta = input<PaginationMeta | null>();
  pageSizeOptions = input<number[]>([5, 10, 20, 30]);
  ariaLabel = input<string>("Selezione pagina");
  pageChangeEvent = output<{ page: number; limit: number; }>();

  onPaginatorPageEvent(event: PageEvent): void {
    this.pageChangeEvent.emit({
      page: event.pageIndex + 1,
      limit: event.pageSize
    });
  }
}
