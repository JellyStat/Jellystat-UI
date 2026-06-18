# Jellystat Web UI

A fast, responsive, and lightweight web dashboard for [Jellystat](https://github.com/CyferShepard/Jellystat). Built with Next.js and Tailwind CSS, this interface is designed to provide real-time telemetry, user management, and activity tracking for your Jellyfin or Emby media servers without the overhead of heavy component libraries.

## Features

This template comes with the following features:

* **Next.js Pages Router:** Optimized for fast page loads with SSR and static generation.
* **Tailwind CSS:** A utility-first styling architecture that keeps the CSS bundle minimal while supporting custom brand themes, dark mode, and fluid animations.
* **Real-Time WebSockets:** Live session monitoring and immediate UI updates without constant API polling.
* **Modern Tooling:** Toast notifications powered by `sonner` and crisp, consistent iconography via `lucide-react`.
* **Zero-Dependency Hooks:** Custom native React hooks (like `useDebounce`) to handle complex UI states while keeping JavaScript payloads small.
* **Internationalization (i18n):** Built-in localization support using `next-i18next`.
* **Gridify Integration:** Advanced, server-side data table sorting and filtering.

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
