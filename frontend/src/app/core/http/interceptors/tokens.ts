import { HttpContextToken } from "@angular/common/http";

// Token per bypassare il global error handler in caso di errori di autenticazione, in modo da poter gestire l'errore direttamente nel componente di login
// Di default, l'errore globale deve essere gestito (false = non saltare).
export const BYPASS_GLOBAL_ERROR_HANDLING = new HttpContextToken<boolean>(() => false);