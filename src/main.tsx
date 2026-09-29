import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <App />
  </HashRouter>,
);

// PWA: register the offline-shell service worker (production only).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
