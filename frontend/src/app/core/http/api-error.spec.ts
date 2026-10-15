import { HttpErrorResponse } from "@angular/common/http";
import { getApiError, getApiErrorMessage, getApiErrorStatus, toApiError } from "./api-error";

const FALLBACK = "Errore di fallback";

describe("toApiError", () => {
  it("usa message ed errors del formato standard del backend", () => {
    const httpError = new HttpErrorResponse({
      status: 422,
      error: { success: false, message: "Dati non validi", errors: ["Nome obbligatorio", "Prezzo non valido"] },
    });

    expect(toApiError(httpError, FALLBACK)).toEqual({
      success: false,
      status: 422,
      message: "Dati non validi",
      errors: ["Nome obbligatorio", "Prezzo non valido"],
    });
  });

  it("gestisce il formato dei 401/403 ({ error, message })", () => {
    const httpError = new HttpErrorResponse({
      status: 401,
      error: { error: "Unauthorized", message: "Autenticazione richiesta" },
    });

    const apiError = toApiError(httpError, FALLBACK);
    expect(apiError.status).toBe(401);
    expect(apiError.message).toBe("Autenticazione richiesta");
    expect(apiError.errors).toEqual([]);
  });

  it("usa il campo error se manca message (es. risposta di Devise)", () => {
    const httpError = new HttpErrorResponse({
      status: 401,
      error: { error: "Email o password non validi." },
    });

    expect(toApiError(httpError, FALLBACK).message).toBe("Email o password non validi.");
  });

  it("usa il fallback se il corpo non è JSON o è vuoto", () => {
    const networkError = new HttpErrorResponse({ status: 0, error: new ProgressEvent("error") });
    const htmlError = new HttpErrorResponse({ status: 500, error: "<html>Internal Server Error</html>" });

    expect(toApiError(networkError, FALLBACK).message).toBe(FALLBACK);
    expect(toApiError(htmlError, FALLBACK)).toEqual({
      success: false,
      status: 500,
      message: FALLBACK,
      errors: [],
    });
  });
});

describe("getApiError", () => {
  it("restituisce messaggio ed errori di un ApiError rilanciato dall'interceptor", () => {
    const err = { success: false, status: 422, message: "Checkout non riuscito", errors: ["Carrello vuoto"] };

    expect(getApiError(err, FALLBACK)).toEqual({
      message: "Checkout non riuscito",
      errors: ["Carrello vuoto"],
    });
  });

  it("gestisce un oggetto con solo il campo error (formato 401/403)", () => {
    expect(getApiError({ error: "Forbidden" }, FALLBACK)).toEqual({ message: "Forbidden", errors: [] });
  });

  it("estrae i dati da una HttpErrorResponse non trasformata", () => {
    const httpError = new HttpErrorResponse({
      status: 403,
      error: { error: "Forbidden", message: "Accesso negato" },
    });

    expect(getApiError(httpError, FALLBACK)).toEqual({ message: "Accesso negato", errors: [] });
  });

  it("usa il fallback per messaggi vuoti, null, undefined o valori non oggetto", () => {
    expect(getApiError({ message: "  ", errors: [] }, FALLBACK).message).toBe(FALLBACK);
    expect(getApiError(null, FALLBACK)).toEqual({ message: FALLBACK, errors: [] });
    expect(getApiError(undefined, FALLBACK)).toEqual({ message: FALLBACK, errors: [] });
    expect(getApiError("boom", FALLBACK)).toEqual({ message: FALLBACK, errors: [] });
  });

  it("scarta gli elementi di errors che non sono stringhe", () => {
    const err = { message: "Errore", errors: ["valido", 42, null, ""] };
    expect(getApiError(err, FALLBACK).errors).toEqual(["valido"]);
  });
});

describe("getApiErrorMessage / getApiErrorStatus", () => {
  it("restituisce solo il messaggio", () => {
    expect(getApiErrorMessage({ message: "Non trovato" }, FALLBACK)).toBe("Non trovato");
    expect(getApiErrorMessage({}, FALLBACK)).toBe(FALLBACK);
  });

  it("restituisce lo status se presente", () => {
    expect(getApiErrorStatus({ status: 404, message: "x" })).toBe(404);
    expect(getApiErrorStatus({ message: "x" })).toBeUndefined();
    expect(getApiErrorStatus(null)).toBeUndefined();
  });
});
