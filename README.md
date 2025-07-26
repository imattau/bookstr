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
- **NIP‑07 wallet support** – connect to browser wallets to sign events without
  exposing your keys.
- **Remote signing** – optionally delegate signing to an external signer for
  better key security.
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
   The generated files in `dist/` can be served with any static server. During
   this step `vite-plugin-pwa` injects a precache manifest into `src/sw.ts` and
   outputs the compiled service worker as `dist/sw.js`.
4. If no NIP‑07 wallet is detected, you can still log in by pasting your
   private key into the login screen to sign events manually.

This repository does not yet include a fully configured build system; it is
just the beginning of an implementation, so feel free to use any bundler you
like.

## Development Scripts

The project includes a couple of npm scripts to help with code quality:

```bash
npm run lint    # run ESLint on the source files
npm run format  # format files with Prettier
```

## Build and Deployment

Run the helper script to install dependencies, execute tests, build the static
site and create a Docker image:

```bash
./scripts/build_and_deploy.sh
```

Once built, start the container with:

```bash
docker run -p 3000:3000 bookstr:latest
```

The application will be available at <http://localhost:3000>.

### Zap Flow (NIP-57)

Bookstr implements lightning zaps following [NIP-57](https://github.com/nostr-protocol/nips/blob/master/57.md). The flow is:

1. Load the recipient's lightning address from their profile and query the lnurl-pay endpoint.
2. Construct a **zap request** event (kind `9734`) containing `p`, `e`, `relays` and `amount` tags. The event is signed and published to the current relays.
3. Send the zap request to the lnurl callback using the `nostr` query parameter to fetch the invoice.
4. Pay the invoice with WebLN if available or by opening a `lightning:` URL.
5. After payment, listen for the `9735` zap receipt event (matched by the invoice's `bolt11` tag) and complete the zap once it arrives.

Following this sequence allows compatible clients to interoperate when sending and receiving zaps.
