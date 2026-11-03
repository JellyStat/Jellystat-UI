# In-house UI Kit Plan

Status: **planned, not started**. Written 2026-11-02.

**Goal:** move the UI that already exists into a reusable kit in `components/ui/`, so the look is defined in one place instead of copied as Tailwind strings across pages, and bring the UI in line with one consistent scale for colour, spacing, radius, type and elevation along the way. The standards are in [UI_AUDIT.md](UI_AUDIT.md).

**Constraints:**
- **No new dependencies.** The kit is built only from what's already installed: Tailwind v4, `clsx`, `tailwind-merge`, `@headlessui/react`, `@daypicker/react`, `recharts`, `lucide-react` and `sonner`.
- Kit components follow the standards in `UI_AUDIT.md`, not every variant that exists today. Migrating a screen can change how it looks in the ways the audit lists; check each screen in its PR.

---

## 1. How the UI is built today (audit)

- Styling is inline Tailwind on raw elements: ~65 `<button>`, ~19 `<input>`, 8 `<table>`, 1 `<select>`.
- Theme tokens live in `styles/globals.css` under `@theme`: `brand-{cyan,purple,emerald,rose,amber}`, `background`, `surface`, `surface-hover`, `border`.
- Headless primitives come from `@headlessui/react`: `<Dialog>` in 8 files and `<Listbox>` in `DropdownSelector`.
- `components/Core/` already holds the start of a kit: Badge, ConfirmationDialog(+Button), DateRangePicker(+Button), DropdownSelector, LanguageSwitcher, NumberField, PieChart, StatusIndicator.

These class strings are repeated verbatim, which makes each one a kit candidate:

| Pattern | Occurrences | Example classes |
|---|---|---|
| Field label | 15 | `text-xs font-bold text-gray-400 uppercase tracking-wider ml-1` |
| Input leading icon | 15 | `absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500 …` |
| Input trailing action | 6 | `absolute inset-y-0 right-0 flex items-center pr-3.5 …` |
| Text input | 13 | `w-full bg-background border rounded-xl py-3 pl-11 pr-4/pr-12 text-sm …` |
| Field error | 11 | `text-[11px] font-bold text-brand-rose ml-1 flex items-center mt-1` |
| Error alert (icon/title/body) | 14 / 6 / 5 | `text-brand-rose shrink-0 mt-0.5`, `text-lg font-bold text-brand-rose mb-1`, `text-xs text-brand-rose/90 …` |
| Page title | 11 | `text-3xl font-black text-white tracking-tight` |
| Section title | 8 | `text-2xl font-black text-white tracking-tight` |
| Subtitle | 11 | `text-sm text-gray-400 mt-1 font-medium` |
| Page header row | 7 | `flex flex-col md:flex-row … justify-between gap-4 border-b border-border/5…` |
| Page container | 5–6 | `space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12 p-6` |
| Modal shell | 6 | `relative z-50` + `fixed inset-0 bg-black/60 backdrop-blur-sm` + `fixed inset-0 flex items-center justify-center p-4` |
| Card / panel | 6 + 3 + 3 | `bg-surface border border-border rounded-2xl shadow-xl shadow-black/20 …` and glass variants `bg-surface/60 backdrop-blur-xl … rounded-3xl` |
| Small outline button | 6 | `px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-gray-500 …` |
| Icon button | 2+ | `p-1 rounded hover:bg-surface border border-transparent hover:border-border …` |
| Table | 5 | `w-full text-left border-collapse whitespace-nowrap`; th `p-4 text-sm font-medium text-gray-400`; td `p-3 text-sm font-bold text-gray-200` |
| Spinner | 37 files | `<Loader2 className="text-brand-cyan|purple animate-spin …">` |
| Tinted icon chip | many | `bg-brand-{rose,cyan,purple,emerald}/10` + matching `text-brand-*` |

---

## 2. Kit structure

