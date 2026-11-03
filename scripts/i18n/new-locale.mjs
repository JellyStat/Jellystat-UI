// Scaffolds a new locale from the en-US template.
//
//   npm run i18n:new -- fr-FR
//   npm run i18n:new -- pt-BR --name "Português (Brasil)"
//
// Writes public/locales/<code>/common.json with every key from en-US set to "" (plural keys
// expanded to the forms the language needs) and adds the language to public/locales/languages.json.
// Empty strings fall back to English in the app until they are translated.
import fs from "node:fs";
import path from "node:path";
import {
  ROOT,
  SOURCE_LOCALE,
  expectedKeys,
  flatten,
  localeFile,
  pluralCategories,
  readJson,
  readRegistry,
  unflatten,
  writeJson,
  writeRegistry,
} from "./shared.mjs";

function fail(message) {
  console.error(`i18n:new: ${message}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const nameIndex = args.indexOf("--name");
let name = nameIndex >= 0 ? args[nameIndex + 1] : undefined;
const positional = nameIndex >= 0 ? args.filter((_, i) => i !== nameIndex && i !== nameIndex + 1) : args;

if (positional.length !== 1) {
  fail('usage: npm run i18n:new -- <locale-code> [--name "Native name"]   e.g. fr-FR');
}

let code;
try {
  [code] = Intl.getCanonicalLocales(positional[0]);
} catch {
  fail(`"${positional[0]}" is not a valid BCP-47 locale code (expected something like fr-FR)`);
}

const registry = readRegistry();
if (registry.some((l) => l.code.toLowerCase() === code.toLowerCase())) {
  fail(`${code} is already listed in public/locales/languages.json`);
}
const file = localeFile(code);
if (fs.existsSync(file)) {
  fail(`${path.relative(ROOT, file)} already exists`);
}

if (!name) {
  // The language's name in its own language, e.g. "français (France)" -> "Français (France)".
  const native = new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code;
  name = native.charAt(0).toLocaleUpperCase(code) + native.slice(1);
}

const template = flatten(readJson(localeFile(SOURCE_LOCALE)));
const keys = expectedKeys(template, code);
writeJson(file, unflatten(new Map([...keys.keys()].map((k) => [k, ""]))));

registry.push({ code, name });
writeRegistry(registry);

console.log(`Created ${path.relative(ROOT, file)} with ${keys.size} empty strings.`);
console.log(`Added { code: "${code}", name: "${name}" } to public/locales/languages.json.`);
console.log(`Plural forms for ${code}: ${pluralCategories(code).join(", ")}.`);
console.log("");
console.log("Next: translate the empty strings, then run `npm run i18n:check` to verify.");
