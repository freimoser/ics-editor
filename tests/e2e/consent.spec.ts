// Einwilligung für Google Analytics: vorher nichts laden, Ablehnen gleichwertig, Zustimmen lädt gtag, Widerruf löscht.
// Anfragen an Google werden abgefangen – Tests schicken nie Daten an die echte Analytics-Property.
import { test, expect, type Page } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

const google = /googletagmanager\.com|google-analytics\.com|analytics\.google\.com/;

async function track(page: Page) {
  const hits: string[] = [];
  await page.route(google, (route) => { hits.push(route.request().url()); return route.abort(); });
  return hits;
}

test('Ohne Entscheidung: Banner sichtbar, nichts von Google geladen', async ({ page }) => {
  const hits = await track(page);
  await page.goto('ratgeber/');
  const banner = page.getByRole('region', { name: 'Einwilligung zur Messung' });
  await expect(banner).toBeVisible();
  await expect(banner.getByRole('button', { name: 'Ablehnen' })).toBeVisible();
  await expect(banner.getByRole('button', { name: 'Zustimmen' })).toBeVisible();
  await page.waitForTimeout(500);
  expect(hits).toEqual([]);
  expect(await page.evaluate(() => document.cookie)).not.toMatch(/_ga/);
});

test('Ablehnen: Banner weg, bleibt weg, nichts von Google', async ({ page }) => {
  const hits = await track(page);
  await page.goto('');
  await page.getByRole('button', { name: 'Ablehnen' }).click();
  await expect(page.locator('#consent')).toBeHidden();
  await page.reload();
  await expect(page.locator('#consent')).toBeHidden();
  await page.waitForTimeout(500);
  expect(hits).toEqual([]);
});

test('Zustimmen: gtag wird nachgeladen, Widerruf zeigt das Banner wieder', async ({ page }) => {
  const hits = await track(page);
  await page.goto('en/guides/');
  await page.getByRole('button', { name: 'Accept' }).click();
  await expect.poll(() => hits.some((u) => u.includes('googletagmanager.com/gtag/js?id=G-'))).toBe(true);
  const cfg = await page.evaluate(() => (window as unknown as { dataLayer: unknown[][] }).dataLayer.map((a) => Array.from(a as ArrayLike<unknown>)));
  const config = cfg.find((a) => a[0] === 'config')?.[2] as Record<string, unknown>;
  expect(config).toMatchObject({ allow_google_signals: false, allow_ad_personalization_signals: false, cookie_path: '/ics-editor/' });
  await page.getByRole('button', { name: 'Cookie settings' }).click();
  await expect(page.getByRole('region', { name: 'Consent to analytics' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('ics-editor-consent'))).toBeNull();
});
