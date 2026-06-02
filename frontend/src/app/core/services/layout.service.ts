import { Injectable, signal } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class LayoutService {
  #isSidenavOpen = signal<boolean>(false);

  sidenavOpened = this.#isSidenavOpen.asReadonly();

  toggleSidenav() {
    this.#isSidenavOpen.update((isOpen) => !isOpen);
  }

  openSidenav() {
    this.#isSidenavOpen.set(true);
  }
  
  closeSidenav() {
    this.#isSidenavOpen.set(false);
  }
}
