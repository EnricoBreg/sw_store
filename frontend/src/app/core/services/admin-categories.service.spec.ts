import { TestBed } from "@angular/core/testing";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { AdminCategoriesService } from "./admin-categories.service";
import { Toaster } from "./toaster";
import { AuthService } from "./auth.service";
import { errorInterceptor } from "../http/interceptors/error-interceptor";

describe("AdminCategoriesService", () => {
  let service: AdminCategoriesService;
  let httpTesting: HttpTestingController;
  const toaster = { success: vi.fn(), error: vi.fn(), info: vi.fn() };

  const expectReload = (categories: unknown[] = []) => {
    const req = httpTesting.expectOne((r) => r.url === "admin/categories" && r.method === "GET");
    expect(req.request.params.get("all")).toBe("true");
    req.flush({ success: true, data: categories });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: Toaster, useValue: toaster },
        { provide: AuthService, useValue: { clearAuth: vi.fn() } },
      ],
    });
    service = TestBed.inject(AdminCategoriesService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it("carica tutte le categorie con all=true e products_count", () => {
    service.loadCategories();
    expectReload([{ id: 1, name: "Casa", description: null, products_count: 3 }]);

    expect(service.categories()[0].products_count).toBe(3);
    expect(service.loaded()).toBe(true);
  });

  it("crea con POST e modifica con PATCH, poi ricarica la lista", () => {
    service.save({ name: "Giardino", description: null }).subscribe();
    const create = httpTesting.expectOne((r) => r.url === "admin/categories" && r.method === "POST");
    expect(create.request.body).toEqual({ category: { name: "Giardino", description: null } });
    create.flush({ success: true, message: "Creata", data: { id: 5, name: "Giardino", description: null } });
    expectReload();

    service.save({ name: "Giardinaggio", description: "Attrezzi" }, 5).subscribe();
    const update = httpTesting.expectOne("admin/categories/5");
    expect(update.request.method).toBe("PATCH");
    update.flush({ success: true, data: { id: 5, name: "Giardinaggio", description: "Attrezzi" } });
    expectReload();

    expect(toaster.success).toHaveBeenCalledTimes(2);
  });

  it("un 422 sul salvataggio arriva al chiamante (il dialog mostra l'errore)", () => {
    let received: unknown;
    service.save({ name: "Casa", description: null }).subscribe({ error: (err) => (received = err) });

    httpTesting.expectOne("admin/categories").flush(
      { success: false, message: "Errore", errors: ["Nome è già presente"] },
      { status: 422, statusText: "Unprocessable Entity" },
    );

    expect(received).toMatchObject({ status: 422, errors: ["Nome è già presente"] });
  });

  it("eliminazione con 409 (categoria con prodotti): messaggio del backend, nessun ricaricamento", () => {
    service.delete({ id: 1, name: "Casa", description: null });

    httpTesting.expectOne("admin/categories/1").flush(
      { success: false, message: "Impossibile eliminare", errors: ["La categoria contiene 3 prodotti"] },
      { status: 409, statusText: "Conflict" },
    );

    expect(toaster.error).toHaveBeenCalledWith("La categoria contiene 3 prodotti");
  });
});
