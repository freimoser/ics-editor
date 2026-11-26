// Ratgeber-Übersicht: alle Ratgeber nach Aufgabe geordnet (Hub-Seite für interne Verlinkung und Antwortmaschinen).
import type { PageKey } from '../i18n/routes';

export const HUB = {
  de: {
    title: 'Ratgeber: Google Kalender importieren, aufteilen, löschen',
    description: 'Alle Ratgeber zum Import in Google Kalender: Datei zu groß, CSV-Fehler, ICS importieren, aufteilen, doppelte Termine, Import rückgängig.',
    h1: 'Ratgeber zu Google Kalender',
    answer: 'Hier findest du alle Anleitungen des ICS Editors, nach Aufgabe geordnet. Jede beginnt mit der direkten Antwort, führt Schritt für Schritt durch die Lösung und verlinkt ihre Quellen – die Hilfe von Google, Microsoft oder Apple. Wo wir selbst getestet haben, stehen die Messwerte dabei.',
    groups: [
      { h2: 'Datei zu groß oder zu viele Termine', intro: 'Meldet Google „temporarily unavailable“, beginne mit „Datei zu groß“. Hast du die Teile schon, hilft „In Teilen importieren“. Willst du einen Kalender nach Themen trennen, lies „Kalender aufteilen“. Alle Grenzen auf einen Blick stehen unter „Limits“.', keys: ['tooLarge', 'importParts', 'split', 'limits'] },
      { h2: 'Formate: ICS, CSV und Excel', intro: 'Du willst nur sehen, was in einer Datei steht? „ICS-Datei öffnen“. Du ziehst von Outlook oder Apple um oder willst beide Kalender verbinden? Die beiden Umzugs-Ratgeber erklären Import und Abo. Für Tabellen sind die drei CSV- und Excel-Ratgeber da.', keys: ['open', 'ics', 'gexport', 'outlook', 'apple', 'importFails', 'convert', 'excel'] },
      { h2: 'Aufräumen', intro: 'Ein Import ging schief? „Import rückgängig“. Termine stehen doppelt? „Doppelte Termine“. Termine sollen in einen anderen Kalender? „Termine verschieben“.', keys: ['move', 'undo', 'dupes'] }
    ] as { h2: string; intro: string; keys: PageKey[] }[]
  },
  en: {
    title: 'Guides: import, split and clean up Google Calendar',
    description: 'All guides on importing into Google Calendar: file too large, CSV errors, ICS import, splitting, duplicate events and undoing an import.',
    h1: 'Google Calendar guides',
    answer: 'All ICS Editor guides in one place, grouped by task. Each one starts with the direct answer, walks you through the fix step by step and links its sources – Google’s, Microsoft’s or Apple’s help. Where we tested things ourselves, the numbers are included.',
    groups: [
      { h2: 'File too large or too many events', intro: 'If Google says “temporarily unavailable”, start with “File too large”. Already have the parts? “Import in parts” helps. Want to separate a calendar by topic? Read “Split a calendar”. Every limit at a glance is under “Limits”.', keys: ['tooLarge', 'importParts', 'split', 'limits'] },
      { h2: 'Formats: ICS, CSV and Excel', intro: 'Just want to see what’s in a file? “Open an ICS file”. Moving from Outlook or Apple, or connecting both calendars? The two moving guides cover import and subscription. For spreadsheets, there are three CSV and Excel guides.', keys: ['open', 'ics', 'gexport', 'outlook', 'apple', 'importFails', 'convert', 'excel'] },
      { h2: 'Cleaning up', intro: 'An import went wrong? “Undo an import”. Events show up twice? “Duplicate events”. Events need to go to another calendar? “Move events”.', keys: ['move', 'undo', 'dupes'] }
    ] as { h2: string; intro: string; keys: PageKey[] }[]
  }
};
