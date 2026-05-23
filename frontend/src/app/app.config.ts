import { ApplicationConfig, provideBrowserGlobalErrorListeners } from "@angular/core";
import { provideRouter, withComponentInputBinding, withViewTransitions } from "@angular/router";

import { routes } from "./app.routes";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { apiInterceptor } from "./core/http/interceptors/api-interceptor";
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from "@angular/material/form-field";
import { apiHeadersInterceptor } from "./core/http/interceptors/api-headers-interceptor";
import { provideHotToastConfig } from "@ngxpert/hot-toast";
import { loadingInterceptor } from "./core/http/interceptors/loading-interceptor";
import { authInterceptor } from "./core/http/interceptors/auth-interceptor";
import { errorInterceptor } from "./core/http/interceptors/error-interceptor";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withInterceptors([loadingInterceptor, errorInterceptor, apiInterceptor, apiHeadersInterceptor])),
    provideHotToastConfig({
      stacking: "depth",
      visibleToasts: 3
    }),
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        appearance: "outline",
        subscrictSizing: "dynamic",
      },
    },
  ],
};
