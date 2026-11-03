# Translating Jellystat UI

Every string in the UI comes from one file per language, `public/locales/<code>/common.json`.
The English file, `public/locales/en-US/common.json`, is the template. Every other language has
the same keys, and only the values change.

Untranslated strings are stored as `""`, and the app shows the English text for them. That means
you can translate part of a language and finish the rest later.

## Translating on Weblate (recommended)

[![Translation status](https://hosted.weblate.org/widget/jellystat/multi-auto.svg)](https://hosted.weblate.org/engage/jellystat/)

The easiest way to help is on [Hosted Weblate](https://hosted.weblate.org/engage/jellystat/).
You translate in your browser, with no Git or setup needed. Weblate also warns you about broken
placeholders as you type. Your changes reach this repository as pull requests, which run the
same checks as everyone else's.

1. Sign in to Weblate (with your GitHub account or by email).
2. Open the [Jellystat project](https://hosted.weblate.org/projects/jellystat/), choose a
   language, and start translating. Please read the [Rules](#rules) first.
3. **Your language isn't listed?** Use **Start new translation** on the project page to request
   it. A maintainer adds the language to the repository, and it then appears in Weblate for you
   to translate.

## Translating in the repository

If you prefer working with the files directly, you can edit the JSON and open a pull request.
Translations are made in both places, so if your language is active on Weblate, check that
nobody is working on the same strings there.

### Improving an existing language

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

### Adding a new language

Maintainers also use this command when someone requests a language on Weblate.

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

Translations live in the [jellystat project on Hosted Weblate](https://hosted.weblate.org/projects/jellystat/),
in the **Web UI** component. It's set up like this:

| Setting | Value | Why |
|---|---|---|
| Version control system | GitHub pull request | Weblate pushes to its own fork and opens PRs, so it needs no write access and every change runs the **Check translations** workflow. |
| Repository / branch | `https://github.com/JellyStat/Jellystat-UI.git`, `main` | |
| File format | i18next JSON file v4 | |
| File mask | `public/locales/*/common.json` | |
| Monolingual base language file | `public/locales/en-US/common.json` | |
| Edit base file | Off | English comes from the code through `npm run extract`, which would overwrite edits made in Weblate. |
| Template for new translations | empty | Weblate falls back to the base file. |
| Adding new translation | Contact maintainers | A new language also needs an entry in `languages.json`, which Weblate can't add. |
| Language code style | BCP style using hyphen as a separator | Gives `fr-FR`, matching the folders. |
| Translation license | GPL-3.0-only | Matches the code. |
| Check flags | `i18next-interpolation, md-text` | Warns translators about broken placeholders and `**bold**` markup. |

A GitHub webhook (`https://hosted.weblate.org/hooks/github/`, push events) tells Weblate about new
commits, so new English strings show up there soon after `npm run extract` lands on `main`.

**When someone requests a new language**, run `npm run i18n:new -- <code>` and push. Weblate
picks up the new file on the next pull. Don't let Weblate create language files itself: it
can't add the `languages.json` entry, and `npm run i18n:check` would fail.
