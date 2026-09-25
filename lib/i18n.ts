import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";

const LOCALE_STORAGE_KEY = "locale";
export { LOCALE_STORAGE_KEY };

// Backend loader for static export - uses dynamic import() which webpack bundles
const backendLoader = resourcesToBackend((locale: string, namespace: string) => {
  return import(`../public/locales/${locale}/${namespace}.json`);
});

// Normalizes any BCP-47 code (browser navigator language or stored value) to a supported locale.
function convertDetectedLanguage(lng: string): string {
  const base = lng.split("-")[0].toLowerCase();
  const mapping: Record<string, string> = { en: "en-US", de: "de-DE" };
  return mapping[base] ?? lng;
}

// Initialize i18n for React app
// `lng` is fixed to the fallback so the server render and the client's first
// (pre-hydration) render always agree; the detector is only consulted
// afterwards via `applyDetectedLanguage`, avoiding hydration text mismatches.
void i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(backendLoader)
  .init({
    debug: false,
    lng: "en-US",
    fallbackLng: "en-US",
    defaultNS: "common",
    ns: ["common"],
    supportedLngs: false, // Disable strict language validation
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: [], // persistence is handled explicitly by LanguageSwitcher; the lib defaults to caching to localStorage otherwise
      lookupLocalStorage: LOCALE_STORAGE_KEY,
      convertDetectedLanguage,
    },
  });

// Runs after mount (client-only) to switch to the user's stored language, or
// fall back to the browser's language, once hydration is complete so it
// never conflicts with SSR output.
export function applyDetectedLanguage() {
  if (typeof window === "undefined") return;

  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  const lng = stored ? convertDetectedLanguage(stored) : convertDetectedLanguage(window.navigator.language);

  if (lng && lng !== i18n.language) {
    void i18n.changeLanguage(lng);
  }
}

export default i18n;
