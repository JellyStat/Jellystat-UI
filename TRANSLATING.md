# Translating Jellystat UI

Every string in the UI comes from one file per language, `public/locales/<code>/common.json`.
The English file, `public/locales/en-US/common.json`, is the template. Every other language has
the same keys, and only the values change.

Untranslated strings are stored as `""`, and the app shows the English text for them. That means
you can translate part of a file, open a pull request, and finish the rest later.

## Improving an existing language

1. Open `public/locales/<code>/common.json` (for example `de-DE`).
2. Find the empty strings (`""`) or the ones you want to improve, and edit the values.
3. Run the check:

   ```bash
   npm run i18n:check -- de-DE --untranslated
   ```

   It shows how much is translated, lists the keys that are still empty, and points out any
   mistakes (see [Rules](#rules)).
4. Open a pull request. The same check runs on it automatically.

You don't need to run the app to translate. If you want to see your changes, run `npm install`
and `npm run dev`, then choose the language under **Settings**.

## Adding a new language

```bash
npm run i18n:new -- fr-FR
```

This does two things:

- It creates `public/locales/fr-FR/common.json` with every key from English and every value
  empty. Plural keys are expanded to the forms your language needs (see [Plurals](#plurals)).
- It adds the language to `public/locales/languages.json`. The language switcher reads this
  file, so nothing else needs editing. The name defaults to the language's own name (here
  `Français (France)`). To pick a different one, pass `--name "Français"`.

Use a full code with a region, such as `fr-FR`, `pt-BR` or `zh-CN`. A browser set to a language
you didn't list exactly gets the closest match: `fr-CA` gets `fr-FR`, and if `pt-BR` and `pt-PT`
both exist, each browser gets its own.

Then translate the file and open a pull request as above.

## Rules

`npm run i18n:check` enforces the first three rules. A pull request that breaks one fails.

- **Don't change, add or remove keys.** Translate only the values. Keys follow the English file.
- **Keep placeholders exactly as they are.** `{{name}}`, `{{count}}`, `{{taskName}}` and so on,
  and numbered slots such as `{0}` and `{1}`, are replaced with real values at runtime. You can
  move them anywhere in the sentence, but don't translate, rename or drop them.
- **Keep the `**bold**` markers.** Text between `**` is shown in bold. Use the same number of
  `**` markers as the English string.
- **Match the app's tone.** Use short, plain UI language. For languages with a formal and an
  informal "you", pick one and use it everywhere (German uses the informal *du*).
- **Keep product and technical names.** Jellystat, Jellyfin, Emby, API, URL, HDR, codec names
  and so on usually stay as they are.

### Plurals

Keys that depend on a number come in plural forms, for example:

```json
"n_libraries_one": "{{count}} library",
"n_libraries_other": "{{count}} libraries"
```

Languages use different forms. German uses `_one` and `_other`. Polish uses `_one`, `_few`,
`_many` and `_other`, and Japanese only `_other`. `npm run i18n:new` creates exactly the forms
your language needs, using the standard Unicode plural rules. Fill in each one. In a form
other than `_other` you may write the number as a word instead of `{{count}}`, for example
"one library".

Some languages (French, Spanish, Italian, Portuguese) also get a `_many` form. It's only used for
very large numbers written in compact notation, so copying the `_other` text into it is fine.

## For developers: keeping the files in sync

When you add, rename or remove a `t("key", "English default")` call, run:

```bash
npm run extract
```

This updates `en-US` from the defaults in the code. It also adds the new keys to every other
language as `""` and removes deleted keys from all languages. A pull request that changes
`t()` calls without running it fails the **Check translations** workflow.

## For maintainers: Weblate

The files work with [Weblate](https://weblate.org) as they are, so translators can work in a
browser without using Git. Create one component with these settings:

| Setting | Value |
|---|---|
| File format | i18next JSON file v4 |
| File mask | `public/locales/*/common.json` |
| Monolingual base language file | `public/locales/en-US/common.json` |
| Template for new translations | `public/locales/en-US/common.json` |
| Source language | English |
| Language code style | BCP style using hyphen as a separator (`fr-FR`) |

When Weblate adds a new language, it creates only the JSON file. Add the language to
`public/locales/languages.json` as well, or `npm run i18n:check` reports it.
