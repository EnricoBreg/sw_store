import { Component, computed, effect, inject, input, output, signal } from "@angular/core";
import { MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { LoadingService } from "../../core/http/services/loading.service";

@Component({
  selector: "app-quantity-selector",
  imports: [MatIcon, MatIconButton],
  host: {
    class: "flex items-center justify-center"
  },
  template: `
    <button
      matIconButton
      [disabled]="selectedQuantity() === 1 || loadingService.isLoading()"
      (click)="updateQuantity(-1)"
    >
      <mat-icon>remove</mat-icon>
    </button>
    <span class="text-lg border-1 rounded-lg py-2 px-4 border-color-gray-500">{{
      selectedQuantity()
    }}</span>
    <button
      matIconButton
      [disabled]="selectedQuantity() === maxQuantity() || loadingService.isLoading()"
      (click)="updateQuantity(1)"
    >
      <mat-icon>add</mat-icon>
    </button>
  `,
  styles: ``,
})
export default class QuantitySelector {
  loadingService = inject(LoadingService);

  currentQuantity = input.required<number>();
  maxQuantity = input.required<number>();

  quantityChange = output<number>();

  selectedQuantity = signal<number>(1);

  constructor() {
    effect(() => {
      this.selectedQuantity.set(this.currentQuantity());
    });
  }

  updateQuantity(delta: number) {
    const current = this.selectedQuantity();
    const next = current + delta;

    if (next === 0 || next > this.maxQuantity()) {
      return;
    }

    this.selectedQuantity.set(next);

    this.quantityChange.emit(next);
  }
}
