# bookstr

This repository contains a small React + TypeScript playground implementing
a few pieces of the **Bookstr PWA UI Specification**. It uses Tailwind CSS
with design tokens defined in `src/designTokens.css`.

Currently the project only provides a minimal `AppShell`, a `Header`, a
`BottomNav`, and other basic components. The layout and theming follow the
specification but functionality is limited. The navigation now includes a
`Home` tab that aggregates posts and announcements from people you follow.

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
- **Home tab** – catch up on activity from followed authors in a unified feed.
- **Book publishing** – the `BookPublishWizard` creates chapter events and a
  table-of-contents so books can be read one chapter at a time. An
  auto-announcement toggle lets you broadcast new releases when publishing.
- **Reading progress indicators** – the reader toolbar displays your current
  percentage with **Previous chapter** and **Next chapter** controls, and book
  cards show a small progress bar.
- **Background library sync** – newly followed authors have their book lists
  fetched in the background and merged into your library.
- **Follow/relay sync** – relay URLs from people you follow can be merged into
  your own list so it stays consistent across devices.
- **List publishing** – create private (`kind 10003`) or public (`kind 30004`)
  book collections from `/lists/new`. Lists you own appear on your profile with
  quick links to edit them.
- **Book detail pages** – each book has a dedicated screen with metadata,
  chapters and reader progress.
- **Reviews** – readers can publish reviews that appear alongside book
  details.
- **Profiles** – visit an author's profile to browse their books, lists and
  contact information.
- **Reading lists** – maintain curated collections of books that can be shared
  or kept private.
- **Relay settings** – manage the relays the app connects to and merge new ones
  from the people you follow.

## Screens

### Book Detail

Selecting a book opens a detail page showing its cover, description, table of
contents and your current reading progress. From here you can jump directly to
chapters or leave a review.

### Reviews

Reviews are short notes attached to a book. They use standard Nostr `kind
30023` events so other clients can index them. The detail page shows the latest
reviews with links to the reviewers' profiles.

### Profiles

Profiles aggregate an author's books, reading lists and relay recommendations.
Following a profile merges their suggested relays and lists into your own
library.

### Reading Lists

Create and manage lists of books from `/lists/new`. Lists can be public
(`kind 30004`) or private (`kind 10003`) and are displayed on your profile. Use
lists to group related titles or plan future reading.

### Relay Settings

The settings screen includes a relay manager where you can add or remove relay
URLs. Relay lists can be bulk imported from people you follow so your
configuration stays consistent across devices.

## Settings

Open the profile settings from the library screen to configure the app:

- **Theme** – pick one of the preset palettes via the theme selector.
- **Yearly reading goal** – store your annual goal which updates progress in the library view.
- **Clear Cached Books** – remove any books saved for offline reading.
- **Relays** – the dedicated relay settings page lets you add or remove relay
  URLs and bulk add them from people you follow. Updates are saved so your
  relay list remains in sync.

## Getting Started

1. Ensure you are running **Node.js 20** or later.
2. Copy `.env.example` to `.env` and edit the values for your environment. At a
   minimum set `VITE_RELAY_URLS` and `VITE_API_BASE`.
3. Install dependencies
   ```bash
   npm install
   ```
4. Start a development server. If you use [Vite](https://vitejs.dev/) you can
   run:
   ```bash
   npx vite
   ```
   The entry point is `src/main.tsx`.
5. Build the PWA for production. With Vite the build command is:
   ```bash
   npx vite build
   ```
   The generated files in `dist/` can be served with any static server. During
   this step `vite-plugin-pwa` injects a precache manifest into `src/sw.ts` and
   outputs the compiled service worker as `dist/sw.js`.
6. If no NIP‑07 wallet is detected, you can still log in by pasting your
   private key into the login screen to sign events manually.

For a step-by-step guide on using the book publishing wizard, see
[docs/first_publish.md](docs/first_publish.md).
To learn more about sending lightning zaps, read
[docs/zapping.md](docs/zapping.md).
For details on the HTML permitted in Markdown, see
[docs/allowed_html.md](docs/allowed_html.md).

## Nostr Features

Read about managing relays, creating delegation tags, configuring search relays and using the chat modals in
[docs/nostr_features.md](docs/nostr_features.md).

Bookstr looks for a user's published lists to discover more of their content:

- **kind `10002`** lists the relays a user writes to.
- **kind `10003`** stores bookmarks.
- **kind `30004`** captures their curation sets.
- **kind `10007`** enumerates search relays. See the [Search Relays section](docs/nostr_features.md#search-relays).
The app loads these when viewing a profile so your library includes books and
relays the author recommends.

Long‑form posts (`kind:30023`) are deduplicated by the `d` tag per
[NIP‑23](https://github.com/nostr-protocol/nips/blob/master/23.md) so only the
newest version of a piece appears in feeds.

## Extending Nostr Integration

The Nostr logic lives under `src/nostr`. Modules in this folder manage
connections, signing and event handling. To extend the integration, add new
helpers there or create custom hooks that compose existing ones. Components can
subscribe to additional kinds by importing these utilities and publishing or
listening for the required events.

### Configuring Default Relays

Client defaults are controlled via the `VITE_RELAY_URLS` environment variable
which lists the starting set of relays. The Node API server reads the same
setting from `server/config.js` so both client and server share a baseline.
Users can further refine their list in the **Relay Settings** screen.

The build setup is now complete and consists of the following steps:

1. Run `npm test` to execute the unit tests.
2. Build the production bundle with `npm run build`. During this step
   `vite-plugin-pwa` injects the precache manifest and bundles `src/sw.ts`
   as `dist/sw.js`.
3. The Node API server in `server/index.js` serves the compiled files and
   handles the `/api` routes. It is included in the container image described
   below.

## Development Scripts

The project includes a couple of npm scripts to help with code quality:

```bash
npm run lint    # run ESLint on the source files
npm run format  # format files with Prettier
```

## Build and Deployment

The application can be built and containerised with Docker or Podman.

1. Install dependencies and run the tests:
   ```bash
   npm install
   npm test
   ```
2. Create the production build (including the bundled service worker):
   ```bash
   npm run build
   ```
3. Build the container image which packages the API server and the compiled
   assets:
   ```bash
   podman build -t bookstr:latest .
   ```
   (use `docker build` if using Docker)
4. Start the container:
   ```bash
   podman run -p 3000:3000 bookstr:latest
   ```
   (replace `podman` with `docker` if using Docker)
   The application will be available at <http://localhost:3000>.

All of the above steps are automated by the helper script:

```bash
./scripts/build_and_deploy.sh
```

This script assumes `node_modules` is absent and installs dependencies with
`npm ci`.

### API Server Configuration

The container image includes a Node server that serves the static frontend and
handles `POST /api/action` and `POST /api/event` requests. The server listens on
port `3000` by default. Set the `PORT` environment variable to run on a
different port:

```bash
podman run -e PORT=8080 -p 8080:8080 bookstr:latest
```
(use `docker run` if using Docker)

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

Copy `.env.example` to `.env` and adjust the values to configure your
environment.

If you want to run the full setup with one command, execute:

```bash
./scripts/bootstrap.sh
```

This installs dependencies with `npm ci`, creates the `.env` file if it does
not exist, runs the tests and builds the production bundle.

### Development with Docker Compose

Launch the API server and Vite dev server together:

```bash
docker compose up
```

Podman users can run `podman compose up`. The `docker-compose.yml` file omits
the `version` key for compatibility with both tools.

The API server listens on <http://localhost:3000> while the frontend is served
by Vite on <http://localhost:5173>. Source files are mounted so changes trigger
live reload.

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
