import { Component } from "@angular/core";
import { MatListItem, MatListItemTitle, MatNavList } from "@angular/material/list";
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from "@angular/material/sidenav";
import { RouterOutlet, RouterLinkWithHref } from "@angular/router";
import ViewPanel from "../../core/directives/view-panel/view-panel";
import { MatIcon } from "@angular/material/icon";

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
    RouterLinkWithHref,
  ],
  template: `
    <mat-sidenav-container class="mt-2 full-height-layout">
      <mat-sidenav mode="side" opened="true">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900">Menu operazioni</h3>

          <mat-nav-list>
            <mat-list-item class="my-2" routerLink="dashboard">
              <span matListItemTitle class="font-medium flex items-center gap-2">
                <mat-icon>dashboard</mat-icon>
                Dashboard
              </span>
            </mat-list-item>

            <mat-list-item class="my-2" routerLink="users">
              <span matListItemTitle class="font-medium flex items-center gap-2">
                <mat-icon>groups</mat-icon>
                Utenti
              </span>
            </mat-list-item>

            <mat-list-item class="my-2" routerLink="products">
              <span matListItemTitle class="font-medium flex items-center gap-2">
                <mat-icon>list_alt</mat-icon>
                Prodotti
              </span>
            </mat-list-item>

            <mat-list-item class="my-2" routerLink="orders">
              <span matListItemTitle class="font-medium flex items-center gap-2">
                <mat-icon>local_shipping</mat-icon>
                Ordini
              </span>
            </mat-list-item>
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
export default class AdminLayout {}
