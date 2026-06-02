import { Component, inject, input } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { HeaderActions } from "../header-actions/header-actions";
import { RouterLink } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoadingService } from '../../core/http/services/loading.service';
import { MatIcon } from "@angular/material/icon";
import { MatIconButton } from '@angular/material/button';
import { LayoutService } from '../../core/services/layout.service';


@Component({
  selector: 'app-header',
  imports: [MatToolbar, HeaderActions, RouterLink, MatProgressBarModule, MatIcon, MatIconButton],
  template: ` 
    <div class="sticky top-0 -mb-3 z-10">
      <mat-toolbar class="w-full elevated">
        <div class="max-w-[1500px] mx-auto w-full flex items-center justify-between">
          <div class="flex items-center">
            <button matIconButton (click)="layoutService.toggleSidenav()">
              <mat-icon>menu</mat-icon>
            </button>
            <a class="ml-2" routerLink="/">
              <img src="assets/ebeefy_logo.png" alt="EBeefy Logo" class="h-12"/>
            </a>
          </div>
          <app-header-actions />
        </div>
      </mat-toolbar>

      <!-- Container progress bar -->
      @if (loadingService.isLoading()) {
        <div class="absolute bottom-0 w-full z-10">
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        </div>
      }
    </div>
  `,
  styles: ``,
})
export class Header {
  showIcon = input(true);
  title = input<string>("SW Store");

  readonly loadingService = inject(LoadingService);
  readonly layoutService = inject(LayoutService);
}
