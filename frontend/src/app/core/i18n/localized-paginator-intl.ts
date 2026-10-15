import { Injectable } from "@angular/core";
import { MatPaginatorIntl } from "@angular/material/paginator";

/** Testi del mat-paginator tradotti con @angular/localize (di default Material li ha solo in inglese). */
@Injectable()
export class LocalizedPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = $localize`:@@paginator.itemsPerPage:Elementi per pagina:`;
  override nextPageLabel = $localize`:@@paginator.nextPage:Pagina successiva`;
  override previousPageLabel = $localize`:@@paginator.previousPage:Pagina precedente`;
  override firstPageLabel = $localize`:@@paginator.firstPage:Prima pagina`;
  override lastPageLabel = $localize`:@@paginator.lastPage:Ultima pagina`;

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return $localize`:@@paginator.rangeEmpty:0 di ${length}:total:`;
    }

    const startIndex = page * pageSize;
    // Se la pagina va oltre il totale, l'indice finale non deve superarlo
    const endIndex = Math.min(startIndex + pageSize, length);

    return $localize`:@@paginator.range:${startIndex + 1}:start: – ${endIndex}:end: di ${length}:total:`;
  };
}
