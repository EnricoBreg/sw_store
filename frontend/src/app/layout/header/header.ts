import { Component, inject, input } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { HeaderActions } from "../header-actions/header-actions";
import { RouterLink } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoadingService } from '../../core/http/services/loading.service';


@Component({
  selector: 'app-header',
  imports: [MatToolbar, HeaderActions, RouterLink, MatProgressBarModule],
  template: ` 
    <div class="sticky top-0 -mb-3 z-10">
      <mat-toolbar class="w-full elevated">
        <div class="max-w-[1200px] mx-auto w-full flex items-center justify-between">
          <a routerLink="/">{{ title() }}</a>
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

  loadingService = inject(LoadingService);
}
