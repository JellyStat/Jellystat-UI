# UI Consistency Audit

Written 2026-11-03 against `main` @ `d8dd991`. The counts cover every `.tsx` file in `components/` and `pages/`, not including `components/ui/`.

**Goal:** settle on one scale for colour, spacing, radius, type and elevation, and build it into the kit so that migrating a screen also brings it in line with the scale.

> The report designer and renderer (`components/Reports/**`) use hex colours that are **user data** (colours people pick for their reports, plus PDF export). Those stay as they are. Only the designer's own chrome (panels, toolbars) is in scope.

---

## 1. Findings

### 1.1 Colour

| Issue | Evidence | Where |
|---|---|---|
| Hard-coded hex surfaces that sit next to the theme tokens | `bg-[#1a1c23]` ×3, `border-[#262933]` ×3, `bg-[#16161a]` ×2, `bg-[#14151a]`, `border-[#22242b]`, `bg-[#e5e7eb]` | LibraryInfoOverviewCard, Reports designer/viewer chrome, UpdateUser, CreateUser |
| Hard-coded hover colour for purple | `hover:bg-[#9a2cee]` ×2 | AddUser, CreateUser |
| Danger colour has 4 versions | `bg-brand-rose` (65), `bg-rose-600` (9, hover), `text-rose-400` (3), `#ef4444` (4, charts) | settings, charts |
| Success colour has 3 versions | `brand-emerald` (25 fills), `green-400/500` (8), `emerald-400/500` (3) | status badges, task states |
| Info and warning use raw Tailwind colours that aren't in the theme | `sky-400/500` (6), `orange-500` (2), `yellow-200/400` (2), `blue-400/500` (2) | log levels, status chips |
| The primary action colour isn't fixed | Solid fills: cyan 72, purple 58, rose 65. Submit buttons are purple in AddUser/CreateUser and cyan in CreateApiKey/setup | modals, forms |
| Text on cyan isn't fixed | `text-black` ×14, `text-white` ×4 | buttons |
| Charts copy the brand hex values instead of reading the tokens | `"#00a4dc"`, `"#aa3bff"`, `"#34d399"`, `"#fbbf24"`, `"#f43f5e"` copied into chart files; also `"#8884d8"` (the recharts default) ×2 | PieChart, GenreStatCard, WatchTrendsCard, StatSizeList |
| Too many grey text shades | 400 (213), 500 (211), 200 (117), 300 (99), 600 (34), 100 (17) | everywhere |
| Too many surface opacities | `bg-surface` + `/30 /40 /50 /60 /80 /90 /95`; `bg-background` + `/40 /50 /60 /80` | cards, overlays |
| Border opacities | `border-border` (280), `/50` (43), `/60` (3), `/40` (1) | dividers |

### 1.2 Spacing
- **Button padding:** 15 different `px/py` pairs. The common ones are `px-3 py-1.5` (35), `px-4 py-2` (32), `px-5 py-3` (11), `px-5 py-2.5` (8), `px-4 py-3` (7) and `px-4 py-2.5` (4). Buttons that do the same job have different heights.
- **Container padding:** 14 values. Cards mostly use `p-4`, `p-5` or `p-6`; `p-3.5`, `p-10`, `p-12` and `p-16` are one-off values.
- **Gaps:** mostly consistent (`gap-2`/`3`/`4`). The occasional `gap-2.5` and `gap-5` are noise.

### 1.3 Radius
`rounded-xl` (130), `rounded-lg` (93), `rounded-2xl` (80), `rounded-full` (55), plain `rounded` (35), `rounded-md` (29), `rounded-3xl` (18) and `rounded-sm` (1). That's 7 corner sizes. Cards alternate between 2xl and 3xl, and buttons between lg and xl.

### 1.4 Type
- **Weights:** `font-bold` (272), `font-black` (92), `font-medium` (86), `font-normal` (14), `font-semibold` (11), `font-extrabold` (3). Semibold and extrabold are strays.
- **Page titles:** upstream changed most of them to `text-2xl sm:text-3xl` (14). Four variants remain, with or without `drop-shadow-md`, `mb-2`, `mb-6` or `md:text-4xl`. The kit's `PageHeader` still uses the old fixed `text-3xl` and needs updating.
- **Fixed pixel sizes:** `text-[10px]` and `text-[11px]` appear alongside `text-xs`.

### 1.5 Elevation
`shadow` (95), `shadow-inner` (92), `shadow-2xl` (33), `shadow-lg` (27), `shadow-xl` (26), `shadow-md` (14), `shadow-sm` (9). Cards and modals don't use a consistent shadow level.

### 1.6 Overlays
- **Modal widths:** `max-w-lg` (12), `max-w-md` (8), `max-w-2xl` (8), `max-w-sm` (4), `max-w-3xl` (3), and `4xl`/`5xl`/`6xl` (5).
- **Focus rings:** mostly `focus:ring-1` in the accent colour, but there are 4 `focus:ring-2` and 2 `ring-offset` stragglers.

---

## 2. Proposed standards

These go into `styles/globals.css` `@theme` and into the kit's variants. Anything off the scale is a bug.

### 2.1 Colour roles
Add semantic tokens so components say what a colour is for (danger, success…) rather than which colour it is:

```css
@theme {
  /* existing brand + surface tokens stay */
  --color-primary: var(--color-brand-purple);      /* main actions, focus */
  --color-primary-hover: #9a2cee;
  --color-on-primary: #fff;                          /* text on primary */
  --color-accent: var(--color-brand-cyan);          /* highlights, links, secondary emphasis */
  --color-accent-hover: #0090c2;
  --color-on-accent: #000;                           /* text on accent */
  --color-danger: var(--color-brand-rose);
  --color-danger-hover: #e11d48;                    /* = rose-600 */
  --color-success: var(--color-brand-emerald);
  --color-warning: var(--color-brand-amber);
  --color-info: #38bdf8;                            /* = sky-400, the one used for info today */
  --color-surface-raised: #1a1c23;                  /* replaces the hex panel colours */
  --color-border-strong: #3f3f46;                   /* replaces hover:border-gray-500/600 */
}
```

