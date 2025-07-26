import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './index';
import { registerServiceWorker } from './registerSw';
import { NostrProvider } from './nostr';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <NostrProvider>
      <App />
    </NostrProvider>,
  );
}

registerServiceWorker();
