import { Directive } from "@angular/core";

@Directive({
  selector: "[appErrorPanel]",
  host: {
    class: "p-6 bg-red-100 text-red-700 rounded"
  }
})
export class ErrorPanel {
  constructor() {}
}
