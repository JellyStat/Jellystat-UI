# Jellystat Web UI

> [!TIP]
> **Looking to install Jellystat?** Head to [JellyStat/Jellystat](https://github.com/JellyStat/Jellystat) for install instructions, and to report bugs or request features. This repo is for developing the web interface.

A fast, responsive, and lightweight web dashboard for [Jellystat](https://github.com/JellyStat/Jellystat). Built with Next.js and Tailwind CSS, this interface is designed to provide real-time telemetry, user management, and activity tracking for your Jellyfin or Emby media servers without the overhead of heavy component libraries.

## Features

This template comes with the following features:

* **Next.js Pages Router:** Optimized for fast page loads with SSR and static generation.
* **Tailwind CSS:** A utility-first styling architecture that keeps the CSS bundle minimal while supporting custom brand themes, dark mode, and fluid animations.
* **Real-Time WebSockets:** Live session monitoring and immediate UI updates without constant API polling.
* **Modern Tooling:** Toast notifications powered by `sonner` and crisp, consistent iconography via `lucide-react`.
* **Zero-Dependency Hooks:** Custom native React hooks (like `useDebounce`) to handle complex UI states while keeping JavaScript payloads small.
* **Internationalization (i18n):** Localized with `i18next` and `react-i18next`. English (`public/locales/en-US`) is the template for every other language. See [TRANSLATING.md](TRANSLATING.md) to help translate.
* **Gridify Integration:** Advanced, server-side data table sorting and filtering.

## UI kit

All shared UI lives in `components/ui` and is imported from one place:

```tsx
import { Button, Card, Field, Input, Modal, ModalPanel, PageHeader } from "@/components/ui";
```

- **Tokens:** colours are semantic theme tokens defined in `styles/globals.css`:
  - `primary` (purple, main actions and focus);
  - `accent` (cyan, links and highlights);
  - `danger`, `success`, `warning` and `info` for status;
  - `surface`, `surface-raised` and `border` for panels and borders.

  Use these rather than `brand-*`, raw Tailwind palettes or hex values. Charts read the same colours from `chartColors` / `chartSeries`.
- **Look:** kit defaults reproduce the app's original styling.
  - Solid cards are `rounded-2xl`, and `Card variant="glass"` is the translucent, blurred `rounded-3xl` panel.
  - Primary, accent and danger buttons use `font-black`.
  - Modals come in `sm`, `md`, `lg`, `xl` and `workspace`.

  Background and the parts of the audit that were kept are in [UI_AUDIT.md](UI_AUDIT.md).
- **What's in it:**

  | Group | Components |
  |---|---|
  | Primitives | `Button`, `IconButton`, `Input`, `Textarea`, `NumberField`, `Checkbox`, `Switch`, `Badge`, `Spinner`, `Skeleton`, `StatusIndicator` |
  | Forms | `Field` (label + control + error), `Label`, `FieldError`, `Select`, `MultiSelect`, `SegmentedControl`, `DateRangePicker` |
  | Layout | `Page`, `PageHeader`, `SectionTitle`, `Card`, `IconChip` |
  | Overlays | `Modal` + `ModalPanel` / `ModalHeader` / `ModalFooter` / `ModalTitle`, `ConfirmDialog`, `ConfirmButton`, `DropdownMenu`, `Popover` + `PopoverField` / `PopoverPanel` |
  | Data | `Table` parts (incl. `SortableTh`, `TableMessageRow`), `Pagination`, `EmptyState`, `Alert` / `ErrorAlert`, `PieChart` |

- **Rules:**
  - **No translated text inside the kit.** Text arrives through props. App wrappers such as `components/ConfirmationDialogButton.tsx` and `components/ErrorCards/NoData.tsx` supply translated defaults.
  - **Permission checks stay at the call site.**
  - **Overriding styles:** every component accepts `className`, merged last with `cn()`, so a call site can override. Prefer adding a variant over repeating an override.
  - **headlessui:** import it only from the kit. Use the styled components, or the unstyled building blocks in `@/components/ui/headless` for something the styled ones can't do.
- **Enforcement:** `components/ui/__tests__/guard.test.ts` runs with `npm run jest` and fails if app code reintroduces:
  - direct headlessui imports;
  - `brand-*` or raw palette colours;
  - hex colour classes;
  - off-scale radius or weights;
  - `<Loader2>` spinners;
  - class names built at runtime (`` `bg-${x}` ``), which Tailwind can't see.

## npm scripts

### Build and dev scripts

- `dev` – start dev server
- `build` – bundle application for production
- `export` – exports static website to `out` folder
- `analyze` – analyzes application bundle with [@next/bundle-analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)

### Testing scripts

- `typecheck` – checks TypeScript types
- `lint` – runs oxlint and stylelint
- `format:test` – checks files with oxfmt
- `jest` – runs jest tests
- `jest:watch` – starts jest watch
- `test` – runs `jest`, `format:test`, `lint` and `typecheck` scripts

### Other scripts

- `storybook` – starts storybook dev server
- `storybook:build` – build production storybook bundle to `storybook-static`
- `format:write` – formats all files with oxfmt

## License

Jellystat UI is licensed under the [GNU General Public License v3.0](LICENSE). Contributions, including translations, are accepted under the same license.

The project started from the [Mantine Next.js template](https://github.com/mantinedev/next-app-template) by Vitaly Rtischev, which is MIT licensed. Its notice is kept in [LICENSES/mantine-next-template-MIT.txt](LICENSES/mantine-next-template-MIT.txt).
