import { buildLocaleUrl, normalizeLocale } from "./locales";

describe("buildLocaleUrl", () => {
  it("sostituisce la lingua nel base href mantenendo percorso e query string", () => {
    expect(buildLocaleUrl("/it/", "it", "en", "/products?q=x")).toBe("/en/products?q=x");
    expect(buildLocaleUrl("/en/", "en", "it", "/products/12")).toBe("/it/products/12");
  });

  it("mantiene il frammento e i parametri multipli", () => {
    expect(buildLocaleUrl("/it/", "it", "en", "/my-orders?page=2&limit=10#top")).toBe(
      "/en/my-orders?page=2&limit=10#top",
    );
  });

  it("gestisce la radice dell'app", () => {
    expect(buildLocaleUrl("/it/", "it", "en", "/")).toBe("/en/");
  });

  it("funziona anche se l'app è servita in una sottocartella", () => {
    expect(buildLocaleUrl("/shop/it/", "it", "en", "/cart")).toBe("/shop/en/cart");
  });

  it("accetta un base href senza slash finale", () => {
    expect(buildLocaleUrl("/it", "it", "en", "/cart")).toBe("/en/cart");
  });

  it("aggiunge la lingua se il base href non la contiene (es. ng serve)", () => {
    expect(buildLocaleUrl("/", "it", "en", "/products")).toBe("/en/products");
  });

  it("non confonde un segmento che contiene il codice lingua", () => {
    expect(buildLocaleUrl("/digit/", "it", "en", "/products")).toBe("/digit/en/products");
  });
});

describe("normalizeLocale", () => {
  it("riconduce i LOCALE_ID alle lingue supportate", () => {
    expect(normalizeLocale("it")).toBe("it");
    expect(normalizeLocale("en")).toBe("en");
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("de")).toBe("it");
  });
});
