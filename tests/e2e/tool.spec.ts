import { expect, test, type Page, type Request } from '@playwright/test';
import { zipSync, strToU8 } from 'fflate';
import { samplePracticeIcs, samplePracticeCsv, encodeWindows1252 } from '../../src/lib/sample';

const PAGES = ['', 'en/', 'google-kalender-datei-zu-gross/', 'en/split-google-calendar/', 'datenschutz/'];

async function noHorizontalScroll(page: Page) {
  const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sw, 'seitliches Scrollen').toBeLessThanOrEqual(cw);
}

async function ready(page: Page) {
  await page.waitForSelector('astro-island:not([ssr])', { state: 'attached' });
}

async function upload(page: Page, name: string, data: Uint8Array | string, mime: string) {
  await ready(page);
  await page.locator('input[type=file]').setInputFiles({ name, mimeType: mime, buffer: Buffer.from(data) });
}

const loaded = (page: Page) => expect(page.locator('.app.loaded .cal').first()).toBeVisible({ timeout: 30_000 });
const sidebarCal = (page: Page, name: string) => page.locator('.side .cal', { hasText: name });

async function sample(page: Page) {
  await page.goto('');
  await ready(page);
  await page.getByRole('button', { name: /Praxis-Kalender/ }).click();
  await loaded(page);
}

test.describe('360 px Breite', () => {
  test.use({ viewport: { width: 360, height: 780 } });
  test('Handy: Tag antippen, Termin öffnen, Panel schließen', async ({ page }) => {
    await sample(page);
    await noHorizontalScroll(page);
    await page.locator('.cell:not(.other)').nth(12).click();
    await expect(page.locator('.list .row').first()).toBeVisible();
    await page.locator('.list .rt').first().click();
    const title = page.getByRole('textbox', { name: 'Titel' });
    await expect(title).toBeInViewport();
    await title.press('Escape');
    await expect(page.locator('.panel')).toHaveCount(0);
    await noHorizontalScroll(page);
  });
  for (const p of PAGES) {
    test(`kein seitliches Scrollen: /${p}`, async ({ page }) => {
      await page.goto(p);
      await noHorizontalScroll(page);
    });
  }
  test('kein seitliches Scrollen in Seitenleiste, Aufteilen und Export', async ({ page }) => {
    await sample(page);
    await page.getByRole('button', { name: 'Kalenderliste' }).click();
    await expect(page.locator('.side')).toBeInViewport();
    await page.getByRole('button', { name: 'Aufteilen' }).click();
    await expect(page.getByRole('dialog', { name: 'In mehrere Kalender aufteilen' })).toBeVisible();
    await noHorizontalScroll(page);
    await page.getByRole('button', { name: /Kalender anlegen/ }).click();
    await page.getByRole('button', { name: 'Exportieren' }).click();
    await expect(page.getByRole('dialog', { name: 'Für Google exportieren' })).toBeVisible();
    await noHorizontalScroll(page);
  });
});

