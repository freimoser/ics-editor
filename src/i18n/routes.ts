// Seiten und ihre Adressen je Sprache. Alle Adressen relativ zum Basis-Pfad, immer mit Schrägstrich am Ende.

export type Lang = 'de' | 'en';
export const SITE = 'https://freimoser.github.io';
export const BASE = '/ics-editor/';

export const ROUTES = {
  home: { de: '', en: 'en/' },
  limits: { de: 'google-kalender-limits/', en: 'en/google-calendar-limits/' },
  tooLarge: { de: 'google-kalender-datei-zu-gross/', en: 'en/google-calendar-import-file-too-large/' },
  importFails: { de: 'csv-datei-kann-nicht-importiert-werden/', en: 'en/cant-import-csv-to-google-calendar/' },
  split: { de: 'google-kalender-aufteilen/', en: 'en/split-google-calendar/' },
  importParts: { de: 'kalender-in-teilen-importieren/', en: 'en/import-calendar-in-parts/' },
  excel: { de: 'excel-geburtstagsliste-google-kalender/', en: 'en/excel-to-google-calendar/' },
  ics: { de: 'ics-datei-google-kalender-importieren/', en: 'en/import-ics-file-to-google-calendar/' },
  convert: { de: 'csv-in-ics-umwandeln/', en: 'en/csv-to-ics-converter/' },
  dupes: { de: 'google-kalender-doppelte-termine/', en: 'en/google-calendar-duplicate-events/' },
  undo: { de: 'google-kalender-import-rueckgaengig/', en: 'en/undo-google-calendar-import/' },
  guides: { de: 'ratgeber/', en: 'en/guides/' },
  glossary: { de: 'ics-glossar/', en: 'en/ics-glossary/' },
  about: { de: 'ueber/', en: 'en/about/' },
  imprint: { de: 'impressum/', en: 'en/legal-notice/' },
  privacy: { de: 'datenschutz/', en: 'en/privacy/' },
  terms: { de: 'nutzungsbedingungen/', en: 'en/terms/' }
} as const;

export type PageKey = keyof typeof ROUTES;

export const GUIDES: PageKey[] = ['tooLarge', 'importParts', 'importFails', 'split', 'limits', 'ics', 'excel', 'convert', 'undo', 'dupes'];
export const LEGAL: PageKey[] = ['imprint', 'privacy', 'terms'];
/** indexierbare Infoseiten außerhalb der Ratgeber */
export const INFO: PageKey[] = ['guides', 'glossary', 'about'];

/** Pfad mit Basis, z. B. /ics-editor/en/ */
export function path(key: PageKey, lang: Lang): string {
  return BASE + ROUTES[key][lang];
}

/** Absolute Adresse für Canonical, hreflang und Sitemap. */
export function url(key: PageKey, lang: Lang): string {
  return SITE + path(key, lang);
}

export function asset(p: string): string {
  return BASE + p.replace(/^\//, '');
}
