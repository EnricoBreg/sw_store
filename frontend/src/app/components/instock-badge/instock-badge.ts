import { Component, computed, input } from "@angular/core";

@Component({
  selector: "app-instock-badge",
  imports: [],
  template: `
    <div class="w-fit text-sm font-medium px-2 py-1 text-center" [class]="stockBadgeColor()">
      {{ stockQuantity() > 0 ? 'In stock' : 'Out of stock' }}
    </div>
  `,
  styles: ``,
})
export default class InstockBadge {
  stockQuantity = input.required<number>();

  stockBadgeColor = computed(() => 
    this.stockQuantity() > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-800"
  );
}
