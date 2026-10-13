// Erzeugt Bildschirmfotos des ICS Editors mit erfundenen Beispieldaten für Startseite und Ratgeber.
// Voraussetzung: npm run build && npm run preview (Port 4321). Aufruf: npm run screenshots
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BASE = 'http://localhost:4321/ics-editor/';
const out = (f) => fileURLToPath(new URL('../public/img/' + f, import.meta.url));
const meta = {};

async function shot(page, name, lang) {
  await page.waitForTimeout(500);
  const png = await page.screenshot({ animations: 'disabled' });
  const img = sharp(png).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 80 });
  const { width, height } = await img.clone().toBuffer({ resolveWithObject: true }).then((r) => r.info);
  await img.toFile(out(`${name}-${lang}.webp`));
  meta[`${name}-${lang}`] = { w: width, h: height };
  console.log('✓', `${name}-${lang}.webp`, width + '×' + height);
}

for (const lang of ['de', 'en']) {
  // Eigener Browser je Sprache, damit Datums- und Zeitfelder im passenden Format erscheinen
  const browser = await chromium.launch({ args: [lang === 'de' ? '--lang=de-DE' : '--lang=en-GB'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 }, deviceScaleFactor: 1.25, colorScheme: 'light', locale: lang === 'de' ? 'de-DE' : 'en-GB' });
  const start = async (which) => {
    await page.goto(BASE + (lang === 'de' ? '' : 'en/'));
    await page.waitForSelector('astro-island:not([ssr])', { state: 'attached' });
    await page.locator('.samples .link').nth(which).click();
    await page.waitForSelector('.app.loaded .cal', { timeout: 60_000 });
    await page.waitForTimeout(900);
  };
  const close = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(250); };

  await start(0);
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
  await browser.close();
}
writeFileSync(fileURLToPath(new URL('../src/content/images.json', import.meta.url)), JSON.stringify(meta, null, 2) + '\n');
console.log('images.json geschrieben');
