// ICS-Glossar: kurze, zitierfähige Definitionen. Quelle: RFC 5545 (iCalendar), für Google-Angaben die Google-Hilfe.
// Verweise wie in den Ratgebern: {seite|Ankertext}.
import type { SourceKey } from './sources';

export interface Term { id: string; term: string; de: string; en: string; src: SourceKey }

export const GLOSSARY_PAGE = {
  de: {
    title: 'ICS-Glossar: VEVENT, RRULE, UID & Co. einfach erklärt',
    description: 'Die wichtigsten Begriffe aus ICS-Dateien in einem Satz erklärt: VCALENDAR, VEVENT, UID, DTSTART, RRULE, VTIMEZONE, Zeilenfaltung und mehr.',
    h1: 'ICS-Glossar: Begriffe aus Kalenderdateien erklärt',
    answer: 'Eine ICS-Datei ist reiner Text nach dem Standard iCalendar (RFC 5545). Hier steht jeder Begriff, der dir beim Öffnen einer ICS-Datei begegnet, in einem Satz erklärt – mit Beispiel.'
  },
  en: {
    title: 'ICS Glossary: VEVENT, RRULE, UID & More Explained',
    description: 'The key terms in ICS files explained in one sentence each: VCALENDAR, VEVENT, UID, DTSTART, RRULE, VTIMEZONE, line folding and more.',
    h1: 'ICS glossary: calendar file terms explained',
    answer: 'An ICS file is plain text following the iCalendar standard (RFC 5545). Every term you’ll come across when you open an ICS file is explained here in one sentence – with an example.'
  }
};

