import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "relativeTime",
})
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | Date | number, ...args: unknown[]): string {
    if (!value) {
      return "";
    }

    const date = new Date(value);
    const now = new Date();

    const elapsed = date.getTime() - now.getTime();
    const absElapsed = Math.abs(elapsed);

    const units: { unit: Intl.RelativeTimeFormatUnit, ms: number }[] = [
      { unit: "year", ms: 1000 * 60 * 60 * 24 * 365 },
      { unit: "month", ms: 1000 * 60 * 60 * 24 * 30 },
      { unit: "week", ms: 1000 * 60 * 60 * 24 * 7 },
      { unit: "day", ms: 1000 * 60 * 60 * 24 },
      { unit: "hour", ms: 1000 * 60 * 60 },
      { unit: "minute", ms: 1000 * 60 },
      { unit: "second", ms: 1000 },
    ];

    const rtf = new Intl.RelativeTimeFormat("it", { numeric: "auto" });

    for (const { unit, ms } of units) {
      if (absElapsed >= ms || unit === "second") {
        const count = Math.round(elapsed / ms);
        return rtf.format(count, unit);
      }
    }
    
    return "";
  }
}
