import { Component, computed, inject } from "@angular/core";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { MatMenuItem, MatMenuModule, MatMenuTrigger } from "@angular/material/menu";
import { MatDivider } from "@angular/material/divider";
import { MatBadgeModule } from "@angular/material/badge";
import { CartService } from "../../core/services/cart.service";
import { WishlistsService } from "../../core/services/wishlists.service";

@Component({
  selector: "app-header-actions",
  imports: [
    MatIconButton,
    MatIcon,
    MatButton,
    RouterLink,
    MatMenuModule,
    MatMenuItem,
    MatMenuTrigger,
    MatDivider,
    MatBadgeModule,
  ],
  template: `
    <div class="flex items-center gap-2">
      @if (authService.user(); as user) {
        <button
          matIconButton
          routerLink="/wishlist"
          [matBadge]="wishlistItemCount()"
          [matBadgeHidden]="!wishlistItemCount()"
        >
          <mat-icon>favorite</mat-icon>
        </button>

        <button
          matIconButton
          routerLink="/cart"
          [matBadge]="cartItemCount()"
          [matBadgeHidden]="!cartItemCount()"
        >
          <mat-icon>shopping_cart</mat-icon>
        </button>

        <p class="text-sm">Ciao, {{ user.first_name }}</p>
        <button matIconButton [matMenuTriggerFor]="userMenu">
          <mat-icon>person</mat-icon>
        </button>

        <mat-menu #userMenu="matMenu" xPosition="before">
          <div class="flex flex-col px-3 min-w-[200px]">
            <span class="text-sm font-medium">{{ user.first_name }} {{ user.last_name }}</span>
            <span class="text-xs text-gray-500">{{ user.email }}</span>
          </div>

          <mat-divider></mat-divider>
          @if (user.admin) {
            <button class="!min-h-[32px]" mat-menu-item routerLink="/admin">
              <mat-icon>admin_panel_settings</mat-icon>
              Area Admin
            </button>
          }

          <button class="!min-h-[32px]" mat-menu-item routerLink="/my-orders">
            <mat-icon>receipt_long</mat-icon>
            I miei ordini
          </button>

          <mat-divider></mat-divider>
          <button class="!min-h-[32px]" mat-menu-item (click)="authService.signOut()">
            <mat-icon>logout</mat-icon>
            Sign Out
          </button>
        </mat-menu>
      } @else {
        <a matButton routerLink="/login">Accedi</a>
        <a matButton="filled" routerLink="/sign-up">Registrati</a>
      }
    </div>
  `,
  styles: ``,
})
export class HeaderActions {
  readonly authService = inject(AuthService);
  readonly cartService = inject(CartService);
  readonly whishlistService = inject(WishlistsService);

  cartItemCount = this.cartService.cartItemCount;
  wishlistItemCount = this.whishlistService.wishlistItemCount;
}
