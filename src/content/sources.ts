// Belegte Quellen. Google-Quellen zuletzt live geprüft am 4.11.2026 – nur diese Fakten werden auf der Website behauptet.
/** Datum, an dem die Google-Quellen geprüft wurden */
export const STAND = { de: '4. November 2026', en: '4 November 2026', iso: '2026-11-04' };

/** Eigener Test mit einem echten, anonymen Google-Kalender-Export (nur lokal ausgewertet, ohne Namen) */
export const OWN_TEST = { date: { de: 'Oktober 2026', en: 'October 2026' } };

export const SRC = {
  import: { url: 'https://support.google.com/calendar/answer/37118', de: 'Google Kalender-Hilfe: Termine in Google Kalender importieren', en: 'Google Calendar Help: Import events to Google Calendar' },
  problems: { url: 'https://support.google.com/calendar/answer/45654', de: 'Google Kalender-Hilfe: Probleme beim Importieren beheben', en: 'Google Calendar Help: Fix problems importing' },
  limits: { url: 'https://knowledge.workspace.google.com/admin/calendar/avoid-calendar-use-limits', de: 'Google Workspace-Hilfe: Nutzungslimits von Google Kalender vermeiden', en: 'Google Workspace Help: Avoid Calendar use limits' },
  create: { url: 'https://support.google.com/calendar/answer/37095', de: 'Google Kalender-Hilfe: Neuen Kalender erstellen', en: 'Google Calendar Help: Create a new calendar' },
  delete: { url: 'https://support.google.com/calendar/answer/37188', de: 'Google Kalender-Hilfe: Kalender löschen oder abbestellen', en: 'Google Calendar Help: Delete or unsubscribe from a calendar' },
  outlook: { url: 'https://support.microsoft.com/en-us/outlook/export-an-outlook-calendar-to-google-calendar', de: 'Microsoft Support: Outlook-Kalender nach Google Kalender exportieren', en: 'Microsoft Support: Export an Outlook calendar to Google Calendar' },
  apple: { url: 'https://support.apple.com/guide/calendar/icl1023/mac', de: 'Apple Support: Exportieren oder Importieren von Kalendern auf dem Mac', en: 'Apple Support: Import or export calendars on Mac' },
  gexport: { url: 'https://support.google.com/calendar/answer/37111', de: 'Google Kalender-Hilfe: Termine aus Google Kalender exportieren', en: 'Google Calendar Help: Export events from Google Calendar' },
  transfer: { url: 'https://support.google.com/calendar/answer/78739', de: 'Google Kalender-Hilfe: Kalender oder Termine übertragen', en: 'Google Calendar Help: Transfer calendars or events' },
  excelCsv: { url: 'https://support.microsoft.com/de-de/excel/import-data-from-a-csv-html-or-text-file', de: 'Microsoft Support: Daten aus einer CSV-, HTML- oder Textdatei importieren', en: 'Microsoft Support: Import data from a CSV, HTML or text file' },
  outlookPublish: { url: 'https://support.microsoft.com/en-us/outlook/share-your-calendar-in-outlook-on-the-web', de: 'Microsoft Support: Kalender in Outlook im Web freigeben und veröffentlichen', en: 'Microsoft Support: Share your calendar in Outlook on the web' },
  outlookImport: { url: 'https://support.microsoft.com/en-us/outlook/import-or-subscribe-to-a-calendar-in-outlook-com-or-outlook-on-the-web', de: 'Microsoft Support: Kalender in Outlook.com importieren oder abonnieren', en: 'Microsoft Support: Import or subscribe to a calendar in Outlook.com or Outlook on the web' },
  windowsMail: { url: 'https://support.microsoft.com/en-us/outlook/outlook-for-windows-the-future-of-mail-calendar-and-people-on-windows-11', de: 'Microsoft Support: Outlook für Windows ersetzt Mail und Kalender', en: 'Microsoft Support: Outlook for Windows – the future of Mail, Calendar and People' },
  subscribe: { url: 'https://support.google.com/calendar/answer/37100', de: 'Google Kalender-Hilfe: Kalender anderer abonnieren', en: 'Google Calendar Help: Subscribe to someone else’s calendar' },
  icloudShare: { url: 'https://support.apple.com/guide/icloud/share-a-calendar-mm6b1a9479/icloud', de: 'Apple Support: Kalender auf iCloud.com teilen', en: 'Apple Support: Share a calendar on iCloud.com' },
  rfc5545: { url: 'https://www.rfc-editor.org/rfc/rfc5545', de: 'RFC 5545: iCalendar-Format', en: 'RFC 5545: Internet Calendaring and Scheduling (iCalendar)' }
} as const;

export type SourceKey = keyof typeof SRC;

/** Eindeutige Entitäten für Schema „about“ (Wikidata geprüft am 26.10.2026) – hilft Suchmaschinen und Antwortmaschinen bei der Zuordnung */
export const ENTITIES = {
  gcal: { '@type': 'SoftwareApplication', name: 'Google Calendar', applicationCategory: 'BusinessApplication', sameAs: ['https://www.wikidata.org/wiki/Q223563', 'https://en.wikipedia.org/wiki/Google_Calendar'] },
  ical: { '@type': 'Thing', name: 'iCalendar', sameAs: ['https://www.wikidata.org/wiki/Q284651', 'https://en.wikipedia.org/wiki/ICalendar'] }
};

/** ISO-Datum als lesbares Datum, z. B. „14. Oktober 2026“ / „14 October 2026“ */
export function day(iso: string, lang: 'de' | 'en'): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
/** Letzte inhaltliche Änderung von Startseite und Über-Seite */
export const PAGE_UPDATED = { home: '2026-11-05', about: '2026-11-25', guides: '2026-11-25', glossary: '2026-10-26' };