```
components/ui/
  cn.ts                # cn(...) = twMerge(clsx(...)): both libraries are already deps
  variants.ts          # small typed helper: variants({ base, variants, defaults }), so no cva dependency
  index.ts             # barrel: import { Button, Card } from "@/components/ui"
  primitives/
    Button.tsx         # variant: primary | outline | ghost | danger | icon; size: sm | md; loading prop (spinner)
    IconButton.tsx
    Input.tsx          # leftIcon, rightSlot, error; reproduces the pl-11 / pr-12 logic
    NumberField.tsx    # moved from Core
    Label.tsx
    FieldError.tsx
    Field.tsx          # Label + control + FieldError composition
    Select.tsx         # wraps headlessui Listbox (from Core/DropdownSelector)
    Badge.tsx          # moved from Core; tone: cyan | purple | emerald | rose | amber | neutral
    StatusIndicator.tsx
    Spinner.tsx        # Loader2 + animate-spin, tone prop
    Skeleton.tsx       # the animate-pulse blocks
  layout/
    Page.tsx           # page container (max-w-[1600px], fade-in, padding)
    PageHeader.tsx     # title + subtitle + actions slot
    SectionTitle.tsx
    Card.tsx           # variant: solid | glass | glass-subtle; Card.Header / Card.Body
    IconChip.tsx       # tinted bg-brand-x/10 square with icon
  overlay/
    Modal.tsx          # headlessui Dialog + backdrop + centered panel; title, description, footer slots
    ConfirmDialog.tsx  # moved from Core, built on Modal
    ConfirmButton.tsx
  data/
    Table.tsx          # Table, Thead, Th, Tbody, Tr, Td: classes from the 5 existing tables
    EmptyState.tsx     # from ErrorCards/NoData
    ErrorAlert.tsx     # rose icon + title + body
    PieChart.tsx       # moved from Core
  inputs/
    DateRangePicker.tsx / DateRangePickerButton.tsx  # moved from Core
    LanguageSwitcher.tsx
```

Rules for every kit component:
- Accept `className` and merge it with `cn()` last, so a call site can still override.
- Forward the native props (`...rest`) and `ref` (React 19 takes `ref` as a normal prop).
- Use only theme tokens. A raw hex value is a bug.
- Put no data fetching, permission checks or i18n keys inside the kit. Text arrives through props or children.

---

## 3. Execution phases

Each phase is its own PR. Run `npm test` and check pages visually in `npm run dev` before merging.

### Phase 0: Foundation
1. Commit or stash the pending `lib/api.ts` change, then branch to `refactor/ui-kit`.
2. Add `components/ui/cn.ts`, `variants.ts` and `index.ts`.
3. Turn Storybook on for `components/ui/**/*.stories.tsx` with `globals.css` loaded and a dark background. It is already installed.

### Phase 1: Primitives
Build in this order: Spinner, Label, FieldError, Input, Field, Button, IconButton, Badge, Skeleton. Base each one on the exact strings in the audit table. Add one story per component showing every variant.

### Phase 2: Layout + overlay + data
Build Page, PageHeader, SectionTitle, Card, IconChip, Modal, Table, ErrorAlert and EmptyState. Copy Modal's internals from `IpLookUpModal`/`AddUser`: they share the same backdrop and panel.

### Phase 3: Fold `components/Core` into the kit
Move each Core file into `components/ui/` and rebuild its internals on the new primitives, keeping the props the same. Leave a re-export at the old path, e.g. `export * from "@/components/ui/overlay/ConfirmDialog"`, so nothing breaks. Delete `components/Core` once the call sites are updated in Phase 4.

`Core/IconButton.tsx` arrived with the 2026-11-03 main update. It's an icon-only pill (props `icon`, `shape`, `tooltip`) and differs from the kit's `IconButton`. Merge the two by adding `icon`/`shape` support to the kit version; it has only one caller. The newer code also uses headlessui `Popover`, `Menu` and `Combobox`, which are candidates for kit wrappers once each has a second caller.

