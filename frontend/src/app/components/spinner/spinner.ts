import { Component, input } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-spinner',
  imports: [MatProgressSpinner],
  host: {
    class: 'absolute inset-0 z-50 flex items-center justify-center',
  },
  template: `
    <div
      class="absolute inset-0 bg-transparent"
    ></div>

    <div class="relative z-10 flex flex-col items-center gap-6">
      <mat-spinner strokeWidth="5" diameter="60"></mat-spinner>

      <span class="text-white text-xl font-medium tracking-wide text-shadow-lg text-shadow-gray-900">
        {{ label() }}
      </span>
    </div>
  `,
})
export default class Spinner {
  label = input<string>('Caricamento...');
}
