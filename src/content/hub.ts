// Ratgeber-Übersicht: alle Ratgeber nach Aufgabe geordnet (Hub-Seite für interne Verlinkung und Antwortmaschinen).
import type { PageKey } from '../i18n/routes';

export const HUB = {
  de: {
    title: 'Ratgeber: Google Kalender importieren, aufteilen, löschen',
    description: 'Alle Ratgeber zum Import in Google Kalender: Datei zu groß, CSV-Fehler, ICS importieren, aufteilen, doppelte Termine, Import rückgängig.',
    h1: 'Ratgeber zu Google Kalender',
    answer: 'Hier findest du alle Anleitungen des ICS Editors, nach Aufgabe geordnet. Jede beruht auf Googles eigener Hilfe, nennt ihre Quellen und zeigt die Schritte mit Bildern.',
    groups: [
      { h2: 'Datei zu groß oder zu viele Termine', keys: ['tooLarge', 'importParts', 'split', 'limits'] },
      { h2: 'Formate: ICS, CSV und Excel', keys: ['ics', 'outlook', 'apple', 'importFails', 'convert', 'excel'] },
      { h2: 'Aufräumen', keys: ['undo', 'dupes'] }
    ] as { h2: string; keys: PageKey[] }[]
  },
  en: {
    title: 'Guides: import, split and clean up Google Calendar',
    description: 'All guides on importing into Google Calendar: file too large, CSV errors, ICS import, splitting, duplicate events and undoing an import.',
    h1: 'Google Calendar guides',
    answer: 'All ICS Editor guides in one place, grouped by task. Each one is based on Google’s own help pages, lists its sources and shows the steps with screenshots.',
    groups: [
      { h2: 'File too large or too many events', keys: ['tooLarge', 'importParts', 'split', 'limits'] },
      { h2: 'Formats: ICS, CSV and Excel', keys: ['ics', 'outlook', 'apple', 'importFails', 'convert', 'excel'] },
      { h2: 'Cleaning up', keys: ['undo', 'dupes'] }
    ] as { h2: string; keys: PageKey[] }[]
  }
};
