import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: "app-admin-layout",
  imports: [RouterOutlet],
  template: ` 
    <div>
      <p>admin-layout works!</p> 
      <router-outlet></router-outlet>
    </div>
  `,
  styles: ``,
})
export default class AdminLayout {}
