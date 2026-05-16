import { Routes } from "@angular/router";
import { adminGuard } from "./core/guards/admin-guard";
import { notLoggedInGuard } from "./core/guards/not-logged-in-guard";
import { loggedInGuard } from "./core/guards/logged-in-guard";

export const routes: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: "products",
  },
  {
    path: "login",
    loadComponent: () => import("./pages/login-page.ts/login-page"),
    canActivate: [notLoggedInGuard],
  },
  {
    path: "sign-up",
    loadComponent: () => import("./pages/signup-page/signup-page"),
    canActivate: [notLoggedInGuard],
  },
  {
    path: "oauth/callback",
    loadComponent: () => import("./pages/auth-callback/auth-callback"),
  },

  // Rotte pubbliche per utenti semplici non autenticati e autenticati
  {
    path: "",
    children: [
      // { path: "", loadComponent: () => import() }
      { path: "products", loadComponent: () => import("./pages/products-grid/products-grid") },
      {
        path: "products/:productId",
        loadComponent: () => import("./pages/product-detail/product-detail"),
      },

      // Rotte protette per soli utenti loggati
      {
        path: "cart",
        loadComponent: () => import("./pages/cart-page/cart-page"),
        canActivate: [loggedInGuard],
      },
    ],
  },

  // Rotte per soli utenti amministratori
  {
    path: "admin",
    loadComponent: () => import("./layout/admin-layout/admin-layout"),
    canActivate: [adminGuard],
    children: [
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
      {
        path: "dashboard",
        loadComponent: () => import("./pages/admin/dashboard-page/dashboard-page"),
      },
      {
        path: "users",
        loadComponent: () => import("./pages/admin/users/users-page/users-page"),
      },
      {
        path: "products",
        loadComponent: () => import("./pages/admin/products/products-page/products-page"),
      },
      { 
        path: "products/new", 
        loadComponent: () => import("./pages/admin/products/new-product-page/new-product-page"),
      },
      {
        path: "products/:productId/edit",
        loadComponent: () => import("./pages/admin/products/product-detail-page/product-detail-page"),
      },
      {
        path: "orders",
        loadComponent: () => import("./pages/admin/orders/orders-page/orders-page"),
      },
    ],
  },
  {
    path: "**",
    redirectTo: "",
  },
];
