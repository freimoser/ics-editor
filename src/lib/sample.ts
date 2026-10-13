// Erfundene Beispieldaten – für die Demo im Werkzeug und für die automatischen Tests.
// Der Aufbau ähnelt einem Google-Export einer Praxis (mehrere Kalender in einer ZIP-Datei, Kürzel im Titel,
// Beschreibungen mit Telefonnummern, Serien mit Ausnahmen, Verwaltungsfelder wie bei Google).
// Alle Namen, Nummern und Adressen sind erkennbar ausgedacht: Mustermann, 0176 123456789, example.com.

import { escapeText, CRLF, foldLine } from './text';
import { icsStamp, wallToUtc, DAY } from './datetime';
import { vtimezone } from './tz';

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ANIMALS = ['Bello', 'Luna', 'Mia', 'Rocky', 'Kira', 'Balu', 'Emma', 'Simba', 'Lilly', 'Max', 'Nala', 'Leo', 'Paula', 'Felix', 'Frieda', 'Oskar', 'Lotte', 'Charly', 'Bruno', 'Momo', 'Pepper', 'Socke', 'Tiger', 'Krümel', 'Hummel'];
const OWNERS = ['Mustermann', 'Musterfrau', 'Beispiel', 'Muster', 'Testmann', 'Testfrau', 'Normalverbraucher', 'Exempel', 'Platzhalter', 'Probemann', 'Demo', 'Mustermeier'];
const FIRST = ['Max', 'Erika', 'Otto', 'Lieschen', 'Hans', 'Anna', 'Paul', 'Lisa', 'Karl', 'Maria', 'Fritz', 'Emma'];
/** Erkennbar ausgedachte Telefonnummern */
export const FAKE_PHONES = ['0176 123456789', '0151 123456789', '0170 123456789', '030 12345678', '089 12345678'];
const TREAT = ['Impfung', 'Kontrolle', 'Zahnsteinentfernung', 'Kastration', 'Blutabnahme', 'Röntgen', 'Ultraschall', 'Wurmkur', 'Krallen schneiden', 'Nachkontrolle', 'Beratung', 'Chippen', 'Wundversorgung', 'Allergietest'];
export const SAMPLE_STAFF = ['AK', 'BM', 'CS', 'DW', 'EH', 'FL'];

function pick<T>(r: () => number, a: T[]): T { return a[Math.floor(r() * a.length)]; }
function phone(r: () => number): string { return pick(r, FAKE_PHONES); }
const mail = (first: string, last: string) => `${first}.${last}`.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue') + '@example.com';

export interface PracticeOptions { seed?: number; perYear?: number; fromYear?: number; toYear?: number; name?: string }

