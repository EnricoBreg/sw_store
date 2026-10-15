import { ComponentFixture, TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import ProductForm, { buildProductFormData, PRODUCT_IMAGE_MAX_BYTES, validateProductImage } from "./product-form";
import { AdminProductsService } from "../../core/services/admin-products.service";
import { CategoriesService } from "../../core/services/categories.service";
import Product from "../../core/models/product";

const value = {
  name: "Lampada",
  description: "Lampada da tavolo",
  price: 20,
  discountPercentage: 10,
  stockQuantity: 3,
  active: true,
  category: 2,
};

describe("buildProductFormData / validateProductImage", () => {
  it("usa i campi product[...] e allega l'immagine", () => {
    const image = new File(["x"], "foto.png", { type: "image/png" });
    const fd = buildProductFormData(value, image, true);

    expect(fd.get("product[name]")).toBe("Lampada");
    expect(fd.get("product[price]")).toBe("20");
    expect(fd.get("product[category_id]")).toBe("2");
    expect(fd.get("product[active]")).toBe("true");
    expect(fd.get("product[image]")).toBe(image);
    // Con un nuovo file non serve rimuovere quella vecchia: viene sostituita
    expect(fd.has("product[remove_image]")).toBe(false);
  });

  it("senza nuovo file può chiedere la rimozione dell'immagine", () => {
    const fd = buildProductFormData(value, null, true);
    expect(fd.get("product[remove_image]")).toBe("true");
    expect(fd.has("product[image]")).toBe(false);
  });

  it("accetta solo JPEG, PNG e WebP fino a 5 MB", () => {
    expect(validateProductImage(new File(["x"], "a.jpg", { type: "image/jpeg" }))).toBeNull();
    expect(validateProductImage(new File(["x"], "a.gif", { type: "image/gif" }))).toContain("Formato non supportato");
    const big = new File([new Uint8Array(PRODUCT_IMAGE_MAX_BYTES + 1)], "big.png", { type: "image/png" });
    expect(validateProductImage(big)).toContain("5 MB");
  });
});

describe("ProductForm", () => {
  let fixture: ComponentFixture<ProductForm>;
  const productsService = {
    saving: signal(false),
    formError: signal<{ message: string; errors: string[] } | undefined>(undefined),
    resetForm: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
  };
  const categoriesService = {
    categories: signal([{ id: 2, name: "Casa", description: null }]),
    loadCategories: vi.fn(),
  };

  const el = () => fixture.nativeElement as HTMLElement;

  function selectFile(file: File) {
    const input = el().querySelector<HTMLInputElement>("[data-testid=product-image-input]")!;
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    input.dispatchEvent(new Event("change"));
    fixture.detectChanges();
  }

  beforeEach(() => {
    vi.clearAllMocks();
    productsService.formError.set(undefined);
    URL.createObjectURL = vi.fn(() => "blob:anteprima");
    URL.revokeObjectURL = vi.fn();

    TestBed.configureTestingModule({
      imports: [ProductForm],
      providers: [
        { provide: AdminProductsService, useValue: productsService },
        { provide: CategoriesService, useValue: categoriesService },
      ],
    });
    fixture = TestBed.createComponent(ProductForm);
  });

  it("in modifica mostra l'immagine attuale e permette di rimuoverla", () => {
    fixture.componentRef.setInput("product", {
      id: 9,
      ...value,
      price: 20,
      discount_percentage: 10,
      stock_quantity: 3,
      image_url: "http://x/foto.png",
      category: { id: 2, name: "Casa", description: null },
    } as unknown as Product);
    fixture.detectChanges();

    expect(el().querySelector<HTMLImageElement>("[data-testid=product-image-preview]")!.src).toBe("http://x/foto.png");

    el().querySelector<HTMLButtonElement>("[data-testid=product-image-remove]")!.click();
    fixture.detectChanges();
    expect(el().querySelector("[data-testid=product-image-none]")).not.toBeNull();

    fixture.componentInstance.onSubmit();
    const [id, fd] = productsService.updateProduct.mock.calls[0];
    expect(id).toBe(9);
    expect((fd as FormData).get("product[remove_image]")).toBe("true");
  });

  it("un file scelto viene mostrato in anteprima e inviato come product[image]", () => {
    fixture.detectChanges();
    const file = new File(["x"], "nuova.webp", { type: "image/webp" });
    selectFile(file);

    expect(el().querySelector<HTMLImageElement>("[data-testid=product-image-preview]")!.src).toBe("blob:anteprima");

    fixture.componentInstance.productForm.setValue({ product: value });
    fixture.componentInstance.onSubmit();
    const fd = productsService.createProduct.mock.calls[0][0] as FormData;
    expect(fd.get("product[image]")).toBe(file);
  });

  it("un file di tipo non ammesso viene rifiutato con un messaggio", () => {
    fixture.detectChanges();
    selectFile(new File(["x"], "anim.gif", { type: "image/gif" }));

    expect(el().querySelector("[data-testid=product-image-error]")?.textContent).toContain("Formato non supportato");
    expect(el().querySelector("[data-testid=product-image-preview]")).toBeNull();
  });

  it("mostra gli errori 422 del backend", () => {
    productsService.formError.set({ message: "Errore nella creazione", errors: ["Nome non può essere vuoto"] });
    fixture.detectChanges();

    const panel = el().querySelector("[data-testid=product-form-error]")!;
    expect(panel.getAttribute("role")).toBe("alert");
    expect(panel.textContent).toContain("Nome non può essere vuoto");
  });
});
