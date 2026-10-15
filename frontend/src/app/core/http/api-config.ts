import { InjectionToken } from "@angular/core";
import { environment } from "../../../environments/environment";

// URL base delle API: viene iniettato da interceptor e service, così nei test può essere sostituito
export const API_URL = new InjectionToken<string>("API_URL", {
  providedIn: "root",
  factory: () => environment.apiUrl,
});
