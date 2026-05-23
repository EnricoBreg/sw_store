import { Directive } from "@angular/core";

@Directive({
  selector: "[appErrorPanel]",
  host: {
    class: "p-4 bg-red-100 text-red-700 rounded"
  }
})
export class ErrorPanel {
  constructor() {}
}
