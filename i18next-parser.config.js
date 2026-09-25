// i18next-parser.config.js
module.exports = {
  locales: ["en-US", "de-DE"],
  defaultNamespace: "common",
  input: ["pages/**/*.{js,jsx,ts,tsx}", "components/**/*.{js,jsx,ts,tsx}", "lib/**/*.{js,jsx,ts,tsx}"],
  output: "public/locales/$LOCALE/$NAMESPACE.json",
  indentation: 2,
  sort: true,
  defaultValue: function (locale, namespace, value) {
    return value;
  },
  keepRemoved: false,
  keySeparator: ".",
  namespaceSeparator: ":",
  createOldCatalog: false,
};
