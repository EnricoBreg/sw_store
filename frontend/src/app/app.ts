import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "./layout/header/header";
import Footer from './components/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer],
  template: `
    <main>
      <app-header class="z-10" />
      <div class="h-[calc(100vh-64px)] overflow-auto">
        <router-outlet></router-outlet>
      </div>
      <app-footer />
    </main>
  `,
  styles: ''
})
export class App {
  protected readonly title = signal('frontend');
}
