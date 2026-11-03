import languages from "../public/locales/languages.json";

// The supported locales live in public/locales/languages.json so adding a
// language is one line there plus its common.json; the parser config, the
// i18n init and the LanguageSwitcher all read the same list.
export type Language = { code: string; name: string };

export const LANGUAGES: Language[] = languages;
export const DEFAULT_LOCALE = "en-US";

// Normalizes any BCP-47 code (browser navigator language or stored value) to a supported locale:
// an exact match wins (so pt-BR and pt-PT can coexist), then the first locale with the same base language.
export function resolveLocale(lng: string): string {
  const lower = lng.toLowerCase();
  const exact = LANGUAGES.find((l) => l.code.toLowerCase() === lower);
  if (exact) {
    return exact.code;
  }

  const base = lower.split("-")[0];
  const sameBase = LANGUAGES.find((l) => l.code.toLowerCase().split("-")[0] === base);
  return sameBase?.code ?? lng;
}
