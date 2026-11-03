// i18next-parser.config.js
const languages = require("./public/locales/languages.json");

const SOURCE_LOCALE = "en-US";

module.exports = {
  // en-US is the template; every other locale comes from public/locales/languages.json.
  locales: languages.map((l) => l.code),
  defaultNamespace: "common",
  input: [
    "pages/**/*.{js,jsx,ts,tsx}",
    "components/**/*.{js,jsx,ts,tsx}",
    "lib/**/*.{js,jsx,ts,tsx}",
    "!**/*.test.{ts,tsx}",
    "!**/__tests__/**",
  ],
  // dt() is the report designer's helper (lib/reports/i18n.ts); rich() is HelpDialog's formatted-sentence helper.
  lexers: {
    ts: [{ lexer: "JavascriptLexer", functions: ["t", "dt", "rich"] }],
    tsx: [{ lexer: "JsxLexer", functions: ["t", "dt", "rich"] }],
    default: [{ lexer: "JavascriptLexer", functions: ["t", "dt", "rich"] }],
  },
  output: "public/locales/$LOCALE/$NAMESPACE.json",
  indentation: 2,
  sort: true,
  // i18next-parser 9 passes (locale, namespace, key, value); value is the inline default from the code.
  // Only the en-US template gets the English text. New keys in other locales start as "" so they show
  // up as untranslated (npm run i18n:check, Weblate) while the app falls back to English for them.
  defaultValue: function (locale, namespace, key, value) {
    return locale === SOURCE_LOCALE ? (value ?? "") : "";
  },
  keepRemoved: false,
  keySeparator: ".",
  namespaceSeparator: ":",
  createOldCatalog: false,
};
