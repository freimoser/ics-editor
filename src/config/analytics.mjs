// Google Analytics 4 – einzige Quelle für die Mess-ID (Build, CSP, Banner, Datenschutzerklärung).
// Leer lassen (PUBLIC_GA4_ID=""), dann gibt es weder Banner noch Messung, und die Datenschutzerklärung sagt, dass nicht gemessen wird.
// Geladen wird Google Analytics ausschließlich nach Einwilligung im Banner (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO).
export const GA4_ID = process.env.PUBLIC_GA4_ID ?? 'G-JF1H38P54V';

/** Adressen, die Google Analytics braucht – auch regionale Endpunkte (region1.google-analytics.com). */
export const GA_HOSTS = {
  script: ['https://www.googletagmanager.com'],
  connect: ['https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://*.googletagmanager.com'],
  img: ['https://*.google-analytics.com', 'https://*.googletagmanager.com']
};

/** Schlüssel im lokalen Speicher, unter dem die Entscheidung (granted/denied) mit Zeitpunkt liegt. */
export const CONSENT_KEY = 'ics-editor-consent';
