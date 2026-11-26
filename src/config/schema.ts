// Gemeinsame Knoten für strukturierte Daten: einmal mit @id definiert, überall per Verweis genutzt.
// So erkennen Suchmaschinen, dass Autor, Herausgeber und Website auf allen Seiten und in beiden Sprachen dieselben sind.
import { LEGAL } from './legal';
import { SITE, BASE, url, asset } from '../i18n/routes';

const ROOT = SITE + BASE;
export const IDS = { person: ROOT + '#person', website: ROOT + '#website', app: ROOT + '#app' } as const;
export const PERSON_REF = { '@id': IDS.person };

/** Der Betreiber – vollständig auf jeder Seite, damit jede Seite für sich gültig ist */
export const PERSON = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': IDS.person,
  name: LEGAL.operator,
  url: url('about', 'de'),
  sameAs: [LEGAL.linkedin, LEGAL.website, LEGAL.repo.replace(/\/ics-editor$/, '')]
};

export const WEBSITE = (lang: 'de' | 'en') => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': IDS.website,
  name: 'ICS Editor',
  alternateName: 'ICS Editor by Freimoser',
  url: url('home', lang),
  inLanguage: ['de', 'en'],
  publisher: PERSON_REF
});

export const LOGO = SITE + asset('icon-512.png');
