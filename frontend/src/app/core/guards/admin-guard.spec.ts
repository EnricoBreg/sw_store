import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { User } from "../models/user";
import { adminGuard } from "./admin-guard";

function runGuard(user: Partial<User> | null) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: AuthService,
        useValue: { authenticated: signal(!!user), user: signal(user) },
      },
    ],
  });

  return TestBed.runInInjectionContext(() =>
    adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  );
}

describe("adminGuard", () => {
  it("lascia passare un utente admin", () => {
    expect(runGuard({ id: 1, admin: true })).toBe(true);
  });

  it("manda a /forbidden un utente autenticato non admin", () => {
    const result = runGuard({ id: 2, admin: false });
    const router = TestBed.inject(Router);

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe("/forbidden");
  });

  it("manda a /login un ospite", () => {
    const result = runGuard(null);
    const router = TestBed.inject(Router);

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe("/login");
  });
});