### Phase 4: Migrate call sites (one area per PR, smallest first)
Since the 2026-11-03 main update, settings and setup screens live in `components/Settings/**` and `components/Setup/**`; the files under `pages/` are thin routes.
1. `components/Setup/**` and `components/Settings/Users/**`: inputs, fields, modals, buttons.
2. `components/Settings/{Servers,Library,Backups,Tasks,ActivityMigration,ApiKeys,Webhooks}`: tables, modals, error alerts.
3. `components/ActivityTable/**` and `components/DataTableFilters/**`: Table, filters, IpLookUpModal.
4. Stats and cards: StatsCard, WatchStatCard(s), GenreStatCards, LibraryCard, LibraryOverview, ItemsCards, ActivityItemsCards, RecentlyAdded, LastWatched, MediaGrid, Sessions.
5. Page shells: swap every `<h1 className="text-3xl font-black …">` and container div for `Page` + `PageHeader`.
6. SideNav: use Button/IconButton where they fit and leave the layout alone.

For each file: swap the markup for the kit component, delete the class string, and leave the logic as it is. That includes permission checks, `t()` keys and handlers.

### Phase 5: Lock it in
- Delete `components/Core` and its re-exports.
- Add a lint guard: an `oxlint` `no-restricted-imports` rule (or a `grep` step in `npm test`) that fails on `@headlessui/react` imports outside `components/ui/`.
- Audit with `grep -rE "<button|<input|<table|animate-spin" components pages`. Any match left should be intentional.
- Add a short section to the README on how to use the kit.

---

## 4. Checklist
- [x] Phase 0: cn/variants/barrel (branch `refactor/ui-kit`)
- [ ] Phase 0b: Storybook. Skipped for now: the package is installed but there is no `.storybook/` config yet
- [x] Phase 1: Spinner, Label, FieldError, Input (+ InputAction), Field, Button, IconButton, Badge, Skeleton, with tests in `components/ui/__tests__/kit.test.tsx`
- [x] Phase 2: Page, PageHeader, SectionTitle, Card, IconChip, Modal (+ ModalPanel/ModalHeader/ModalFooter), Table (+ TableHead/Th/TableBody/Td/TableMessageRow), ErrorAlert, EmptyState, with tests in `components/ui/__tests__/layout.test.tsx`
- [x] Phase 2.5: semantic colour tokens in `globals.css`, kit components updated to the audit standards (shared `tones.ts`, focus ring, Card `padding`, Modal `size`, `Tr`), `lib/helpers/chartColors.ts`
- [x] Pilot: `components/Settings/Users/AddUser.tsx` migrated to the kit (still needs a visual check while signed in)
- [x] Phase 3: Core moved into the kit. Badge, StatusIndicator, IconButton, ConfirmationDialog, DateRangePicker and PieChart callers now use the kit directly, and the Core files are deleted. DateRangePickerButton was unused and is deleted. LanguageSwitcher moved to `components/Settings/`. Three files remain in `components/Core` and should be deleted in Phase 5:
  - `DropdownSelector.tsx`: re-export of `Select`, 13 callers
  - `NumberField.tsx`: re-export, 3 callers
  - `ConfirmationDialogButton.tsx`: i18n wrapper over `ConfirmButton`, 9 callers
- [x] Phase 4.1: setup + settings/Users. CreateUser, CreateServerInstance and SetupComplete share `components/Setup/SetupStep.tsx`; UpdateUser and UsersSettings are on the kit. The kit gained `Field` `hint`/`description`, the `Button` `dangerSoft` variant, and safer Modal centring. Still needs a visual check while signed in.
- [ ] Phase 4.2: remaining settings pages
- [ ] Phase 4.3: ActivityTable + DataTableFilters
- [ ] Phase 4.4: stats and cards
- [ ] Phase 4.5: page shells
- [ ] Phase 4.6: SideNav
- [ ] Phase 5: delete Core, lint guard, grep audit, README

## 5. Risks / notes
- **Visual drift:** near-identical strings often differ by one class (`rounded-2xl` vs `rounded-3xl`, `px-4` vs `px-5`). Settle each one against `UI_AUDIT.md` rather than adding a variant to keep it. Make it a prop only when the difference has a real purpose, e.g. `pr-12` when an input has a trailing button.
- **Permission-gated UI** (latest commit): conditional rendering stays at the call site, never inside the kit.
- **`tailwind-merge`:** custom tokens (`bg-surface`, `text-brand-*`) merge correctly because they follow the standard color-utility naming. Check this once with a quick test in `cn.ts`.
- **Jest:** add a small render test per kit component under `components/ui/__tests__` with the existing Testing Library setup.
