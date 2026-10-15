import { Component, input, output } from '@angular/core';
import { PaginationMeta } from '../../core/models/api-types';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { LocalizedPaginatorIntl } from '../../core/i18n/localized-paginator-intl';


@Component({
  selector: 'app-api-paginator',
  imports: [MatPaginatorModule],
  // Testi del paginatore tradotti (fornito qui per non portare il paginatore nel bundle iniziale)
  providers: [{ provide: MatPaginatorIntl, useClass: LocalizedPaginatorIntl }],
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
  ariaLabel = input<string>($localize`:@@paginator.ariaLabel:Selezione pagina`);
  pageChangeEvent = output<{ page: number; limit: number; }>();

  onPaginatorPageEvent(event: PageEvent): void {
    this.pageChangeEvent.emit({
      page: event.pageIndex + 1,
      limit: event.pageSize
    });
  }
}
