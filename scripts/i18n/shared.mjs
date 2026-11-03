// Helpers shared by the i18n:new and i18n:check scripts.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const LOCALES_DIR = path.join(ROOT, "public/locales");
export const REGISTRY_PATH = path.join(LOCALES_DIR, "languages.json");
export const SOURCE_LOCALE = "en-US";
export const NAMESPACE = "common";

// i18next's plural suffixes; which ones a language needs comes from Intl.PluralRules.
export const PLURAL_SUFFIXES = ["zero", "one", "two", "few", "many", "other"];
const PLURAL_RE = new RegExp(`^(.*)_(${PLURAL_SUFFIXES.join("|")})$`);

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

export function localeFile(locale) {
  return path.join(LOCALES_DIR, locale, `${NAMESPACE}.json`);
}

export function readRegistry() {
  return readJson(REGISTRY_PATH);
}

// One language per line so diffs that add a language stay a single line.
export function writeRegistry(languages) {
  const lines = languages.map(
    ({ code, name }) => `  { "code": ${JSON.stringify(code)}, "name": ${JSON.stringify(name)} }`
  );
  fs.writeFileSync(REGISTRY_PATH, `[\n${lines.join(",\n")}\n]\n`);
}

// { a: { b: "x" } } -> Map { "a.b" => "x" }; non-string leaves are kept so the check can flag them.
export function flatten(obj, prefix = "", out = new Map()) {
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      flatten(value, full, out);
    } else {
      out.set(full, value);
    }
  }
  return out;
}

// Inverse of flatten, with keys sorted at every level to match i18next-parser's `sort: true` output.
export function unflatten(map) {
  const root = {};
  for (const key of [...map.keys()].sort()) {
    const parts = key.split(".");
    let node = root;
    for (const part of parts.slice(0, -1)) {
      node = node[part] ??= {};
    }
    node[parts[parts.length - 1]] = map.get(key);
  }
  return sortDeep(root);
}

// Case-insensitive alphabetical, except that a plural group's forms stay together in
// zero/one/two/few/many/other order. This matches how i18next-parser writes the files.
function compareKeys(a, b) {
  const [baseA, rankA] = sortParts(a);
  const [baseB, rankB] = sortParts(b);
  return baseA === baseB ? rankA - rankB : baseA.localeCompare(baseB, "en");
}

function sortParts(key) {
  const m = PLURAL_RE.exec(key);
  return m ? [m[1], PLURAL_SUFFIXES.indexOf(m[2])] : [key, -1];
}

function sortDeep(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  return Object.fromEntries(
    Object.keys(obj)
      .sort(compareKeys)
      .map((k) => [k, sortDeep(obj[k])])
  );
}

export function pluralCategories(locale) {
  return new Intl.PluralRules(locale).resolvedOptions().pluralCategories;
}

// Splits the template's keys into plain keys and plural groups. A key counts as plural when the
// template has a `<base>_other` form, so `foo_one`/`foo_other` become the group "foo".
export function analyzeTemplate(template) {
  const plain = [];
  const plurals = new Map(); // base -> Map(suffix -> value)
  for (const key of template.keys()) {
    const m = PLURAL_RE.exec(key);
    if (m && template.has(`${m[1]}_other`)) {
      if (!plurals.has(m[1])) plurals.set(m[1], new Map());
      plurals.get(m[1]).set(m[2], template.get(key));
    } else {
      plain.push(key);
    }
  }
  return { plain, plurals };
}

// The keys a locale's file must contain: every plain template key, plus each plural group expanded
// to the forms that language uses (Polish needs _few and _many, Japanese only _other).
export function expectedKeys(template, locale) {
  const { plain, plurals } = analyzeTemplate(template);
  const categories = pluralCategories(locale);
  const keys = new Map(plain.map((k) => [k, { template: k }]));
  for (const base of plurals.keys()) {
    for (const cat of categories) {
      keys.set(`${base}_${cat}`, { template: `${base}_other`, pluralBase: base });
    }
  }
  return keys;
}
