import { Pipe, PipeTransform } from "@angular/core";
import { ORDER_STATUS_LABELS, OrderStatus } from "../models/order";

@Pipe({
  name: "orderStatusLabel",
})
export class OrderStatusLabelPipe implements PipeTransform {
  transform(value: any, ...args: unknown[]): string {
    if (!value) return "Sconosciuto";
    const status = value as OrderStatus;
    return ORDER_STATUS_LABELS[status] || value;
  }
}
