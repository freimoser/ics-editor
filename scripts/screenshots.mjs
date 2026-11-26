// Erzeugt Bildschirmfotos des ICS Editors mit erfundenen Beispieldaten für Startseite und Ratgeber.
// Voraussetzung: npm run build && npm run preview (Port 4321). Aufruf: npm run screenshots
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BASE = process.env.SHOT_BASE ?? 'http://localhost:4321/ics-editor/';
const out = (f) => fileURLToPath(new URL('../public/img/' + f, import.meta.url));
const meta = {};

/** Erfundener Kalender mit absichtlich doppelten Terminen – nur für das Bild zum Ratgeber „Doppelte Termine“ */
function dupesIcs(lang) {
  const de = lang === 'de';
  const titles = de ? ['Impfung Bello', 'Kontrolle Mimi', 'Zahnreinigung Rex', 'Beratung Kaninchen', 'Nachsorge Luna', 'Erstgespräch Kater Max'] : ['Vaccination Bello', 'Check-up Mimi', 'Dental cleaning Rex', 'Rabbit consultation', 'Follow-up Luna', 'First visit Max the cat'];
  const pad = (n) => String(n).padStart(2, '0');
  const ev = [];
  let id = 0;
  for (let d = 0; d < 60; d++) {
    const day = new Date(Date.UTC(2026, 10, 2 + Math.floor(d / 3)));
    if (day.getUTCDay() === 0 || day.getUTCDay() === 6) continue;
    const date = `${day.getUTCFullYear()}${pad(day.getUTCMonth() + 1)}${pad(day.getUTCDate())}`;
    const h = 8 + (d % 3) * 2;
    const e = (uid) => `BEGIN:VEVENT\r\nUID:${uid}@beispiel.invalid\r\nDTSTAMP:20261101T080000Z\r\nDTSTART;TZID=Europe/Berlin:${date}T${pad(h)}0000\r\nDTEND;TZID=Europe/Berlin:${date}T${pad(h)}3000\r\nSUMMARY:${titles[d % titles.length]}\r\nEND:VEVENT`;
    ev.push(e('a' + id));
    if (d % 4 === 0) ev.push(e('b' + id)); // zweimal importiert: gleicher Titel, Beginn und Ende, andere UID
    id++;
  }
  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//ICS Editor//Beispiel//DE\r\nX-WR-CALNAME:${de ? 'Praxis (Beispiel)' : 'Practice (example)'}\r\nX-WR-TIMEZONE:Europe/Berlin\r\n${ev.join('\r\n')}\r\nEND:VCALENDAR\r\n`;
}

async function shot(page, name, lang, maxW = 1200) {
  await page.waitForTimeout(500);
  const png = await page.screenshot({ animations: 'disabled' });
  const img = sharp(png).resize({ width: maxW, withoutEnlargement: true }).webp({ quality: 80 });
  const { width, height } = await img.clone().toBuffer({ resolveWithObject: true }).then((r) => r.info);
  await img.toFile(out(`${name}-${lang}.webp`));
  meta[`${name}-${lang}`] = { w: width, h: height };
  console.log('✓', `${name}-${lang}.webp`, width + '×' + height);
}

