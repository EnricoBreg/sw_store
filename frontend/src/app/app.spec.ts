import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { App } from "./app";

describe("App", () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it("should create the app", () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it("should render header, router outlet and footer", async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector("app-header")).not.toBeNull();
    expect(compiled.querySelector("router-outlet")).not.toBeNull();
    expect(compiled.querySelector("app-footer")).not.toBeNull();
  });
});
