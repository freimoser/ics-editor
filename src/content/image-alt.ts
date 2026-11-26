// Alternativtexte der Bildschirmfotos: beschreiben, was zu sehen ist (für Screenreader, Bildersuche und Antwortmaschinen).
// Die Bildunterschrift je Ratgeber erklärt dagegen, warum das Bild an dieser Stelle hilft.
// Alle Fotos zeigen erfundene Beispieldaten (scripts/screenshots.mjs).

export const IMG_ALT: Record<string, { de: string; en: string }> = {
  start: {
    de: 'Startseite des ICS Editors: gestrichelte Ablagefläche mit „Datei hierher ziehen“, Knopf „Datei auswählen“, darunter die unterstützten Formate und der Hinweis „Bleibt auf deinem Gerät. Nichts wird hochgeladen.“',
    en: 'ICS Editor start page: dashed drop area with “Drop your file here”, a “Choose file” button, the supported formats below and the note that nothing is uploaded.'
  },
  editor: {
    de: 'ICS Editor mit geöffnetem Google-Kalender-Export: links 15 Kalender mit Anzahl der Termine, in der Mitte die Monatsansicht November, rechts ein ausgewählter Termin mit Datum, Uhrzeit und Beschreibung zum Bearbeiten.',
    en: 'ICS Editor with a Google Calendar export open: 15 calendars with event counts on the left, the November month view in the middle, a selected event with date, time and description for editing on the right.'
  },
  overview: {
    de: 'Fenster „Datei-Info“: je Kalender Kacheln für Termine, Zeitraum, Größe, Serien, Anteil mit Beschreibung und Zeitzone, ein Balkendiagramm der Termine pro Jahr sowie Zeilen für abgesagte, doppelte und Termine mit Telefonnummer.',
    en: '“File info” window: for each calendar, tiles for events, date range, size, recurring events, share with description and time zone, a bar chart of events per year, and rows for cancelled, duplicate and events with phone numbers.'
  },
  export: {
    de: 'Fenster „Für Google exportieren“ mit Zeitraum „Ab 2024“: oben die Summe „Passt: 13 Dateien, jede unter 1 MB“, darunter die aufgeklappte Liste der Dateien mit Name, Zahl der Termine, Größe und Zeitraum je Datei.',
    en: '“Export for Google” window with the date range set to start in 2024: the total “Fits: 13 files, each under 1 MB” at the top and the expanded list of files with name, event count, size and date range for each.'
  },
  range: {
    de: 'Fenster „Für Google exportieren“: Zeitraum „Ab 2024“ ausgewählt, darunter „5.806 Termine · 1,4 MB“ und grün „Passt: 14 Dateien, jede unter 1 MB“.',
    en: '“Export for Google” window: date range starting in 2024 selected, below it “5,806 events · 1.4 MB” and in green “Fits: 14 files, each under 1 MB”.'
  },
  clean: {
    de: 'Exportfenster mit aufgeklappten „Mehr Optionen“: Häkchen bei „Technische Zusatzdaten“ und „Abgesagte Termine“, daneben die Anzahl je Option, Format „CSV für Excel“ gewählt.',
    en: 'Export window with “More options” expanded: ticks at “Technical extras” and “Cancelled events”, the count next to each option, format “CSV for Excel” selected.'
  },
  csv: {
    de: 'Exportfenster mit Format „CSV für Excel“: Hinweis „Genau das Format aus Googles Hilfe: englische Spaltennamen, Komma als Trennzeichen“, darüber die Optionen zum Weglassen.',
    en: 'Export window with format “CSV for Excel”: the note “exactly the format from Google’s help: English column names, comma as separator”, with the leave-out options above.'
  },
  dupes: {
    de: 'Exportfenster für eine Beispiel-Praxisdatei: „45 Termine · 9 KB, passt in eine Datei unter 1 MB“, unter „Weglassen“ ist „Doppelte Termine“ mit der Zahl 11 angehakt.',
    en: 'Export window for an example practice file: “45 events · 9 KB, fits in one file under 1 MB”, under “Leave out” the option “Duplicate events” with the number 11 is ticked.'
  },
  parts: {
    de: 'Exportfenster: nur ein Kalender ausgewählt, Hinweis „Wird in 4 Dateien geteilt – höchstens 1 MB und 999 Termine pro Datei“, darunter vier Dateien mit je 999 oder weniger Terminen und ihrem Zeitraum.',
    en: 'Export window: one calendar selected, the note “Split into 4 files – at most 1 MB and 999 events per file”, below four files with 999 or fewer events each and their date range.'
  },
  split: {
    de: 'Fenster „In mehrere Kalender aufteilen“: Liste erkannter Kürzel wie RÖ, BB, NK mit Anzahl der Termine; das erste Kürzel erhält gerade den Namen „Dr. Muster“, unten der Knopf „13 Kalender anlegen“.',
    en: '“Split into several calendars” window: a list of detected initials such as RÖ, BB, NK with event counts; the first is being named “Dr. Muster”, with a “Create 13 calendars” button at the bottom.'
  },
  month: {
    de: 'Monatsansicht nach dem Aufteilen: links die neuen Kalender je Kürzel mit eigener Farbe und Terminzahl, in den Tagesfeldern farbige Punkte vor jedem Termin.',
    en: 'Month view after splitting: the new calendars per set of initials with their own colour and event count on the left, coloured dots in front of each event in the day cells.'
  },
  check: {
    de: 'Fenster „Spalten und Probleme“ für eine CSV-Datei: vier Warnungen mit Zeilennummer, etwa „Zeile 21: Das Datum 31.02.2019 gibt es nicht“, je mit Vorschlag und den Knöpfen „Übernehmen“ und „Termin weglassen“.',
    en: '“Columns and problems” window for a CSV file: four warnings with row numbers, such as “Row 21: the date 31.02.2019 doesn’t exist”, each with a suggestion and the buttons “Apply” and “Leave out event”.'
  },
  privacy: {
    de: 'Abschnitt „Persönliche Daten“: für die Spalten „Patient“, „Telefon“ und „Geburtsdatum“ je die Wahl zwischen Weglassen, Kürzen und Behalten; darunter die Zuordnung der Spalten zu Googles Feldern wie „Start Date“ und „Subject“.',
    en: '“Personal data” section: for columns with patient names, phone numbers and dates of birth, a choice between leave out, shorten and keep; below, the mapping of columns to Google’s fields such as “Start Date” and “Subject”.'
  },
  birthdays: {
    de: 'Listenansicht einer umgewandelten Excel-Geburtstagsliste: ganztägige Termine „Geburtstag: Name (geb. Jahr)“ mit Wiederholungs-Symbol, rechts ein Termin mit „Serie (jährlich)“.',
    en: 'List view of a converted Excel birthday list: all-day events “Birthday: name (born year)” with a repeat icon, and on the right one event repeating yearly.'
  },
  mobile: {
    de: 'ICS Editor am Handy: Listenansicht mit Datum als Überschrift und darunter die Termine mit Uhrzeit, farbigem Punkt für den Kalender und Titel.',
    en: 'ICS Editor on a phone: list view with the date as a heading and the events below with time, a coloured dot for the calendar and the title.'
  }
};
