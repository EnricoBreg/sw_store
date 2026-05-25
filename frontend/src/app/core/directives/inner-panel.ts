import { Directive } from "@angular/core";

@Directive({
  selector: "[appInnerPanel]",
  host: {
    class: "rounded-2xl border border-gray-200/70 shadow-xs p-6 mt-4 mb-8 overflow-x-auto"
  }
})
export class InnerPanel {
  constructor() {}
}
