/**
 * Application entry point that mounts the root React tree.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './index';
import { registerServiceWorker } from './registerSw';
import { NostrProvider } from './nostr';
import { WalletProvider } from './WalletConnect';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <NostrProvider>
      <WalletProvider>
        <App />
      </WalletProvider>
    </NostrProvider>,
  );
}

registerServiceWorker();
