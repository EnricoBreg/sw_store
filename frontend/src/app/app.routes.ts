import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin-guard';
import { loggedInGuard } from './core/guards/logged-in-guard';

export const routes: Routes = [
  {
    path: "",
    pathMatch: 'full',
    redirectTo: "products"
  },
  {
    path: "login",
    loadComponent: () => import("./pages/login-page.ts/login-page"),
    canActivate: [loggedInGuard]
  },
  {
    path: "sign-up",
    loadComponent: () => import("./pages/signup-page/signup-page"),
    canActivate: [loggedInGuard]
  },
  {
    path: "oauth/callback",
    loadComponent: () => import("./pages/auth-callback/auth-callback")
  },
  {
    path: "products",
    loadComponent: () => import("./pages/products-grid/products-grid")
  },
  { 
    path: "products/:productId",
    loadComponent: () => import("./pages/product-detail/product-detail")
  },
  {
    path: "cart",
    loadComponent: () => import("./pages/cart-page/cart-page"),
  },
  {
    path: "admin",
    loadComponent: () => import("./layout/admin-layout/admin-layout"),
    canActivate: [adminGuard],
    children: [
      { path: "", redirectTo: "dashboard", pathMatch: 'full' },
      { path: "dashboard", loadComponent: () => import("./pages/admin/dashboard-page/dashboard-page") }
    ]
  }
];
