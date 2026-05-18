import { Directive } from "@angular/core";

@Directive({
  selector: "[appBadge]",
  host: {
    class: "inline-flex items-center px-3 py-1 rounded-full text-sm ring-1 ring-inset font-medium",
  },
})
export class Badge {
  constructor() {}
}
