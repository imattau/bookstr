import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './index';
import { registerServiceWorker } from './registerSw';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<App />);
}

registerServiceWorker();
