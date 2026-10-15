// Lingue dell'interfaccia: ognuna corrisponde a una build localizzata servita in /<code>/
export type AppLocale = "it" | "en";

export interface LocaleOption {
  code: AppLocale;
  label: string; // nome della lingua scritto nella lingua stessa
}

export const SUPPORTED_LOCALES: LocaleOption[] = [
  { code: "it", label: "Italiano" },
  { code: "en", label: "English" },
];

/** Riconduce un LOCALE_ID (es. "en-US", "it") a una delle lingue supportate (default: it). */
export const normalizeLocale = (locale: string): AppLocale =>
  locale.toLowerCase().startsWith("en") ? "en" : "it";

/**
 * Calcola l'URL della stessa pagina nella build di un'altra lingua.
 * Le build localizzate hanno base href /it/ e /en/: si sostituisce il segmento della lingua
 * nel base href e si riattacca l'URL corrente del router (percorso, query string e frammento).
 * Se il base href non contiene la lingua corrente (es. ng serve, base "/"), la lingua viene aggiunta.
 */
export function buildLocaleUrl(
  baseHref: string,
  currentLocale: AppLocale,
  targetLocale: AppLocale,
  routerUrl: string,
): string {
  const base = baseHref.endsWith("/") ? baseHref : `${baseHref}/`;
  const currentSegment = `/${currentLocale}/`;

  const targetBase = base.endsWith(currentSegment)
    ? `${base.slice(0, -currentSegment.length)}/${targetLocale}/`
    : `${base}${targetLocale}/`;

  return targetBase + routerUrl.replace(/^\/+/, "");
}
