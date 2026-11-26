// Doppelte Termine: gezählt und beim Export weggelassen werden nur einzelne Termine mit gleichem Titel, Beginn und Ende
// im selben Kalender. Serien bleiben immer vollständig. Grundlage für den Ratgeber „Doppelte Termine“.
import { describe, expect, it } from 'vitest';
import { parseIcs } from '../../src/lib/ics';
import { ALL, buildGroups, select } from '../../src/lib/plan';
import { calendarStats } from '../../src/lib/analyze';

const CRLF = '\r\n';
const ev = (uid: string, start: string, end: string, title: string, extra: string[] = []) =>
  ['BEGIN:VEVENT', `UID:${uid}@beispiel.invalid`, 'DTSTAMP:20261101T080000Z', `DTSTART;TZID=Europe/Berlin:${start}`, `DTEND;TZID=Europe/Berlin:${end}`, `SUMMARY:${title}`, ...extra, 'END:VEVENT'].join(CRLF);

function file(): string {
  const singles: string[] = [];
  for (let i = 0; i < 10; i++) {
    const d = String(10 + i);
    singles.push(ev('s' + i, `202611${d}T090000`, `202611${d}T093000`, `Kontrolle ${i}`));
  }
  // drei Termine zweimal importiert: gleicher Titel, Beginn und Ende, andere UID
  const twice = [0, 4, 7].map((i) => ev('dup' + i, `202611${10 + i}T090000`, `202611${10 + i}T093000`, `Kontrolle ${i}`));
  // ähnlich, aber nicht doppelt: anderer Beginn
  const similar = ev('sim', '20261110T100000', '20261110T103000', 'Kontrolle 0');
  // Serie und ein Einzeltermin zur selben Zeit wie ein Vorkommen der Serie – Serien zählen nicht als Duplikat
  const series = ev('serie', '20261102T080000', '20261102T090000', 'Teambesprechung', ['RRULE:FREQ=WEEKLY;COUNT=8']);
  const sameAsOccurrence = ev('einzeln', '20261109T080000', '20261109T090000', 'Teambesprechung');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Test//DE', 'X-WR-CALNAME:Praxis', ...singles, ...twice, similar, series, sameAsOccurrence, 'END:VCALENDAR', ''].join(CRLF);
}

describe('Doppelte Termine', () => {
  const [cal] = parseIcs(file(), 'praxis.ics');
  const groups = buildGroups(cal.events);

  it('zählt nur echte Duplikate im selben Kalender', () => {
    expect(calendarStats(cal).duplicates).toBe(3);
  });

  it('lässt sie beim Export weg und behält von jedem genau einen, Serien und ähnliche Termine bleiben', () => {
    const all = select(groups, ALL).groups.flatMap((g) => g.events);
    const res = select(groups, { ...ALL, dedupe: true });
    const kept = res.groups.flatMap((g) => g.events);
    expect(res.removed.duplicates).toBe(3);
    expect(kept.length).toBe(all.length - 3);
    for (let i = 0; i < 10; i++) expect(kept.filter((e) => e.summary === `Kontrolle ${i}`).length).toBe(i === 0 ? 2 : 1);
    expect(kept.some((e) => e.summary === 'Teambesprechung' && e.rrule)).toBe(true);
    expect(kept.filter((e) => e.summary === 'Teambesprechung').length).toBe(2);
  });
});
