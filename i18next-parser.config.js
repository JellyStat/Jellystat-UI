// i18next-parser.config.js
module.exports = {
  // The locales you want to generate
  locales: ['en-US', 'de'],
  
  // The default namespace (matches what you pass to useTranslation("common"))
  defaultNamespace: 'common',

  // Where to look for your code
  input: [
    'pages/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}'
  ],

  // Where to save the generated JSON translation files
  output: 'public/locales/$LOCALE/$NAMESPACE.json',

  // Indent the JSON nicely
  indentation: 2,

  // Keep keys sorted alphabetically
  sort: true,

  // IMPORTANT: Since you used t("key", "Default value"), this ensures 
  // the parser pulls "Default value" into the English JSON!
  keepRemoved: false, // Removes keys from JSON if you delete them from the code
};