for (const lang of ['de', 'en']) {
  // Eigener Browser je Sprache, damit Datums- und Zeitfelder im passenden Format erscheinen
  const browser = await chromium.launch({ args: [lang === 'de' ? '--lang=de-DE' : '--lang=en-GB'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 }, deviceScaleFactor: 1.25, colorScheme: 'light', locale: lang === 'de' ? 'de-DE' : 'en-GB' });
  // Einwilligungs-Banner nicht im Bild: Entscheidung „Ablehnen“ vorab setzen
  const noBanner = () => localStorage.setItem('ics-editor-consent', JSON.stringify({ v: 'denied', t: '2026-01-01T00:00:00.000Z' }));
  await page.addInitScript(noBanner);
  const start = async (which) => {
    await page.goto(BASE + (lang === 'de' ? '' : 'en/'));
    await page.waitForSelector('astro-island:not([ssr])', { state: 'attached' });
    await page.locator('.samples .link').nth(which).click();
    await page.waitForSelector('.app.loaded .cal', { timeout: 60_000 });
    await page.waitForTimeout(900);
  };
  const close = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(250); };

  // Startbildschirm: Ablagefläche und Knopf „Datei auswählen“
  await page.goto(BASE + (lang === 'de' ? '' : 'en/'));
  await page.waitForSelector('astro-island:not([ssr])', { state: 'attached' });
  await page.waitForTimeout(600);
  await shot(page, 'start', lang);

  // Doppelte Termine: erfundene Datei mit Duplikaten laden, beim Export weglassen
  await page.locator('input[type=file]').first().setInputFiles({ name: lang === 'de' ? 'praxis-beispiel.ics' : 'practice-example.ics', mimeType: 'text/calendar', buffer: Buffer.from(dupesIcs(lang)) });
  await page.waitForSelector('.app.loaded .cal', { timeout: 60_000 });
  await page.waitForTimeout(700);
  await page.locator('.top .btn.primary').click();
  await page.waitForSelector('dialog[open] .result .big');
  await page.locator('dialog[open] .more-opts > summary').click();
  await page.locator('dialog[open] .ck', { hasText: lang === 'de' ? 'Doppelte' : 'Duplicate' }).locator('input').check();
  await page.waitForTimeout(500);
  await shot(page, 'dupes', lang);
  await close();

  await start(0);
  // Zeitraum „Ab 2024“: weniger Termine, weniger Dateien
  await page.locator('.top .btn.primary').click();
  await page.waitForSelector('dialog[open] .result .big');
  await page.locator('dialog[open] .seg button').nth(1).click();
  await page.waitForTimeout(400);
  await shot(page, 'range', lang);
  // Format „CSV für Excel“
  await page.locator('dialog[open] .more-opts > summary').click();
  await page.locator('dialog[open] .seg button', { hasText: 'CSV' }).click();
  await page.waitForTimeout(400);
  await shot(page, 'csv', lang);
  await close();
  await page.locator('.chip:not(.allday)', { hasText: / [A-Z]{2} / }).nth(4).click();
  await page.waitForSelector('.panel .p-title');
  await shot(page, 'editor', lang);
  await page.locator('.panel .ib').click();
  await page.locator('.suggest .btn').click();
  await page.waitForSelector('dialog[open] .kz');
  await page.locator('dialog[open] .kz input[type=text]').first().fill(lang === 'de' ? 'Dr. Muster' : 'Dr Example');
  await shot(page, 'split', lang);
  await page.locator('dialog[open] .df .btn.primary').click();
  await page.waitForTimeout(4600); // Hinweis unten ausblenden lassen
  await shot(page, 'month', lang);
  await page.locator('.top .file').click();
  await page.waitForSelector('dialog[open] .kpis');
  await shot(page, 'overview', lang);
  await close();
  await page.locator('.top .btn.primary').click();
  await page.waitForSelector('dialog[open] .result .big');
  await page.locator('dialog[open] .files-d > summary').click();
  await shot(page, 'export', lang);
  await page.locator('dialog[open] .seg button').nth(1).click();
  await page.locator('dialog[open] .files-d > summary').click();
  await page.locator('dialog[open] .more-opts > summary').click();
  await page.locator('dialog[open] .ck input').nth(1).check();
  await shot(page, 'clean', lang);
  await close();

  // In Teilen importieren: nur ein Kalender, höchstens 999 Termine pro Datei
  await start(0);
  await page.locator('.label-row .link').click();
  await page.locator('.side .cal', { hasText: 'Anna' }).locator('input').check();
  await page.waitForTimeout(500);
  await page.locator('.top .btn.primary').click();
  await page.waitForSelector('dialog[open] .result .big');
  await page.locator('dialog[open] .more-opts > summary').click();
  await page.locator('dialog[open] .ck', { hasText: '999' }).locator('input').check();
  await page.waitForTimeout(600);
  await page.locator('dialog[open] .more-opts > summary').click();
  await page.locator('dialog[open] .files-d > summary').click();
  await shot(page, 'parts', lang);
  await close();

  await start(1);
  await page.locator('.banner .link').click();
  await page.waitForSelector('dialog[open] .issue');
  await shot(page, 'check', lang);
  await page.locator('dialog[open] .db .h4').nth(1).scrollIntoViewIfNeeded();
  await page.locator('dialog[open] .db').evaluate((el) => { const h = el.querySelectorAll('.h4')[1]; el.scrollTop = h.offsetTop - 12; });
  await shot(page, 'privacy', lang);
  await close();

  await start(2);
  await page.locator('.top .seg button').nth(1).click();
  await page.waitForSelector('.list .rt');
  await page.locator('.list .rt').first().click();
  await page.waitForSelector('.panel .p-title');
  await shot(page, 'birthdays', lang);
  await page.close();

  // Am Handy: Liste der Termine im schmalen Fenster
  const phone = await browser.newPage({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'light', locale: lang === 'de' ? 'de-DE' : 'en-GB' });
  await phone.addInitScript(noBanner);
  await phone.goto(BASE + (lang === 'de' ? '' : 'en/'));
  await phone.waitForSelector('astro-island:not([ssr])', { state: 'attached' });
  await phone.locator('.samples .link').nth(0).click();
  await phone.waitForSelector('.app.loaded', { timeout: 60_000 });
  await phone.waitForTimeout(800);
  await phone.locator('.top .seg button').nth(1).click();
  await phone.waitForSelector('.list .rt');
  await phone.waitForTimeout(600);
  await shot(phone, 'mobile', lang, 600);
  await phone.close();
  await browser.close();
}
writeFileSync(fileURLToPath(new URL('../src/content/images.json', import.meta.url)), JSON.stringify(meta, null, 2) + '\n');
console.log('images.json geschrieben');
