import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import { GA4_ID, GA_HOSTS } from './src/config/analytics.mjs';

// Einzige erlaubte Verbindung: die öffentliche robots.txt der Domain (Suchmaschinen-Prüfungen wie Lighthouse
// lesen sie aus dem Seitenkontext). Für lokale Messungen kann LOCAL_ROBOTS=http://localhost:4321/robots.txt gesetzt werden.
const ROBOTS = ['https://freimoser.github.io/robots.txt', process.env.LOCAL_ROBOTS].filter(Boolean).join(' ');
// Google Analytics nur, wenn eine Mess-ID gesetzt ist; geladen wird es trotzdem erst nach Einwilligung.
const GA = (k) => (GA4_ID ? ' ' + GA_HOSTS[k].join(' ') : '');

// GitHub Pages: https://freimoser.github.io/ics-editor/
export default defineConfig({
  site: 'https://freimoser.github.io',
  base: '/ics-editor/',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [preact()],
  vite: { worker: { format: 'es' } },
  security: {
    // Astro ergänzt script-src und style-src mit Hashes. connect-src erlaubt nur die robots.txt und – falls eine
    // Mess-ID gesetzt ist – Google Analytics. Andere Adressen kann die Seite (und der Worker) nicht erreichen.
    csp: {
      directives: [
        "default-src 'self'",
        `img-src 'self' data: blob:${GA('img')}`,
        "font-src 'self'",
        `connect-src ${ROBOTS}${GA('connect')}`,
        "worker-src 'self' blob:",
        "manifest-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'none'"
      ],
      scriptDirective: { resources: ["'self'", ...(GA4_ID ? GA_HOSTS.script : [])] }
    }
  }
});
