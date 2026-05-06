import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: "",
    pathMatch: 'full',
    redirectTo: "products"
  },
  {
    path: "login",
    loadComponent: () => import("./pages/login-page.ts/login-page")
  },
  {
    path: "oauth/callback",
    loadComponent: () => import("./pages/auth-callback/auth-callback")
  },
  {
    path: "products",
    loadComponent: () => import("./pages/products-grid/products-grid")
  },
];
