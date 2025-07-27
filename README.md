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

## Settings

Open the profile settings from the library screen to configure the app:

- **Theme** – pick one of the preset palettes via the theme selector.
- **Yearly reading goal** – store your annual goal which updates progress in the library view.
- **Clear Cached Books** – remove any books saved for offline reading.

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

For a step-by-step guide on using the book publishing wizard, see
[docs/first_publish.md](docs/first_publish.md).
To learn more about sending lightning zaps, read
[docs/zapping.md](docs/zapping.md).
For details on the HTML permitted in Markdown, see
[docs/allowed_html.md](docs/allowed_html.md).

## Nostr Features

Read about managing relays, creating delegation tags and using the chat modals in
[docs/nostr_features.md](docs/nostr_features.md).

The build setup is now complete and consists of the following steps:

1. Run `npm test` to execute the unit tests.
2. Build the production bundle with `npm run build`. During this step
   `vite-plugin-pwa` injects the precache manifest and bundles `src/sw.ts`
   as `dist/sw.js`.
3. The Node API server in `server/index.js` serves the compiled files and
   handles the `/api` routes. It is included in the Docker image described
   below.

## Development Scripts

The project includes a couple of npm scripts to help with code quality:

```bash
npm run lint    # run ESLint on the source files
npm run format  # format files with Prettier
```

## Build and Deployment

The application can be built and containerised with Docker.

1. Install dependencies and run the tests:
   ```bash
   npm install
   npm test
   ```
2. Create the production build (including the bundled service worker):
   ```bash
   npm run build
   ```
3. Build the Docker image which packages the API server and the compiled
   assets:
   ```bash
   docker build -t bookstr:latest .
   ```
4. Start the container:
   ```bash
   docker run -p 3000:3000 bookstr:latest
   ```
   The application will be available at <http://localhost:3000>.

All of the above steps are automated by the helper script:

```bash
./scripts/build_and_deploy.sh
```

### API Server Configuration

The Docker image includes a Node server that serves the static frontend and
handles `POST /api/action` and `POST /api/event` requests. The server listens on
port `3000` by default. Set the `PORT` environment variable to run on a
different port:

```bash
docker run -e PORT=8080 -p 8080:8080 bookstr:latest
```

This starts the API server on port 8080 while still serving the compiled web
app.

Relay and pruning settings for the server live in `server/config.js`. Each relay
entry specifies its `url`, whether it `supportsNip27`, and how many
`retentionDays` of history it keeps. The `prunePolicy` object defines the minimum
number of days to keep when forwarding events. Only relays that support NIP‑27
and whose retention is greater than or equal to `prunePolicy.minimumDays` will
receive published events.

### Environment Variables

The frontend reads certain configuration from Vite environment variables:

- `VITE_RELAY_URLS` – comma separated list of default Nostr relay URLs.
- `VITE_API_BASE` – base path for API requests (defaults to `/api`).

The API server also honours `API_BASE` to match the frontend and `PORT` for
the listening port.

### Event History Cache

Bookstr keeps an IndexedDB pointer for each record it indexes. Before requesting
events from relays the application loads the pointer and only asks for events
newer than the cached ID. A background worker defined in
`src/workers/historyBackup.ts` continues fetching the rest of the history and
stores it locally.

### Zap Flow (NIP-57)

Bookstr implements lightning zaps following [NIP-57](https://github.com/nostr-protocol/nips/blob/master/57.md). The flow is:

1. Load the recipient's lightning address from their profile and query the lnurl-pay endpoint.
2. Construct a **zap request** event (kind `9734`) containing `p`, `e`, `relays` and `amount` tags. The event is signed and published to the current relays.
3. Send the zap request to the lnurl callback using the `nostr` query parameter to fetch the invoice.
4. Pay the invoice with WebLN if available or by opening a `lightning:` URL.
5. After payment, listen for the `9735` zap receipt event (matched by the invoice's `bolt11` tag) and complete the zap once it arrives.

Following this sequence allows compatible clients to interoperate when sending and receiving zaps.
