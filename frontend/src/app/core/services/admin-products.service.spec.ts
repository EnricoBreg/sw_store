import { TestBed } from "@angular/core/testing";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { provideRouter, Router } from "@angular/router";
import { AdminProductsService } from "./admin-products.service";
import { Toaster } from "./toaster";
import { AuthService } from "./auth.service";
import { errorInterceptor } from "../http/interceptors/error-interceptor";
import Product from "../models/product";

const rawProduct = { id: 9, name: "Lampada", description: "Lampada da tavolo", price: "20.0", discount_percentage: "0.0", stock_quantity: 3, active: true, image_url: "http://x/img.png", category: { id: 1, name: "Casa", description: null } };

describe("AdminProductsService", () => {
  let service: AdminProductsService;
  let httpTesting: HttpTestingController;
  let router: Router;
  const toaster = { success: vi.fn(), error: vi.fn(), info: vi.fn() };

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
    service = TestBed.inject(AdminProductsService);
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, "navigate").mockResolvedValue(true);
  });

  afterEach(() => httpTesting.verify());

  it("crea il prodotto in multipart e va al dettaglio", () => {
    const fd = new FormData();
    fd.append("product[name]", "Lampada");

    service.createProduct(fd);
    expect(service.saving()).toBe(true);

    const req = httpTesting.expectOne("admin/products");
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toBe(fd);
    req.flush({ success: true, message: "Creato", data: rawProduct }, { status: 201, statusText: "Created" });

    expect(service.saving()).toBe(false);
    expect(service.product()!.price).toBe(20);
    expect(router.navigate).toHaveBeenCalledWith(["/admin/products", 9]);
  });

  it("con 422 (es. immagine non valida) espone gli errori del backend nel form", () => {
    service.updateProduct(9, new FormData());

    const req = httpTesting.expectOne("admin/products/9");
    expect(req.request.method).toBe("PATCH");
    req.flush(
      { success: false, message: "Errore nell'aggiornamento", errors: ["Immagine deve essere JPEG, PNG o WebP"] },
      { status: 422, statusText: "Unprocessable Entity" },
    );

    expect(service.formError()).toEqual({
      message: "Errore nell'aggiornamento",
      errors: ["Immagine deve essere JPEG, PNG o WebP"],
    });
    expect(service.saving()).toBe(false);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it("eliminazione: con 409 mostra il motivo e il prodotto resta", () => {
    service.deleteProduct({ id: 9 } as Product);

    const req = httpTesting.expectOne("admin/products/9");
    expect(req.request.method).toBe("DELETE");
    req.flush(
      { success: false, message: "Impossibile eliminare", errors: ["Il prodotto è presente in 2 ordini"] },
      { status: 409, statusText: "Conflict" },
    );

    expect(service.error()).toBe("Il prodotto è presente in 2 ordini");
    expect(toaster.error).toHaveBeenCalledWith("Il prodotto è presente in 2 ordini");
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it("eliminazione riuscita: torna alla lista", () => {
    service.deleteProduct({ id: 9 } as Product);
    httpTesting.expectOne("admin/products/9").flush({ success: true, message: "Eliminato" });

    expect(toaster.success).toHaveBeenCalledWith("Eliminato");
    expect(router.navigate).toHaveBeenCalledWith(["/admin/products"]);
  });
});
