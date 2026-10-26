// Atom-Feed je Sprache: alle Ratgeber mit Änderungsdatum – Frische-Signal für Suchmaschinen, Feed-Reader und Antwortmaschinen.
import { GUIDES as KEYS, SITE, BASE, url, type Lang } from '../i18n/routes';
import { GUIDES } from './guides';
import { strip } from './links';
import { LEGAL } from '../config/legal';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const iso = (d: string) => `${d}T00:00:00Z`;

export function atom(lang: Lang): Response {
  const items = [...KEYS].sort((a, b) => GUIDES[b].updated.localeCompare(GUIDES[a].updated) || a.localeCompare(b));
  const self = `${SITE}${BASE}${lang === 'de' ? '' : 'en/'}feed.xml`;
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${lang}">
  <title>${lang === 'de' ? 'ICS Editor – Ratgeber zu Google Kalender' : 'ICS Editor – Google Calendar guides'}</title>
  <id>${self}</id>
  <link rel="self" href="${self}"/>
  <link rel="alternate" type="text/html" href="${url('guides', lang)}"/>
  <updated>${iso(GUIDES[items[0]].updated)}</updated>
  <author><name>${esc(LEGAL.operator)}</name><uri>${url('about', lang)}</uri></author>
${items.map((k) => { const g = GUIDES[k][lang]; return `  <entry>
    <title>${esc(g.h1)}</title>
    <id>${url(k, lang)}</id>
    <link rel="alternate" type="text/html" href="${url(k, lang)}"/>
    <published>${iso(GUIDES[k].published)}</published>
    <updated>${iso(GUIDES[k].updated)}</updated>
    <summary>${esc(strip(g.answer))}</summary>
  </entry>`; }).join('\n')}
</feed>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' } });
}
