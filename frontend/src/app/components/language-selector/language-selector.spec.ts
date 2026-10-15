import { TestBed } from "@angular/core/testing";
import { LOCALE_ID } from "@angular/core";
import { PlatformLocation } from "@angular/common";
import { provideRouter, Router } from "@angular/router";
import LanguageSelector from "./language-selector";

describe("LanguageSelector", () => {
  const assign = vi.fn();

  function create(locale: string, baseHref: string, routerUrl: string) {
    TestBed.configureTestingModule({
      imports: [LanguageSelector],
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: locale },
      ],
    });
    vi.spyOn(TestBed.inject(PlatformLocation), "getBaseHrefFromDOM").mockReturnValue(baseHref);
    vi.spyOn(TestBed.inject(Router), "url", "get").mockReturnValue(routerUrl);

    const fixture = TestBed.createComponent(LanguageSelector);
    vi.spyOn(fixture.componentInstance, "navigateTo").mockImplementation(assign);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => assign.mockClear());

  it("mostra la lingua corrente", () => {
    const fixture = create("it", "/it/", "/products");
    expect(fixture.componentInstance.currentLocale).toBe("it");
    expect(fixture.nativeElement.textContent).toContain("it");
  });

  it("porta alla stessa pagina nella build dell'altra lingua", () => {
    const fixture = create("it", "/it/", "/products?q=steel");
    fixture.componentInstance.switchTo("en");
    expect(assign).toHaveBeenCalledWith("/en/products?q=steel");
  });

  it("non ricarica la pagina se si sceglie la lingua corrente", () => {
    const fixture = create("en", "/en/", "/cart");
    fixture.componentInstance.switchTo("en");
    expect(assign).not.toHaveBeenCalled();
  });
});
