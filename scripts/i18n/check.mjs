// Validates every locale against the en-US template.
//
//   npm run i18n:check                          all locales
//   npm run i18n:check -- de-DE                 one locale
//   npm run i18n:check -- de-DE --untranslated  also list the keys still left to translate
//
// Errors (exit code 1): missing or stale keys, non-string values, placeholders ({{name}}, {0})
// or **bold** markup that don't match the English string, empty strings in en-US, and locale
// folders that aren't listed in public/locales/languages.json (or the other way round).
// Untranslated ("") strings are reported but are not errors; the app shows English for them.
import fs from "node:fs";
import path from "node:path";
import {
  LOCALES_DIR,
  ROOT,
  SOURCE_LOCALE,
  analyzeTemplate,
  expectedKeys,
  flatten,
  localeFile,
  readJson,
  readRegistry,
} from "./shared.mjs";

const args = process.argv.slice(2);
const listUntranslated = args.includes("--untranslated");
const only = args.filter((a) => !a.startsWith("--"));

const errors = [];
const error = (locale, message) => errors.push(`${locale}: ${message}`);

function placeholders(value) {
  const found = value.match(/\{\{\s*[^{}]+?\s*\}\}|\{\d+\}/g) ?? [];
  return new Set(found.map((p) => p.replace(/\s+/g, "")));
}

function boldCount(value) {
  return (value.match(/\*\*/g) ?? []).length;
}

const registry = readRegistry();
const registered = new Set(registry.map((l) => l.code));
const folders = fs
  .readdirSync(LOCALES_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

for (const folder of folders) {
  if (!registered.has(folder)) {
    error(folder, "folder exists but the locale is not listed in public/locales/languages.json");
  }
}
for (const { code, name } of registry) {
  if (!fs.existsSync(localeFile(code))) {
    error(code, `listed in languages.json but ${path.relative(ROOT, localeFile(code))} is missing`);
  }
  if (!name || typeof name !== "string") {
    error(code, 'languages.json entry needs a "name" (the language name in that language)');
  }
}

const template = flatten(readJson(localeFile(SOURCE_LOCALE)));
const { plurals } = analyzeTemplate(template);

for (const [key, value] of template) {
  if (typeof value !== "string") {
    error(SOURCE_LOCALE, `${key} is not a string`);
  } else if (value === "") {
    error(SOURCE_LOCALE, `${key} is empty; give the t() call an English default and run npm run extract`);
  }
}

const rows = [];
const targets = registry
  .map((l) => l.code)
  .filter((code) => code !== SOURCE_LOCALE && (only.length === 0 || only.includes(code)));

for (const unknown of only.filter((c) => !registered.has(c))) {
  error(unknown, "not listed in public/locales/languages.json");
}

for (const locale of targets) {
  if (!fs.existsSync(localeFile(locale))) continue;

  let data;
  try {
    data = flatten(readJson(localeFile(locale)));
  } catch (e) {
    error(locale, `common.json is not valid JSON: ${e.message}`);
    continue;
  }

  const expected = expectedKeys(template, locale);
  const untranslated = [];
  let translated = 0;

  for (const [key, { template: templateKey, pluralBase }] of expected) {
    if (!data.has(key)) {
      error(locale, `missing key ${key}`);
      untranslated.push(key);
      continue;
    }
    const value = data.get(key);
    if (typeof value !== "string") {
      error(locale, `${key} must be a string`);
      continue;
    }
    if (value === "") {
      untranslated.push(key);
      continue;
    }
    translated++;

    const english = template.get(templateKey);
    const actual = placeholders(value);
    if (pluralBase) {
      // A plural form may drop {{count}} (e.g. "one library" spelled out), but it must keep every
      // other placeholder and can only use ones that appear in some English form.
      const forms = [...plurals.get(pluralBase).values()];
      const allowed = new Set(forms.flatMap((f) => [...placeholders(f)]));
      const required = [...placeholders(english)].filter((p) => p !== "{{count}}");
      for (const p of actual) {
        if (!allowed.has(p)) error(locale, `${key} uses ${p}, which the English string doesn't have`);
      }
      for (const p of required) {
        if (!actual.has(p)) error(locale, `${key} is missing ${p}`);
      }
    } else {
      const wanted = placeholders(english);
      for (const p of actual) {
        if (!wanted.has(p)) error(locale, `${key} uses ${p}, which the English string doesn't have`);
      }
      for (const p of wanted) {
        if (!actual.has(p)) error(locale, `${key} is missing ${p}`);
      }
    }
    if (boldCount(value) !== boldCount(english)) {
      error(locale, `${key} has ${boldCount(value)} "**" markers, the English string has ${boldCount(english)}`);
    }
  }

  for (const key of data.keys()) {
    if (!expected.has(key)) {
      error(locale, `stale key ${key} is not in ${SOURCE_LOCALE} (remove it, or run npm run extract)`);
    }
  }

  const percent = expected.size ? Math.floor((translated / expected.size) * 100) : 100;
  rows.push({ locale, translated, total: expected.size, percent, untranslated });
}

if (rows.length > 0) {
  console.log(`Translation status (template: ${SOURCE_LOCALE}, ${template.size} strings)\n`);
  for (const { locale, translated, total, percent, untranslated } of rows) {
    console.log(`  ${locale.padEnd(8)} ${String(percent).padStart(3)}%  ${translated}/${total} translated`);
    if (listUntranslated) {
      for (const key of untranslated) console.log(`      ${key}`);
    }
  }
  console.log("");
}

if (errors.length > 0) {
  console.error(`${errors.length} problem${errors.length === 1 ? "" : "s"} found:\n`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

console.log("No problems found.");
