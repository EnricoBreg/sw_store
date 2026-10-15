import { HttpErrorResponse } from "@angular/common/http";

/**
 * Forma uniforme degli errori HTTP rilanciati dall'errorInterceptor verso i service.
 * Ricalca la risposta di errore standard del backend ({ success, message, errors })
 * con in più lo status HTTP, utile alle pagine che vogliono gestire casi specifici (es. 404).
 */
export interface ApiError {
  success: false;
  status: number;
  message: string;
  errors: string[];
}

const nonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter(nonEmptyString) : [];

/**
 * Converte una HttpErrorResponse in ApiError. Gestisce sia il formato standard
 * del backend ({ success, message, errors }) sia quello dei 401/403 ({ error, message }).
 */
export function toApiError(error: HttpErrorResponse, fallbackMessage: string): ApiError {
  const body = error.error && typeof error.error === "object" ? error.error : {};

  let message = fallbackMessage;
  if (nonEmptyString(body.message)) {
    message = body.message;
  } else if (nonEmptyString(body.error)) {
    message = body.error;
  }

  return {
    success: false,
    status: error.status,
    message,
    errors: toStringArray(body.errors),
  };
}

/**
 * Estrae messaggio ed elenco di errori da un errore qualsiasi ricevuto in un callback
 * `error` di una chiamata HTTP, con un messaggio di fallback se non c'è nulla di utile.
 */
export function getApiError(err: unknown, fallbackMessage: string): { message: string; errors: string[] } {
  if (err instanceof HttpErrorResponse) {
    const { message, errors } = toApiError(err, fallbackMessage);
    return { message, errors };
  }

  if (err && typeof err === "object") {
    const { message, error, errors } = err as { message?: unknown; error?: unknown; errors?: unknown };
    if (nonEmptyString(message)) {
      return { message, errors: toStringArray(errors) };
    }
    if (nonEmptyString(error)) {
      return { message: error, errors: toStringArray(errors) };
    }
    return { message: fallbackMessage, errors: toStringArray(errors) };
  }

  return { message: fallbackMessage, errors: [] };
}

/** Scorciatoia per ottenere solo il messaggio di errore. */
export function getApiErrorMessage(err: unknown, fallbackMessage: string): string {
  return getApiError(err, fallbackMessage).message;
}

/** Status HTTP di un errore, se disponibile. */
export function getApiErrorStatus(err: unknown): number | undefined {
  if (err && typeof err === "object" && typeof (err as { status?: unknown }).status === "number") {
    return (err as { status: number }).status;
  }
  return undefined;
}

/**
 * Testo da mostrare all'utente: i dettagli in `errors` (es. "disponibili: 3") se presenti,
 * altrimenti il messaggio generale.
 */
export function getApiErrorDetail(err: unknown, fallbackMessage: string): string {
  const { message, errors } = getApiError(err, fallbackMessage);
  return errors.length ? errors.join(" ") : message;
}
