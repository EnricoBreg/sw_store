import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { provideRouter, Router } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import ProductsGrid, { SEARCH_DEBOUNCE_MS } from "./products-grid";
import { ProductsService } from "../../core/services/products.service";
import { CategoriesService } from "../../core/services/categories.service";
import { CartService } from "../../core/services/cart.service";
import { AuthService } from "../../core/services/auth.service";
import { WishlistsService } from "../../core/services/wishlists.service";
import Product from "../../core/models/product";
import Category from "../../core/models/category";
import { PaginationMeta } from "../../core/models/api-types";

const category: Category = { id: 2, name: "lampade", description: "Lampade da tavolo" };

const product: Product = {
  id: 1,
  name: "Lampada",
  description: "Lampada da tavolo",
  price: 20,
  discount_percentage: 0,
  stock_quantity: 5,
  image_url: "",
  active: true,
  category,
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("ProductsGrid", () => {
  const productsService = {
    products: signal<Product[]>([product]),
    paginationMeta: signal<PaginationMeta | undefined>({ count: 15, limit: 5, page: 3, pages: 3, previous: 2 }),
    error: signal<string | undefined>(undefined),
    loadProducts: vi.fn(),
  };
  const categoriesService = {
    selected: signal<Category | undefined>(undefined),
    categories: signal<Category[]>([category]),
    error: signal<string | undefined>(undefined),
    loadCategories: vi.fn(),
    setSelectedCategory: vi.fn(),
  };

  let harness: RouterTestingHarness;

  async function open(url: string) {
    harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl(url, ProductsGrid);
    harness.detectChanges();
    return component;
  }

  function lastLoadCall() {
    return productsService.loadProducts.mock.calls.at(-1);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    productsService.error.set(undefined);
    categoriesService.selected.set(undefined);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: "products", component: ProductsGrid }]),
        { provide: ProductsService, useValue: productsService },
        { provide: CategoriesService, useValue: categoriesService },
        { provide: CartService, useValue: { addToCart: vi.fn() } },
        { provide: AuthService, useValue: { authenticated: signal(false), user: signal(null) } },
        { provide: WishlistsService, useValue: { wishlist: signal(null) } },
      ],
    });
  });

  it("carica i prodotti usando il parametro q dell'URL, dalla prima pagina", async () => {
    await open("/products?q=lampada");

    expect(lastLoadCall()).toEqual([1, 5, { categoryId: undefined, searchTerm: "lampada" }]);
    const input = harness.routeNativeElement!.querySelector<HTMLInputElement>("[data-testid=products-search]")!;
    expect(input.value).toBe("lampada");
  });

  it("la ricerca scrive q nell'URL dopo il debounce e riparte da pagina 1", async () => {
    await open("/products");
    const router = TestBed.inject(Router);
    const input = harness.routeNativeElement!.querySelector<HTMLInputElement>("[data-testid=products-search]")!;

    input.value = "  sedia ";
    input.dispatchEvent(new Event("input"));

    // Prima della fine del debounce non parte nessuna nuova ricerca
    expect(router.url).toBe("/products");

    await wait(SEARCH_DEBOUNCE_MS + 50);
    await harness.fixture.whenStable();

    expect(router.url).toBe("/products?q=sedia");
    expect(lastLoadCall()).toEqual([1, 5, { categoryId: undefined, searchTerm: "sedia" }]);
  });

  it("svuotando la ricerca rimuove q dall'URL", async () => {
    await open("/products?q=sedia");
    const router = TestBed.inject(Router);
    const input = harness.routeNativeElement!.querySelector<HTMLInputElement>("[data-testid=products-search]")!;

    input.value = "";
    input.dispatchEvent(new Event("input"));
    await wait(SEARCH_DEBOUNCE_MS + 50);
    await harness.fixture.whenStable();

    expect(router.url).toBe("/products");
    expect(lastLoadCall()).toEqual([1, 5, { categoryId: undefined, searchTerm: undefined }]);
  });

  it("il cambio di categoria riparte da pagina 1 mantenendo la ricerca", async () => {
    const component = await open("/products?q=lampada");

    categoriesService.selected.set(category);
    component.onCategorySelection({ id: category.id, name: category.name });

    expect(lastLoadCall()).toEqual([1, 5, { categoryId: 2, searchTerm: "lampada" }]);
  });

  it("il cambio di pagina usa pagina e limite scelti con i filtri correnti", async () => {
    const component = await open("/products?q=lampada");
    categoriesService.selected.set(category);

    component.onPageChangeEvent({ page: 2, limit: 10 });

    expect(lastLoadCall()).toEqual([2, 10, { categoryId: 2, searchTerm: "lampada" }]);
  });

  it("mostra il pannello di errore solo quando c'è un errore", async () => {
    await open("/products");
    expect(harness.routeNativeElement!.querySelector("[role=alert]")).toBeNull();

    productsService.error.set("Errore nel caricamento dei prodotti.");
    harness.detectChanges();

    const alert = harness.routeNativeElement!.querySelector("[role=alert]");
    expect(alert?.textContent).toContain("Errore nel caricamento dei prodotti.");
  });
});
