import { LocalizedPaginatorIntl } from "./localized-paginator-intl";

describe("LocalizedPaginatorIntl", () => {
  const intl = new LocalizedPaginatorIntl();

  it("ha le etichette nella lingua sorgente (italiano)", () => {
    expect(intl.itemsPerPageLabel).toBe("Elementi per pagina:");
    expect(intl.nextPageLabel).toBe("Pagina successiva");
    expect(intl.previousPageLabel).toBe("Pagina precedente");
    expect(intl.firstPageLabel).toBe("Prima pagina");
    expect(intl.lastPageLabel).toBe("Ultima pagina");
  });

  it("calcola l'intervallo degli elementi della pagina", () => {
    expect(intl.getRangeLabel(0, 10, 56)).toBe("1 – 10 di 56");
    expect(intl.getRangeLabel(2, 10, 56)).toBe("21 – 30 di 56");
  });

  it("non supera il totale sull'ultima pagina", () => {
    expect(intl.getRangeLabel(5, 10, 56)).toBe("51 – 56 di 56");
  });

  it("gestisce lista vuota e dimensione di pagina nulla", () => {
    expect(intl.getRangeLabel(0, 10, 0)).toBe("0 di 0");
    expect(intl.getRangeLabel(0, 0, 12)).toBe("0 di 12");
  });
});