- **One primary colour: purple** (decided 2026-11-03). Every submit or main action button is purple. Cyan becomes *accent*: links, highlights, icon chips, charts, and the occasional secondary call-to-action. Cyan submit buttons (CreateApiKey, setup) turn purple.
- **Text on primary** is always white (`text-on-primary`). Text on accent is always black (`text-on-accent`); this fixes the 4 cyan buttons that use white text.
- **Charts** get their colours from a single `lib/helpers/chartColors.ts` that maps to the tokens, instead of hex copied into each file.

### 2.2 Text shades (6 → 4)

| Role | Class |
|---|---|
| Heading / strong | `text-white` |
| Body | `text-gray-200` (fold `gray-100` and `gray-300` into this) |
| Muted (labels, secondary) | `text-gray-400` |
| Subtle (placeholders, disabled, meta) | `text-gray-500` (fold `gray-600` into this, except placeholders, which keep `placeholder:text-gray-600`) |

### 2.3 Surfaces
- **Opaque:** `bg-background` (page), `bg-surface` (card), `bg-surface-raised` (nested panel / input group), `bg-surface-hover` (hover).
- **Translucent**, used only on glass layers that sit over imagery: `bg-surface/60` with `backdrop-blur-xl`. Every other opacity folds into one of these.
- **Borders:** `border-border` by default, `border-border/50` for dividers inside a card, nothing else.

### 2.4 Spacing scale
- **Controls**, which give buttons and inputs one shared height per size:

  | Size | Padding | Radius | Text |
  |---|---|---|---|
  | `sm` | `px-3 py-1.5` | `rounded-lg` | `text-xs` |
  | `md` | `px-4 py-2.5` | `rounded-xl` | `text-sm` |
  | `lg` | `px-5 py-3` | `rounded-xl` | `text-sm` |

  Inputs use the `md` height.
- **Containers:** cards `p-5 md:p-6`, compact cards / list rows `p-4`, empty states `p-12`, modals `p-5 md:p-6`.
- **Gaps:** `gap-1`, `gap-2`, `gap-3`, `gap-4`, `gap-6`, `gap-8`.

### 2.5 Radius (7 → 4)

| Use | Class |
|---|---|
| Badges, chips, small controls | `rounded-lg` (fold `rounded`, `rounded-md` and `rounded-sm` into this) |
| Buttons, inputs, nested panels | `rounded-xl` |
| Cards, modals | `rounded-2xl` (fold `rounded-3xl` into this) |
| Pills, avatars, dots | `rounded-full` |

### 2.6 Type

| Role | Class |
|---|---|
| Page title | `text-2xl sm:text-3xl font-black tracking-tight text-white` |
| Section title | `text-xl font-black tracking-tight text-white` |
| Card title | `text-lg font-bold text-white` |
| Body | `text-sm font-medium text-gray-200` |
| Label | `text-xs font-bold uppercase tracking-wider text-gray-400` |
| Button | `font-bold`, at the text size the control size sets |
| Micro (badges, meta) | `text-[11px] font-bold` (fold `text-[10px]` into this) |

The allowed weights are medium, bold and black. Semibold and extrabold fold into bold, and normal is used only for long prose.

### 2.7 Elevation (7 → 3)
- **Cards:** `shadow-lg shadow-black/20`
- **Overlays** (modals, popovers, menus): `shadow-2xl shadow-black/40`
- **Insets** (inputs, wells): `shadow-inner`

Plain `shadow`, `shadow-sm`, `shadow-md` and `shadow-xl` fold into the nearest of these. Coloured glows (`shadow-brand-*/20`) appear only on primary buttons.

### 2.8 Overlays
- **Modal sizes:** `sm` = `max-w-md` (confirmations), `md` = `max-w-lg` (forms, the default), `lg` = `max-w-2xl` (detail views), `xl` = `max-w-4xl` (data-heavy views, e.g. the activity match dialog).
- **Focus:** always `focus-visible:ring-1 focus-visible:ring-primary` (`ring-danger` when in an error state). No ring offsets. With purple primary, the 19 inputs that focus cyan today will focus purple, so focus matches the main action colour.

---

## 3. Applying it

The kit is where the standards get enforced, so no pass over every file is needed:

1. **Tokens:** add the semantic colours from section 2.1 to `globals.css`. This is additive and changes nothing visible.
2. **Kit:** update the existing kit components to the standards: Button sizes and colour roles, Input height, Card radius and shadow, PageHeader's responsive title, Modal sizes.
3. **Migration (Phase 4):** each screen moved onto the kit picks up the standards automatically. While a file is open, also fix its leftover raw classes using the tables above.
4. **Charts:** add `chartColors.ts` and point PieChart, GenreStatCard, WatchTrendsCard and StatSizeList at it.
5. **Guard:** extend the Phase 5 grep audit to fail on `-\[#`, `rounded-3xl`, `font-semibold`, `shadow-md` and raw `green-`/`sky-`/`red-` colours outside `components/ui` and `components/Reports/render`.

**Visible changes to expect:** cyan submit buttons turn purple, cyan input focus turns purple, some cards lose a little corner radius (3xl → 2xl), and a few buttons change height by 2–4px. These are deliberate, and each one should be checked on the screen it affects in its PR.
