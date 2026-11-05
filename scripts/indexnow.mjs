// IndexNow: meldet nach jedem Deploy alle Adressen der Live-Sitemap an Bing, Yandex & Co. (https://www.indexnow.org).
// Der Schlüssel liegt öffentlich unter /ics-editor/<KEY>.txt – so dürfen nur Adressen unter /ics-editor/ gemeldet werden.
// Google nutzt IndexNow nicht; dort liest die Search Console die Sitemap.
const KEY = 'a780ed1391e74ecc5f2ec4f55bd18766';
const SITE = 'https://freimoser.github.io/ics-editor/';

const xml = await (await fetch(SITE + 'sitemap.xml')).text();
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => u.startsWith(SITE));
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: 'freimoser.github.io', key: KEY, keyLocation: SITE + KEY + '.txt', urlList })
});
console.log(`IndexNow: ${urlList.length} Adressen gemeldet → HTTP ${res.status}`);
if (res.status >= 400) process.exit(1);