/** Erzeugt einen Google-Kalender-ähnlichen Export einer erfundenen Tierarztpraxis. */
export function samplePracticeIcs(o: PracticeOptions = {}): string {
  const r = rng(o.seed ?? 42);
  const perYear = o.perYear ?? 1600;
  const from = o.fromYear ?? 2010, to = o.toYear ?? 2026;
  const tz = 'Europe/Berlin';
  const L: string[] = [
    'BEGIN:VCALENDAR', 'PRODID:-//Google Inc//Google Calendar 70.9054//EN', 'VERSION:2.0', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${o.name ?? 'Tierarztpraxis Beispiel'}`, `X-WR-TIMEZONE:${tz}`, ...vtimezone(tz)
  ];
  const utc = (w: number) => icsStamp(wallToUtc(w, tz), true) + 'Z';
  let n = 0;
  const ev = (lines: string[]) => {
    L.push('BEGIN:VEVENT', ...lines, 'END:VEVENT');
    n++;
  };
  const meta = (w: number) => {
    const c = utc(w - Math.floor(r() * 60) * DAY);
    return [`DTSTAMP:20261007T080000Z`, `CREATED:${c}`, `LAST-MODIFIED:${c}`, `SEQUENCE:${Math.floor(r() * 3)}`];
  };
  // Geburtstagsserien (alter Beginn – darf beim Jahresfilter nicht verschwinden)
  for (let i = 0; i < 40; i++) {
    const y = 1958 + Math.floor(r() * 40), mo = 1 + Math.floor(r() * 12), d = 1 + Math.floor(r() * 28);
    const s = Date.UTC(y, mo - 1, d);
    ev([`DTSTART;VALUE=DATE:${icsStamp(s, false)}`, `DTEND;VALUE=DATE:${icsStamp(s + DAY, false)}`, 'RRULE:FREQ=YEARLY',
      `UID:bd${i}x${o.seed ?? 42}@google.com`, ...meta(Date.UTC(2012, 0, 1)), 'STATUS:CONFIRMED',
      `SUMMARY:${escapeText('Geburtstag ' + pick(r, FIRST) + ' ' + pick(r, OWNERS))}`, 'TRANSP:TRANSPARENT',
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:This is an event reminder', 'TRIGGER:-P0DT9H0M0S', 'END:VALARM']);
  }
  // Wöchentliche Teambesprechung mit Ausnahmen
  const teamStart = Date.UTC(from, 0, 6, 8, 0);
  const teamUid = `team${o.seed ?? 42}@google.com`;
  ev([`DTSTART;TZID=${tz}:${icsStamp(teamStart, true)}`, `DTEND;TZID=${tz}:${icsStamp(teamStart + 3_600_000, true)}`,
    `RRULE:FREQ=WEEKLY;BYDAY=WE;UNTIL=${to}1231T230000Z`, `UID:${teamUid}`, ...meta(teamStart), 'STATUS:CONFIRMED', 'SUMMARY:Teambesprechung', 'TRANSP:OPAQUE']);
  for (let i = 0; i < 12; i++) {
    const w = teamStart + Math.floor(r() * (to - from) * 52) * 7 * DAY;
    ev([`DTSTART;TZID=${tz}:${icsStamp(w + 3_600_000, true)}`, `DTEND;TZID=${tz}:${icsStamp(w + 7_200_000, true)}`,
      `UID:${teamUid}`, `RECURRENCE-ID;TZID=${tz}:${icsStamp(w, true)}`, ...meta(w), 'STATUS:CONFIRMED', 'SUMMARY:Teambesprechung (verlegt)', 'TRANSP:OPAQUE']);
  }
  // Einzeltermine
  for (let y = from; y <= to; y++) {
    const count = Math.round(perYear * (0.8 + r() * 0.4));
    for (let i = 0; i < count; i++) {
      const day = Date.UTC(y, 0, 2) + Math.floor(r() * 360) * DAY;
      const wd = new Date(day).getUTCDay();
      if (wd === 0 || (wd === 6 && r() < 0.8)) continue;
      const h = 8 + Math.floor(r() * 10), mi = pick(r, [0, 15, 30, 45]);
      const s = day + (h * 60 + mi) * 60000;
      const dur = pick(r, [60, 60, 60, 30, 30, 90, 120, 15]);
      const pre = r() < 0.75 ? 'T.' : r() < 0.5 ? 'onT.' : 'OP';
      const staff = r() < 0.6 ? ' ' + pick(r, SAMPLE_STAFF) : '';
      const cancelled = r() < 0.02 ? 'abgesagt ' : '';
      const title = `${cancelled}${pre}${staff} ${pick(r, ANIMALS)} ${pick(r, OWNERS)} / ${pick(r, TREAT)}`;
      const lines = [`DTSTART:${utc(s)}`, `DTEND:${utc(s + dur * 60000)}`, ...meta(s).slice(0, 1),
        `UID:${Math.floor(r() * 1e12).toString(36)}${n}@google.com`, ...meta(s).slice(1), 'STATUS:CONFIRMED', `SUMMARY:${escapeText(title)}`, 'TRANSP:OPAQUE'];
      if (r() < 0.55) lines.splice(5, 0, `DESCRIPTION:${escapeText(`Tel. ${phone(r)}\n${pick(r, TREAT)} besprochen. ${r() < 0.3 ? 'Bitte Impfpass mitbringen.' : ''}`.trim())}`);
      ev(lines);
    }
    // Urlaub (ganztägig)
    for (const k of SAMPLE_STAFF.slice(0, 3)) {
      const s = Date.UTC(y, 6, 1 + Math.floor(r() * 20));
      ev([`DTSTART;VALUE=DATE:${icsStamp(s, false)}`, `DTEND;VALUE=DATE:${icsStamp(s + 14 * DAY, false)}`, ...meta(s).slice(0, 1),
        `UID:u${y}${k}${o.seed ?? 42}@google.com`, ...meta(s).slice(1), 'STATUS:CONFIRMED', `SUMMARY:Urlaub ${k}`, 'TRANSP:TRANSPARENT']);
    }
  }
  L.push('END:VCALENDAR');
  return L.map(foldLine).join(CRLF) + CRLF;
}

export interface CsvSampleOptions { seed?: number; rows?: number; fromYear?: number; toYear?: number; slashDates?: boolean; brokenRows?: boolean }

/** Deutsche Praxis-Terminliste mit Semikolon, wie aus Praxissoftware exportiert. */
export function samplePracticeCsv(o: CsvSampleOptions = {}): string {
  const r = rng(o.seed ?? 7);
  const rows = o.rows ?? 2000;
  const from = o.fromYear ?? 2010, to = o.toYear ?? 2026;
  const out = ['Datum;Beginn;Ende;Behandlung;Behandler;Raum;Patient;Telefon;Geburtsdatum;Notiz'];
  const span = (to - from + 1) * 365;
  const list: [number, string][] = [];
  for (let i = 0; i < rows; i++) {
    const day = Date.UTC(from, 0, 2) + Math.floor(r() * span) * DAY;
    const p = new Date(day);
    const dd = String(p.getUTCDate()).padStart(2, '0'), mm = String(p.getUTCMonth() + 1).padStart(2, '0'), yy = p.getUTCFullYear();
    const h = 8 + Math.floor(r() * 10), mi = pick(r, ['00', '15', '30', '45']);
    const dur = pick(r, [15, 30, 30, 45, 60]);
    const endMin = h * 60 + +mi + dur;
    const date = o.slashDates ? `${dd}/${mm}/${yy}` : `${dd}.${mm}.${yy}`;
    const bd = `${String(1 + Math.floor(r() * 28)).padStart(2, '0')}.${String(1 + Math.floor(r() * 12)).padStart(2, '0')}.${1940 + Math.floor(r() * 60)}`;
    const vet = pick(r, ['Dr. Muster', 'Dr. Beispiel', 'Dr. Exempel', 'Dr. Test']);
    list.push([day + h * 3600000, [date, `${h}:${mi}`, `${Math.floor(endMin / 60)}:${String(endMin % 60).padStart(2, '0')}`, pick(r, TREAT), vet,
      'Raum ' + (1 + Math.floor(r() * 3)), `${pick(r, FIRST)} ${pick(r, OWNERS)}`, phone(r), bd, r() < 0.3 ? 'Röntgenbild mitbringen' : ''].join(';')]);
  }
  list.sort((a, b) => a[0] - b[0]);
  for (const [, l] of list) out.push(l);
  if (o.brokenRows) {
    out.splice(14, 0, '03.05.2024;14:30;13:30;Kontrolle;Dr. Muster;Raum 1;Anna Musterfrau;0176 123456789;12.03.1961;Ende vor Beginn');
    out.splice(20, 0, '31.02.2019;10:00;10:30;Impfung;Dr. Beispiel;Raum 2;Max Mustermann;0151 123456789;29.02.1952;');
    out.splice(25, 0, '12.06.2023;25:10;;;Dr. Exempel;Raum 3;Lisa Beispiel;0170 123456789;07.11.1990;');
  }
  return out.join('\r\n') + '\r\n';
}

/** Kodiert Text in Windows-1252 (für Testdateien „wie aus Excel“). Nur Zeichen aus Latin-1 + €. */
export function encodeWindows1252(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    out[i] = c === 0x20ac ? 0x80 : c < 256 ? c : 0x3f;
  }
  return out;
}

export function sampleBirthdayRows(): (string | number)[][] {
  return [
    ['Name', 'Geburtstag', 'Telefon'],
    ['Erika Mustermann', '12.03.1948', '0176 123456789'],
    ['Max Mustermann', '29.02.1952', '0151 123456789'],
    ['Lisa Beispiel', '07.11.1990', ''],
    ['Otto Normalverbraucher', '21.06.1941', '0170 123456789'],
    ['Anna Musterfrau', '02.01.1956', ''],
    ['Paul Testmann', '30.09.1949', '']
  ];
}

// ---------------------------------------------------------------- Google-Export mit mehreren Kalendern (ZIP)

interface CalDef { name: string; code?: string; kind: 'person' | 'labor' | 'intern' | 'stall' | 'online'; perYear: number; from: number; to: number; tz?: string }

const DEMO_CALS: CalDef[] = [
  { name: 'Anna (A)', code: 'A', kind: 'person', perYear: 300, from: 2014, to: 2026 },
  { name: 'Ben (B)', code: 'B', kind: 'person', perYear: 250, from: 2012, to: 2026 },
  { name: 'Clara (C)', code: 'C', kind: 'person', perYear: 200, from: 2017, to: 2026 },
  { name: 'David', code: 'D', kind: 'person', perYear: 250, from: 2016, to: 2019 },
  { name: 'Ella (E)', code: 'E', kind: 'person', perYear: 150, from: 2019, to: 2025, tz: 'UTC' },
  { name: 'Finn (F)', code: 'F', kind: 'person', perYear: 150, from: 2020, to: 2026 },
  { name: 'Greta (G)', code: 'G', kind: 'person', perYear: 120, from: 2021, to: 2026 },
  { name: 'Ida', code: 'I', kind: 'person', perYear: 100, from: 2022, to: 2026 },
  { name: 'Jonas (J)', code: 'J', kind: 'person', perYear: 120, from: 2019, to: 2026 },
  { name: 'Kai (K)', code: 'K', kind: 'person', perYear: 80, from: 2024, to: 2026 },
  { name: 'Labor (L)', code: 'L', kind: 'labor', perYear: 150, from: 2015, to: 2026 },
  { name: 'Intern', kind: 'intern', perYear: 60, from: 2010, to: 2026 },
  { name: 'Stall', kind: 'stall', perYear: 60, from: 2018, to: 2026 },
  { name: 'Online-Termine', kind: 'online', perYear: 2, from: 2026, to: 2026 }
];
// Kürzel für Behandlungen im Titel – wie in echten Praxiskalendern üblich
const TASK_CODES = ['NK', 'ZB', 'RÖ', 'US', 'KU', 'BB'];
const PERSON_TASKS = ['Büro', 'Telefonsprechstunde', 'Stallbehandlungen Hof {o}', 'Kontrolle {p} {o} @ Klinik', '1* impfen {p} {o}', 'Kolik {p} {o} @ Hof {o}',
  '{c} Zahnbehandlung {p} {o}', '{c} {p} {o} @ Klinik', 'Termin mit {f} {o}', 'Besprechung Team', '{c} {c2} {p} {o}'];

function calendarIcs(def: CalDef, seed: number): string {
  const r = rng(seed);
  const tz = def.tz ?? 'Europe/Berlin';
  const L: string[] = ['BEGIN:VCALENDAR', 'PRODID:-//Google Inc//Google Calendar 70.9054//EN', 'VERSION:2.0', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${def.name}`, `X-WR-TIMEZONE:${tz}`, ...(tz === 'UTC' ? [] : vtimezone(tz))];
  const utc = (w: number) => icsStamp(tz === 'UTC' ? w : wallToUtc(w, tz), true) + 'Z';
  let n = 0;
  const meta = (w: number) => { const c = utc(w - Math.floor(r() * 60) * DAY); return ['DTSTAMP:20261006T080000Z', `CREATED:${c}`, `LAST-MODIFIED:${c}`, `SEQUENCE:${Math.floor(r() * 3)}`]; };
  const ev = (lines: string[]) => { L.push('BEGIN:VEVENT', ...lines, 'END:VEVENT'); n++; };
  const uid = () => `${Math.floor(r() * 1e12).toString(36)}${seed}x${n}@google.com`;
  const fill = (t: string) => t.replace(/\{o\}/g, () => pick(r, OWNERS)).replace(/\{p\}/g, () => pick(r, ANIMALS)).replace(/\{f\}/g, () => pick(r, FIRST))
    .replace('{c2}', () => pick(r, TASK_CODES)).replace('{c}', () => pick(r, TASK_CODES));
  const timed = (s: number, mins: number, title: string, desc = '', loc = '') => {
    const lines = [`DTSTART:${utc(s)}`, `DTEND:${utc(s + mins * 60000)}`, ...meta(s).slice(0, 1), `UID:${uid()}`, ...meta(s).slice(1), 'STATUS:CONFIRMED', `SUMMARY:${escapeText(title)}`, 'TRANSP:OPAQUE'];
    if (desc) lines.splice(5, 0, `DESCRIPTION:${escapeText(desc)}`);
    if (loc) lines.splice(5, 0, `LOCATION:${escapeText(loc)}`);
    ev(lines);
  };
  const allDay = (s: number, days: number, title: string) => ev([`DTSTART;VALUE=DATE:${icsStamp(s, false)}`, `DTEND;VALUE=DATE:${icsStamp(s + days * DAY, false)}`,
    ...meta(s).slice(0, 1), `UID:${uid()}`, ...meta(s).slice(1), 'STATUS:CONFIRMED', `SUMMARY:${escapeText(title)}`, 'TRANSP:TRANSPARENT']);
  const desc = () => {
    const f = pick(r, FIRST), o = pick(r, OWNERS);
    return r() < 0.4 ? '' : pick(r, [`Tel. ${phone(r)}`, `Rückruf an ${f} ${o}, Tel. ${phone(r)}`, `E-Mail: ${mail(f, o)}`, 'Befund folgt', `Tel. ${phone(r)}\nBitte Impfpass mitbringen.`]);
  };
  const first = def.name.replace(/\s*\(.*\)$/, '');
  // Wöchentliche Serie mit einer Ausnahme
  if (def.kind === 'person' || def.kind === 'intern') {
    const s0 = Date.UTC(def.from, 0, 5, 8, 0);
    const u = `serie${seed}@google.com`;
    const title = def.kind === 'intern' ? 'Teambesprechung' : `${def.code}. Büro`;
    ev([`DTSTART:${utc(s0)}`, `DTEND:${utc(s0 + 3_600_000)}`, `RRULE:FREQ=WEEKLY;BYDAY=MO;UNTIL=${def.to}1231T230000Z`, ...meta(s0).slice(0, 1), `UID:${u}`, ...meta(s0).slice(1),
      'STATUS:CONFIRMED', `SUMMARY:${title}`, 'TRANSP:OPAQUE']);
    const x = s0 + 7 * DAY * Math.floor(r() * 50);
    ev([`DTSTART:${utc(x + 3_600_000)}`, `DTEND:${utc(x + 7_200_000)}`, ...meta(x).slice(0, 1), `UID:${u}`, `RECURRENCE-ID:${utc(x)}`, ...meta(x).slice(1),
      'STATUS:CONFIRMED', `SUMMARY:${title} (verlegt)`, 'TRANSP:OPAQUE']);
  }
  for (let y = def.from; y <= def.to; y++) {
    const count = Math.round(def.perYear * (0.85 + r() * 0.3));
    for (let i = 0; i < count; i++) {
      const day = Date.UTC(y, 0, 2) + Math.floor(r() * 360) * DAY;
      const wd = new Date(day).getUTCDay();
      if (wd === 0 && r() < 0.85) continue;
      const s = day + ((7 + Math.floor(r() * 12)) * 60 + pick(r, [0, 15, 30, 45])) * 60000;
      const state = r() < 0.06 ? 'ok ' : r() < 0.03 ? 'abgesagt ' : r() < 0.02 ? 'verschoben ' : '';
      if (def.kind === 'person') {
        const t = fill(pick(r, PERSON_TASKS));
        timed(s, pick(r, [30, 60, 60, 90, 120]), `${state}${def.code}. ${t}`, desc(), t.includes('@') ? '' : pick(r, ['', '', 'Klinik', `Hof ${pick(r, OWNERS)}`]));
      } else if (def.kind === 'labor') timed(s, 30, `${state}L. ${pick(r, ['Blutbild', 'Kotprobe', 'Hautgeschabsel', 'Urinprobe'])} ${pick(r, ANIMALS)} ${pick(r, OWNERS)}`, desc());
      else if (def.kind === 'stall') timed(s, 120, `${state}Stallbehandlungen Hof ${pick(r, OWNERS)}`, desc(), `Hof ${pick(r, OWNERS)}`);
      else if (def.kind === 'intern') timed(s, 60, pick(r, ['Fortbildung', 'Inventur', 'Gerätewartung', 'Dienstplan', 'Praxis-Treffen']), '');
      else timed(s, 30, `Online-Termin ${pick(r, ANIMALS)} ${pick(r, OWNERS)}`, `E-Mail: ${mail(pick(r, FIRST), pick(r, OWNERS))}`);
    }
    if (def.kind === 'person') {
      allDay(Date.UTC(y, 6, 1 + Math.floor(r() * 20)), 14, `${first} Urlaub`);
      for (let k = 0; k < 4; k++) allDay(Date.UTC(y, Math.floor(r() * 12), 1 + Math.floor(r() * 27)), 1, `${first} / ${pick(r, FIRST)} Notdienst`);
      if (r() < 0.5) allDay(Date.UTC(y, Math.floor(r() * 12), 1 + Math.floor(r() * 27)), 2, `${first} Fortbildung`);
    }
  }
  L.push('END:VCALENDAR');
  return L.map(foldLine).join(CRLF) + CRLF;
}

/** Erfundener Google-Export einer Praxis: 15 Kalender wie in einer echten ZIP-Datei – Hauptkalender, Personen, Labor, Intern, Stall, Online-Termine. */
export function sampleGoogleExport(perYear = 450): { name: string; files: { name: string; text: string }[] } {
  const account = 'tierarztpraxis.beispiel@example.com';
  const files = [{ name: `${account}.ics`, text: samplePracticeIcs({ perYear, name: 'Praxis', seed: 42 }) }];
  DEMO_CALS.forEach((def, i) => files.push({ name: `${def.name}_${(i * 7919 + 104729).toString(36)}@group.calendar.google.com.ics`, text: calendarIcs(def, 100 + i) }));
  return { name: `${account}.ical.zip`, files };
}
