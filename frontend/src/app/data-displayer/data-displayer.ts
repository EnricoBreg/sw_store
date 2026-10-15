import { DatePipe } from "@angular/common";
import { Component, input } from "@angular/core";
import { RelativeTimePipe } from "../core/pipes/relative-time-pipe";

export type DateFormatType = "medium" | "default" | "custom";

@Component({
  selector: "app-isodate-displayer",
  imports: [DatePipe, RelativeTimePipe],
  template: `
    @if (relative()) {
      <span>{{ date() | relativeTime }}</span>
    } @else {
      <span>{{ date() | date: "short" }}</span>
    }
  `,
  styles: ``,
})
export default class ISODateDisplayer {
  relative = input<boolean>(false);
  date = input.required<string>();
}
