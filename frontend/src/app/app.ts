import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <h1 class="text-3xl text-gray-900 font-semibold">Hello World</h1>
  `,
  styles: ''
})
export class App {
  protected readonly title = signal('frontend');
}
