import { Component, inject, input } from "@angular/core";
import { MatListItem, MatListItemTitle, MatNavList } from "@angular/material/list";
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from "@angular/material/sidenav";
import { RouterOutlet, RouterLink, RouterLinkActive } from "@angular/router";
import ViewPanel from "../../core/directives/view-panel/view-panel";
import { MatIcon } from "@angular/material/icon";
import { LayoutService } from "../../core/services/layout.service";

@Component({
  selector: "app-admin-layout",
  imports: [
    RouterOutlet,
    MatSidenavContainer,
    MatSidenav,
    MatNavList,
    MatListItem,
    MatSidenavContent,
    ViewPanel,
    MatIcon,
    MatListItemTitle,
    RouterLink,
    RouterLinkActive,
  ],
  template: `
    <mat-sidenav-container class="mt-2 full-height-layout" hasBackdrop="true">
      <mat-sidenav #sidenav mode="over" [opened]="sidenavOpened()">
        <div class="p-6">
          <h3 i18n="@@menuOperazioni" class="text-lg font-semibold text-gray-900">Menu operazioni</h3>

          <mat-nav-list>
            <a mat-list-item class="my-2" routerLink="dashboard" routerLinkActive #dashboardLink="routerLinkActive" [activated]="dashboardLink.isActive">
              <span matListItemTitle class="font-medium flex items-center gap-2">
                <mat-icon>dashboard</mat-icon>
                <ng-container i18n>Dashboard</ng-container>
              </span>
            </a>

            <a mat-list-item class="my-2" routerLink="users" routerLinkActive #usersLink="routerLinkActive" [activated]="usersLink.isActive">
              <span matListItemTitle class="font-medium flex items-center gap-2">
                <mat-icon>groups</mat-icon>
                <ng-container i18n="@@utenti">Utenti</ng-container>
              </span>
            </a>

            <a mat-list-item class="my-2" routerLink="products" routerLinkActive #productsLink="routerLinkActive" [activated]="productsLink.isActive">
              <span matListItemTitle class="font-medium flex items-center gap-2">
                <mat-icon>list_alt</mat-icon>
                <ng-container i18n="@@prodotti">Prodotti</ng-container>
              </span>
            </a>

            <a mat-list-item class="my-2" routerLink="categories" routerLinkActive #categoriesLink="routerLinkActive" [activated]="categoriesLink.isActive">
              <span matListItemTitle class="font-medium flex items-center gap-2">
                <mat-icon>category</mat-icon>
                <ng-container i18n="@@categorie">Categorie</ng-container>
              </span>
            </a>

            <a mat-list-item class="my-2" routerLink="orders" routerLinkActive #ordersLink="routerLinkActive" [activated]="ordersLink.isActive">
              <span matListItemTitle class="font-medium flex items-center gap-2">
                <mat-icon>local_shipping</mat-icon>
                <ng-container i18n="@@ordini">Ordini</ng-container>
              </span>
            </a>
          </mat-nav-list>
        </div>
      </mat-sidenav>
      <mat-sidenav-content>
        <section class="py-6 px-4 relative">
          <div appViewPanel>
            <router-outlet></router-outlet>
          </div>
        </section>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: ``,
})
export default class AdminLayout {
  private readonly layoutService = inject(LayoutService);

  readonly sidenavOpened = this.layoutService.sidenavOpened;
}
