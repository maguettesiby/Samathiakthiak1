import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Enregistrer uniquement en production (évite les surprises en dev)
    const env = (import.meta as any)?.env as { PROD?: boolean } | undefined;
    if (env?.PROD) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Ignorer l'échec d'enregistrement (offline-light best effort)
      });
    }
  });
}