test('ICS: nach Kürzeln aufteilen, Teile unter 950 KB herunterladen', async ({ page }) => {
  await page.goto('');
  await upload(page, 'praxis.ics', samplePracticeIcs({ perYear: 1200 }), 'text/calendar');
  await loaded(page);
  await expect(page.getByText(/Kürzel gefunden/)).toBeVisible();
  await page.getByRole('button', { name: 'Aufteilen' }).click();
  const dlg = page.getByRole('dialog', { name: 'In mehrere Kalender aufteilen' });
  await dlg.getByRole('textbox', { name: 'Name für DW' }).fill('Dr. Muster');
  await dlg.getByRole('button', { name: /Kalender anlegen/ }).click();
  await expect(sidebarCal(page, 'Dr. Muster')).toBeVisible();
  await expect(page.locator('.side .cal')).toHaveCount(7);
  await page.getByRole('button', { name: 'Exportieren' }).click();
  const ex = page.getByRole('dialog', { name: 'Für Google exportieren' });
  await ex.getByText(/Dateien anzeigen/).click();
  const first = ex.getByRole('button', { name: /^Herunterladen: / }).first();
  const [dl] = await Promise.all([page.waitForEvent('download'), first.click()]);
  const fs = await import('node:fs');
  const text = fs.readFileSync((await dl.path())!, 'utf8');
  expect(text.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
  expect(Buffer.byteLength(text)).toBeLessThanOrEqual(950_000);
  expect(dl.suggestedFilename()).toMatch(/\.ics$/);
  expect(text).not.toMatch(/\r\nLAST-MODIFIED/);
});

test('Termin bearbeiten, umhängen, löschen – alles landet im Export', async ({ page }) => {
  await page.goto('');
  await upload(page, 'praxis.ics', samplePracticeIcs({ perYear: 200, seed: 21 }), 'text/calendar');
  await loaded(page);
  await page.getByRole('button', { name: 'Liste', exact: true }).click();
  await page.locator('.list .rt').first().click();
  const title = page.getByRole('textbox', { name: 'Titel' });
  const oldTitle = await title.inputValue();
  await title.fill(oldTitle + ', geändert');
  await expect(page.getByText(/Geändert – kommt so in den Export/)).toBeVisible({ timeout: 5_000 });
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.locator('.list .row.ed').first()).toBeVisible();
  // zweiten Termin löschen, mit Rückgängig-Hinweis
  await page.locator('.list .rt').nth(1).click();
  await page.locator('.panel').getByRole('button', { name: 'Löschen' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Gelöscht' }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.locator('.list .row.del')).toHaveCount(1);
  await page.getByRole('button', { name: 'Exportieren' }).click();
  const ex = page.getByRole('dialog', { name: 'Für Google exportieren' });
  const [dl] = await Promise.all([page.waitForEvent('download'), ex.getByRole('button', { name: /herunterladen|Herunterladen$/ }).last().click()]);
  const fs = await import('node:fs');
  const buf = new Uint8Array(fs.readFileSync((await dl.path())!));
  let all: string;
  if (dl.suggestedFilename().endsWith('.zip')) {
    const { unzipSync, strFromU8 } = await import('fflate');
    all = Object.values(unzipSync(buf)).map((f) => strFromU8(f)).join('');
  } else all = Buffer.from(buf).toString('utf8');
  expect(all.replace(/\r\n /g, '')).toContain('SUMMARY:' + oldTitle.replace(/,/g, '\\,') + '\\, geändert');
});

test('Termin per Panel in anderen Kalender umhängen', async ({ page }) => {
  await page.goto('');
  await upload(page, 'praxis.ics', samplePracticeIcs({ perYear: 200, seed: 22 }), 'text/calendar');
  await loaded(page);
  await page.getByRole('button', { name: 'Aufteilen' }).click();
  await page.getByRole('button', { name: /Kalender anlegen/ }).click();
  const before = await sidebarCal(page, 'Sonstige').locator('em').textContent();
  await page.getByRole('button', { name: 'Liste', exact: true }).click();
  await page.locator('.list .rt').first().click();
  const select = page.locator('.panel select');
  const current = await select.inputValue();
  await select.selectOption(current === 'rest' ? { index: 0 } : 'rest');
  await expect(page.getByText(/verschoben/)).toBeVisible();
  await expect(sidebarCal(page, 'Sonstige').locator('em')).not.toHaveText(before!);
});

test('Google-Export als ZIP mit zwei Kalendern', async ({ page }) => {
  await page.goto('');
  const zip = zipSync({ 'a/Praxis.ics': strToU8(samplePracticeIcs({ perYear: 60, seed: 1, name: 'Praxis' })), 'a/Privat.ics': strToU8(samplePracticeIcs({ perYear: 40, seed: 2, name: 'Privat' })) });
  await upload(page, 'export.ical.zip', zip, 'application/zip');
  await loaded(page);
  await expect(sidebarCal(page, 'Praxis')).toBeVisible();
  await expect(sidebarCal(page, 'Privat')).toBeVisible();
  // Ausgeblendete Kalender kommen nicht in den Export
  await sidebarCal(page, 'Privat').locator('input').uncheck();
  await expect(sidebarCal(page, 'Privat').locator('input')).not.toBeChecked();
  await page.getByRole('button', { name: 'Exportieren' }).click();
  const ex = page.getByRole('dialog', { name: 'Für Google exportieren' });
  await expect(ex.getByText(/1 von 2/)).toBeVisible();
  await ex.getByText(/Dateien? anzeigen|Dateiname/).click();
  await expect(ex.locator('.files li')).toHaveCount(1);
  await expect(ex.locator('.files')).not.toContainText(/privat/i);
  await ex.getByRole('button', { name: 'Alle einbeziehen' }).click();
  await expect(ex.getByText('Alle 2')).toBeVisible();
  await page.keyboard.press('Escape');
  // Alle auf einmal aus- und einblenden
  await page.getByRole('button', { name: 'Alle Kalender ausblenden' }).click();
  await expect(page.locator('.side .cal input:checked')).toHaveCount(0);
  await page.getByRole('button', { name: 'Alle Kalender einblenden' }).click();
  await expect(page.locator('.side .cal input:checked')).toHaveCount(2);
});

test('Export: eigener Zeitraum mit Jahren und Datum', async ({ page }) => {
  await sample(page);
  await page.getByRole('button', { name: 'Exportieren' }).click();
  const ex = page.getByRole('dialog', { name: 'Für Google exportieren' });
  const big = ex.locator('.result .big');
  await expect(big).toContainText('Termine');
  const all = await big.textContent();
  await ex.getByRole('button', { name: 'Eigener' }).click();
  await ex.locator('.ychips button').first().click();
  await expect(big).not.toHaveText(all!);
  const oneYear = await big.textContent();
  await ex.locator('.ychips button').nth(1).click();
  await expect(big).not.toHaveText(oneYear!);
  await ex.getByLabel('Von', { exact: true }).fill('2025-01-01');
  await ex.getByLabel('Bis', { exact: true }).fill('2025-01-31');
  await ex.getByLabel('Bis', { exact: true }).blur();
  await expect(ex.locator('.ychips button[aria-pressed="true"]')).toHaveCount(0);
  await expect(big).not.toHaveText(oneYear!);
});

test('Export: Ab und Vor ein Jahr ergänzen sich zu allen Terminen', async ({ page }) => {
  await sample(page);
  await page.getByRole('button', { name: 'Exportieren' }).click();
  const ex = page.getByRole('dialog', { name: 'Für Google exportieren' });
  const big = ex.locator('.result .big');
  const count = async () => Number((await big.textContent())!.match(/^([\d.]+) Termine/)![1].replace(/\./g, ''));
  await expect(big).toContainText('Termine');
  const all = await count();
  const y = new Date().getFullYear() - 1;
  await ex.getByRole('button', { name: `Ab ${y}` }).click();
  await expect(ex.getByText(`Ab 1. Januar ${y}`)).toBeVisible();
  await expect.poll(count).toBeLessThan(all);
  const after = await count();
  await ex.getByRole('button', { name: `Vor ${y}` }).click();
  await expect(ex.getByText(`Nur Termine bis 31. Dezember ${y - 1}`)).toBeVisible();
  await expect.poll(count).not.toBe(after);
  const before = await count();
  // Serien können in beide Zeiträume fallen, Einzeltermine nur in einen
  expect(before + after).toBeGreaterThanOrEqual(all);
  await expect(ex.getByRole('button', { name: `Ab ${y - 1}` })).toBeVisible();
  await expect(ex.getByRole('button', { name: `Vor ${y - 1}` })).toBeVisible();
});

test('Mehrere ICS-Dateien auf einmal werden getrennte Kalender', async ({ page }) => {
  await page.goto('');
  await ready(page);
  await page.locator('input[type=file]').setInputFiles([
    { name: 'anna.ics', mimeType: 'text/calendar', buffer: Buffer.from(samplePracticeIcs({ perYear: 30, seed: 3, name: 'Anna' })) },
    { name: 'ben.ics', mimeType: 'text/calendar', buffer: Buffer.from(samplePracticeIcs({ perYear: 20, seed: 4, name: 'Ben' })) }
  ]);
  await loaded(page);
  await expect(sidebarCal(page, 'Anna')).toBeVisible();
  await expect(sidebarCal(page, 'Ben')).toBeVisible();
});

test('Gemischte Dateien: verständlicher Hinweis', async ({ page }) => {
  await page.goto('');
  await ready(page);
  await page.locator('input[type=file]').setInputFiles([
    { name: 'a.ics', mimeType: 'text/calendar', buffer: Buffer.from(samplePracticeIcs({ perYear: 5 })) },
    { name: 'b.csv', mimeType: 'text/csv', buffer: Buffer.from('Subject,Start Date\nTest,05/30/2026\n') }
  ]);
  await expect(page.getByRole('alert')).toContainText('Mehrere Dateien auf einmal');
});

test('CSV: Semikolon, Windows-Zeichensatz, Datenschutz und zeilengenaue Fehler', async ({ page }) => {
  await page.goto('');
  await upload(page, 'termine.csv', encodeWindows1252(samplePracticeCsv({ rows: 400, brokenRows: true })), 'text/csv');
  await loaded(page);
  await expect(page.getByText(/Zeilen kann Google so nicht lesen/)).toBeVisible();
  const status = page.locator('.s-status');
  const before = await status.textContent();
  await page.getByRole('button', { name: 'Ansehen' }).click();
  const dlg = page.getByRole('dialog', { name: 'Spalten und Probleme' });
  await expect(dlg.getByText('Zeile 15:')).toBeVisible();
  await expect(dlg.getByText(/Das Ende liegt vor dem Beginn/)).toBeVisible();
  await dlg.getByRole('radiogroup', { name: 'Spalte „Patient“' }).getByRole('radio', { name: 'Weglassen' }).click();
  await dlg.getByRole('button', { name: 'Alle Vorschläge übernehmen' }).click();
  await expect(dlg.getByText('Alles geprüft – Google kann jeden Termin lesen.')).toBeVisible();
  await dlg.getByRole('button', { name: 'Schließen' }).click();
  await expect(page.getByText(/Zeilen kann Google so nicht lesen/)).toHaveCount(0);
  await expect(status).not.toHaveText(before!, { timeout: 10_000 });
  await page.getByRole('button', { name: /beispiel|termine\.csv/ }).first().click();
  await expect(page.getByText(/Semikolon als Trennzeichen/)).toBeVisible();
});

test('Export: höchstens 999 Termine pro Datei', async ({ page }) => {
  await sample(page);
  await page.getByRole('button', { name: 'Exportieren' }).click();
  const ex = page.getByRole('dialog', { name: 'Für Google exportieren' });
  const zip = ex.locator('.df .btn.primary');
  await expect(zip).toContainText(/\d+ Dateien/);
  const before = Number((await zip.textContent())!.match(/(\d+) Dateien/)![1]);
  await ex.getByText('Mehr Optionen').click();
  await ex.getByRole('checkbox', { name: /Höchstens 999 Termine pro Datei/ }).check();
  await expect(ex.getByText(/höchstens 1 MB und 999 Termine pro Datei/)).toBeVisible();
  await expect.poll(async () => Number((await zip.textContent())!.match(/(\d+) Dateien/)![1])).toBeGreaterThan(before);
  await ex.getByText(/Dateien anzeigen/).click();
  for (const t of await ex.locator('.files .f-name .muted').allTextContents()) {
    expect(Number(t.match(/^([\d.]+) Termine/)![1].replace(/\./g, ''))).toBeLessThanOrEqual(999);
  }
});

test('Datei verlässt das Gerät nicht: keine Netzwerkanfragen beim Verarbeiten', async ({ page }) => {
  await page.goto('');
  await page.waitForLoadState('networkidle');
  const meta = await page.locator('meta[http-equiv="content-security-policy"]').getAttribute('content');
  expect(meta).toMatch(/connect-src https:\/\/freimoser\.github\.io\/robots\.txt[^;]*;/);
  expect(meta).not.toMatch(/connect-src[^;]*'self'/);
  const requests: Request[] = [];
  page.on('request', (r) => requests.push(r));
  await upload(page, 'praxis.ics', samplePracticeIcs({ perYear: 300 }), 'text/calendar');
  await loaded(page);
  // Aufteilen, Termin bearbeiten, löschen, suchen – alles ohne Anfrage nach außen
  await page.getByRole('button', { name: 'Aufteilen' }).click();
  await page.getByRole('button', { name: /Kalender anlegen/ }).click();
  await page.getByRole('button', { name: 'Liste', exact: true }).click();
  await page.locator('.list .rt').first().click();
  await page.getByRole('textbox', { name: 'Titel' }).fill('Geändert');
  await page.locator('.panel').getByRole('button', { name: 'Löschen' }).click();
  await page.getByRole('button', { name: 'Fertig' }).click();
  await page.getByRole('searchbox').fill('Kontrolle');
  await page.getByRole('button', { name: 'Exportieren' }).click();
  const ex = page.getByRole('dialog', { name: 'Für Google exportieren' });
  await ex.getByText('Mehr Optionen').click();
  await ex.getByRole('checkbox', { name: /Höchstens 999/ }).check();
  const [dl] = await Promise.all([page.waitForEvent('download'), ex.locator('.df .btn.primary').click()]);
  await dl.path();
  const external = requests.filter((r) => !r.url().startsWith('http://localhost:4321/') && !r.url().startsWith('blob:') && !r.url().startsWith('data:'));
  expect(external.map((r) => r.url())).toEqual([]);
  expect(requests.filter((r) => r.method() !== 'GET').map((r) => r.url())).toEqual([]);
  // Erlaubt: nachgeladene eigene Schriftdateien (GET, gleiche Adresse) – sonst keine Anfrage
  expect(requests.filter((r) => r.url().startsWith('http') && !/\/_astro\/[\w.-]+\.woff2$/.test(r.url())).map((r) => r.url())).toEqual([]);
});

test('Bedienung mit der Tastatur', async ({ page }) => {
  await page.goto('');
  let found = false;
  for (let i = 0; i < 25 && !found; i++) {
    await page.keyboard.press('Tab');
    found = (await page.evaluate(() => document.activeElement?.textContent?.trim())) === 'Datei auswählen';
  }
  expect(found).toBe(true);
  await ready(page);
  await page.getByRole('button', { name: /Praxis-Kalender/ }).focus();
  await page.keyboard.press('Enter');
  await loaded(page);
  await page.getByRole('button', { name: 'Exportieren' }).focus();
  await page.keyboard.press('Enter');
  const ex = page.getByRole('dialog', { name: 'Für Google exportieren' });
  await expect(ex).toBeVisible();
  await ex.getByText('Mehr Optionen').focus();
  await page.keyboard.press('Enter');
  const box = ex.getByRole('checkbox', { name: /Technische Zusatzdaten/ });
  await expect(box).toBeChecked();
  await box.focus();
  await page.keyboard.press('Space');
  await expect(box).not.toBeChecked();
  await page.keyboard.press('Escape');
  await expect(ex).toBeHidden();
});

test('Offline nach dem ersten Besuch', async ({ page, context }) => {
  await page.goto('');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await ready(page);
  await page.getByRole('button', { name: /Praxis-Kalender/ }).click();
  await loaded(page);
  await context.setOffline(false);
});

test('Erklär-Kasten: Hinweise, Info mit Ratgeber-Link, ausblenden bleibt gemerkt', async ({ page }) => {
  await sample(page);
  await expect(page.getByText('Welche Kalender stecken drin?')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Exportieren & konvertieren' })).toBeVisible();
  await page.getByRole('button', { name: 'So funktioniert diese Ansicht' }).click();
  const help = page.getByRole('dialog', { name: 'So funktioniert der ICS Editor' });
  await expect(help).toBeVisible();
  await expect(help.getByRole('link', { name: /Ratgeber/ })).toHaveAttribute('href', /ics-datei-google-kalender-importieren\/$/);
  await page.getByRole('button', { name: 'Hinweise ausblenden' }).click();
  await expect(page.getByText('Welche Kalender stecken drin?')).toHaveCount(0);
  await page.reload();
  await ready(page);
  await page.getByRole('button', { name: /Praxis-Kalender/ }).click();
  await loaded(page);
  await expect(page.getByText('Welche Kalender stecken drin?')).toHaveCount(0);
  await page.getByRole('button', { name: 'So funktioniert diese Ansicht' }).click();
  await expect(page.getByRole('dialog', { name: 'So funktioniert der ICS Editor' })).toBeVisible();
});

test('Englische Startseite und Sprachwechsel', async ({ page }) => {
  await page.goto('en/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/ICS Editor/);
  await page.getByRole('link', { name: /Deutsch/ }).click();
  await expect(page).toHaveURL(/\/ics-editor\/$/);
});
