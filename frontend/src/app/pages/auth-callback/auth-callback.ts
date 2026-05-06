import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';

@Component({
  selector: 'app-auth-callback',
  imports: [],
  template: ` <p>Autenticazione in corso, attender...</p> `,
  styles: ``,
})
export default class AuthCallback {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params["token"];
      const error = params["error"];

      if (token) {
        this.authService.saveToken(token);

        this.router.navigate(["/"]);
      } else if (error) {
        console.log("Login OAuth fallito: ", error);
        this.router.navigate(["/login"])
      }
    });
  }
}
