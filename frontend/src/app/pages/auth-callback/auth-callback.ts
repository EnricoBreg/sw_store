import { Component, inject, OnInit } from "@angular/core";
import { Location } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";

/** Legge il token dal fragment dell'URL di ritorno dell'OAuth (es. `#token=<jwt>`). */
export function tokenFromFragment(fragment: string | null | undefined): string | null {
  if (!fragment) return null;
  const token = new URLSearchParams(fragment.replace(/^#/, "")).get("token");
  return token?.trim() || null;
}

/**
 * Pagina di ritorno del login con Google: il backend reindirizza a /oauth/callback#token=<jwt>.
 * Il token sta nel fragment così non finisce nei log dei server né nell'header Referer.
 */
@Component({
  selector: "app-auth-callback",
  imports: [],
  template: ` <p i18n="@@authCallback.authenticating" role="status">Autenticazione in corso, attendere...</p> `,
  styles: ``,
})
export default class AuthCallback implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private authService = inject(AuthService);

  ngOnInit() {
    const token = tokenFromFragment(this.route.snapshot.fragment);

    // Il token viene tolto subito dalla barra degli indirizzi (e dalla cronologia)
    this.location.replaceState(this.router.url.split("#")[0]);

    if (token) {
      this.authService.oAuthSignIn(token);
    } else {
      this.router.navigate(["/login"], { queryParams: { error: "oauth_failed" }, replaceUrl: true });
    }
  }
}
