import { Component, input } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import ViewPanel from '../../core/directives/view-panel/view-panel';

@Component({
  selector: 'app-spinner',
  imports: [MatProgressSpinner, ViewPanel],
  host: {
    class: 'absolute inset-0 z-50 flex items-center justify-center',
  },
  template: `
    <div
      class="absolute inset-0 bg-transparent"
    ></div>

    <div appViewPanel class="relative z-10 flex flex-col items-center gap-6">
      <mat-spinner strokeWidth="5" diameter="60"></mat-spinner>

      <span class="text-gray-700 text-xl font-medium tracking-wide">
        {{ label() }}
      </span>
    </div>
  `,
})
export default class Spinner {
  label = input<string>('Caricamento...');
}
