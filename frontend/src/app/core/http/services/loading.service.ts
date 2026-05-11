import { Injectable, signal } from "@angular/core";
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from "@angular/router";

@Injectable({
  providedIn: "root",
})
export class LoadingService {
  private activeRequests = 0;
  #isLoading = signal<boolean>(false);

  isLoading = this.#isLoading.asReadonly();

  constructor(private router: Router) {
    router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.show();
      }
      if (event instanceof NavigationEnd
          || event instanceof NavigationError
          || event instanceof NavigationCancel) {
            this.hide();
      }
    })
  }

  show() {
    this.activeRequests++;
    this.#isLoading.set(true);
  }

  hide() {
    this.activeRequests--;
    if (this.activeRequests <= 0) {
      this.activeRequests = 0;
      this.#isLoading.set(false);
    }
  }
}