export const TERMS: Term[] = [
  { id: 'ics', term: 'ICS / iCalendar', src: 'rfc5545',
    de: 'Textformat für Kalenderdaten nach RFC 5545; Dateien enden auf <code>.ics</code> und lassen sich in Google Kalender, Outlook und Apple Kalender importieren. Bearbeiten: {ics|ICS-Datei importieren}.',
    en: 'Text format for calendar data defined in RFC 5545; files end in <code>.ics</code> and can be imported into Google Calendar, Outlook and Apple Calendar. See {ics|import an ICS file}.' },
  { id: 'vcalendar', term: 'VCALENDAR', src: 'rfc5545',
    de: 'Der Rahmen um alle Inhalte: Jede ICS-Datei beginnt mit <code>BEGIN:VCALENDAR</code>, endet mit <code>END:VCALENDAR</code> und nennt darin <code>VERSION:2.0</code> und das erzeugende Programm (<code>PRODID</code>).',
    en: 'The wrapper around everything: every ICS file starts with <code>BEGIN:VCALENDAR</code>, ends with <code>END:VCALENDAR</code> and states <code>VERSION:2.0</code> and the producing program (<code>PRODID</code>).' },
  { id: 'vevent', term: 'VEVENT', src: 'rfc5545',
    de: 'Ein einzelner Termin zwischen <code>BEGIN:VEVENT</code> und <code>END:VEVENT</code>; eine Datei kann Tausende davon enthalten.',
    en: 'A single event between <code>BEGIN:VEVENT</code> and <code>END:VEVENT</code>; a file can contain thousands of them.' },
  { id: 'uid', term: 'UID', src: 'rfc5545',
    de: 'Die weltweit eindeutige Kennung eines Termins, z. B. <code>UID:abc123@example.com</code>. Alle Teile einer Serie teilen sich dieselbe UID – deshalb hält der ICS Editor sie beim {tooLarge|Aufteilen} in derselben Datei.',
    en: 'The globally unique identifier of an event, e.g. <code>UID:abc123@example.com</code>. All parts of a series share the same UID – that’s why the ICS Editor keeps them in the same file when {tooLarge|splitting}.' },
  { id: 'dtstart', term: 'DTSTART / DTEND', src: 'rfc5545',
    de: 'Beginn und Ende eines Termins, z. B. <code>DTSTART:20261026T090000Z</code> (das <code>Z</code> steht für UTC). Bei ganztägigen Terminen steht <code>VALUE=DATE</code>, und das Ende ist der Tag <em>nach</em> dem letzten Tag.',
    en: 'Start and end of an event, e.g. <code>DTSTART:20261026T090000Z</code> (the <code>Z</code> means UTC). All-day events use <code>VALUE=DATE</code>, and the end is the day <em>after</em> the last day.' },
  { id: 'dtstamp', term: 'DTSTAMP', src: 'rfc5545',
    de: 'Pflichtangabe in jedem Termin: der Zeitpunkt, zu dem dieser Datensatz erzeugt wurde – nicht der Termin selbst.',
    en: 'Required in every event: the time this record was created – not the time of the event itself.' },
  { id: 'rrule', term: 'RRULE', src: 'rfc5545',
    de: 'Die Wiederholungsregel einer Serie, z. B. <code>RRULE:FREQ=YEARLY</code> für jährliche Geburtstage oder <code>FREQ=WEEKLY;BYDAY=MO</code> für jeden Montag.',
    en: 'The recurrence rule of a series, e.g. <code>RRULE:FREQ=YEARLY</code> for yearly birthdays or <code>FREQ=WEEKLY;BYDAY=MO</code> for every Monday.' },
  { id: 'exdate', term: 'EXDATE', src: 'rfc5545',
    de: 'Einzelne Tage, die aus einer Serie ausgenommen sind – etwa ein ausgefallener Termin.',
    en: 'Individual dates excluded from a series – such as a cancelled occurrence.' },
  { id: 'recurrence-id', term: 'RECURRENCE-ID', src: 'rfc5545',
    de: 'Kennzeichnet einen geänderten Einzeltermin einer Serie; er hat dieselbe UID wie die Serie und ersetzt das ursprüngliche Vorkommen.',
    en: 'Marks a changed single occurrence of a series; it has the same UID as the series and replaces the original occurrence.' },
  { id: 'vtimezone', term: 'VTIMEZONE / TZID', src: 'rfc5545',
    de: 'Beschreibt eine Zeitzone samt Sommer- und Winterzeit; Termine verweisen mit <code>TZID=Europe/Berlin</code> darauf.',
    en: 'Describes a time zone including daylight saving time; events refer to it with <code>TZID=Europe/Berlin</code>.' },
  { id: 'status', term: 'STATUS', src: 'rfc5545',
    de: 'Zustand eines Termins: <code>CONFIRMED</code> (bestätigt), <code>TENTATIVE</code> (vorläufig) oder <code>CANCELLED</code> (abgesagt). Abgesagte Termine kann der ICS Editor beim Export weglassen.',
    en: 'State of an event: <code>CONFIRMED</code>, <code>TENTATIVE</code> or <code>CANCELLED</code>. The ICS Editor can leave out cancelled events on export.' },
  { id: 'folding', term: 'Zeilenfaltung', src: 'rfc5545',
    de: 'Zeilen in ICS-Dateien sollen höchstens 75 Byte lang sein; längere werden umbrochen, und die Fortsetzung beginnt mit einem Leerzeichen. Zeilenenden sind CRLF.',
    en: 'Lines in ICS files should be at most 75 octets long; longer ones are wrapped, and the continuation starts with a space. Line endings are CRLF.' },
  { id: 'google-csv', term: 'Google-CSV', src: 'import',
    de: 'Tabellenformat für den Import in Google Kalender: Komma als Trennzeichen, englische Spaltennamen, Pflicht sind nur „Subject“ und „Start Date“. Siehe {importFails|CSV-Import scheitert}.',
    en: 'Spreadsheet format for importing into Google Calendar: commas as separators, English column names, only “Subject” and “Start Date” are required. See {importFails|can’t import CSV}.' },
  { id: 'one-mb', term: '1-MB-Grenze', src: 'problems',
    de: 'Google Kalender importiert nur Dateien bis 1 MB; größere scheitern mit „Google Calendar is temporarily unavailable“. Lösung: {tooLarge|Datei aufteilen}.',
    en: 'Google Calendar only imports files up to 1 MB; larger ones fail with “Google Calendar is temporarily unavailable”. Fix: {tooLarge|split the file}.' }
];

/** englische Begriffsnamen, wo sie vom deutschen abweichen */
export const TERM_EN: Record<string, string> = { folding: 'Line folding', 'google-csv': 'Google CSV', 'one-mb': '1 MB limit' };
