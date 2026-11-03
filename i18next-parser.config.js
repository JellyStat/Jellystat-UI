// i18next-parser.config.js
module.exports = {
  locales: ["en-US", "de-DE"],
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
  defaultValue: function (locale, namespace, key, value) {
    return value ?? "";
  },
  keepRemoved: false,
  keySeparator: ".",
  namespaceSeparator: ":",
  createOldCatalog: false,
};
