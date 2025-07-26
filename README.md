# bookstr

This repository contains a small React + TypeScript playground implementing
a few pieces of the **Bookstr PWA UI Specification**. It uses Tailwind CSS
with design tokens defined in `src/designTokens.css`.

Currently the project only provides a minimal `AppShell`, a `Header`, a
`BottomNav`, and other basic components. The layout and theming follow the
specification but functionality is limited.

## Features

- **Nostr integration** – the app can log in with a Nostr private key and uses
  it to load contacts, bookmarks and publish events.
- **Theming** – choose between several preset palettes via `ThemeProvider` with
  support for `dark`, `earthy`, `vibrant` and `pastel` modes.
- **Service worker** – `src/sw.ts` provides offline caching and background sync
  for a Progressive Web App.

## Getting Started

1. Install dependencies
   ```bash
   npm install
   ```
2. Start a development server. If you use [Vite](https://vitejs.dev/) you can
   run:
   ```bash
   npx vite
   ```
   The entry point is `src/main.tsx`.
3. Build the PWA for production. With Vite the build command is:
   ```bash
   npx vite build
   ```
   The generated files in `dist/` can be served with any static server.

This repository does not yet include a fully configured build system; it is
just the beginning of an implementation, so feel free to use any bundler you
like.

## Development Scripts

The project includes a couple of npm scripts to help with code quality:

```bash
npm run lint    # run ESLint on the source files
npm run format  # format files with Prettier
```
