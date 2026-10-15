import { TestBed } from "@angular/core/testing";
import { LOCALE_ID } from "@angular/core";
import { RelativeTimePipe } from "./relative-time-pipe";

function pipeFor(locale: string) {
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: locale }] });
  return TestBed.runInInjectionContext(() => new RelativeTimePipe());
}

describe("RelativeTimePipe", () => {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  it("usa la lingua di LOCALE_ID (italiano)", () => {
    expect(pipeFor("it").transform(threeDaysAgo)).toBe("3 giorni fa");
  });

  it("usa la lingua di LOCALE_ID (inglese)", () => {
    expect(pipeFor("en").transform(threeDaysAgo)).toBe("3 days ago");
  });

  it("restituisce una stringa vuota senza data", () => {
    expect(pipeFor("it").transform("")).toBe("");
  });
});
