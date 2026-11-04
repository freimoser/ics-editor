// Rechtstexte. Alle Angaben zur Person kommen aus src/config/legal.ts.
import { ADDRESS_MISSING, LEGAL } from '../config/legal';
import { GA4_ID, CONSENT_KEY } from '../config/analytics.mjs';
import type { Lang } from '../i18n/routes';

const PLACEHOLDER = '<span class="placeholder">[ANSCHRIFT FEHLT – vor Livegang eintragen]</span>';

function address(lang: Lang): string {
  const country = lang === 'de' ? LEGAL.country : LEGAL.countryEn;
  if (ADDRESS_MISSING) return `${PLACEHOLDER}<br>${LEGAL.city}, ${country}`;
  return `${LEGAL.street}<br>${LEGAL.zip} ${LEGAL.city}<br>${country}`;
}

export interface LegalDoc { title: string; description: string; h1: string; html: string }

const OSS = [
  ['Preact', 'MIT', 'https://github.com/preactjs/preact'],
  ['Astro', 'MIT', 'https://github.com/withastro/astro'],
  ['fflate', 'MIT', 'https://github.com/101arrowz/fflate'],
  ['Papa Parse', 'MIT', 'https://github.com/mholt/PapaParse'],
  ['SheetJS Community Edition', 'Apache-2.0', 'https://git.sheetjs.com/sheetjs/sheetjs'],
  ['Geist Sans und Geist Mono (Schrift / font, Vercel)', 'SIL Open Font License 1.1', 'https://github.com/vercel/geist-font']
];
const ossList = () => '<ul>' + OSS.map(([n, l, u]) => `<li><a href="${u}" rel="noopener">${n}</a> – ${l}</li>`).join('') + '</ul>';

/** Abschnitte der Datenschutzerklärung; Nummern werden hier vergeben, nie von Hand (Abschnitt Google Analytics ist bedingt). */
function privacy(lang: Lang): string {
  const de = lang === 'de';
  const ga = !!GA4_ID;
  const reset = `<button type="button" class="link" data-consent-reset>${de ? 'Cookie-Einstellungen öffnen' : 'Open cookie settings'}</button>`;
  const summary = de
    ? (ga
      ? 'Deine Dateien verlassen dein Gerät nicht – das Werkzeug arbeitet ausschließlich in deinem Browser. Google Analytics läuft nur, wenn du im Banner zustimmst; ohne Zustimmung setzt die Seite keine Cookies und lädt nichts von Dritten nach. GitHub verarbeitet als Hoster beim Aufruf technische Zugriffsdaten wie deine IP-Adresse.'
      : 'Deine Dateien verlassen dein Gerät nicht – das Werkzeug arbeitet ausschließlich in deinem Browser. Diese Website setzt keine Cookies, misst nichts und lädt nichts von Dritten nach. Nur GitHub verarbeitet als Hoster beim Aufruf technische Zugriffsdaten wie deine IP-Adresse.')
    : (ga
      ? 'Your files never leave your device – the tool works exclusively in your browser. Google Analytics only runs if you agree in the banner; without consent the site sets no cookies and loads nothing from third parties. GitHub, as the host, processes technical access data such as your IP address when you visit.'
      : 'Your files never leave your device – the tool works exclusively in your browser. This website sets no cookies, measures nothing and loads nothing from third parties. Only GitHub, as the host, processes technical access data such as your IP address when you visit.');

  const sections: [string, string][] = de ? [
    ['Verantwortlicher', `<p>${LEGAL.operator}<br>${address('de')}<br>E-Mail: ${LEGAL.emailDisplay}</p>`],
    ['Hosting bei GitHub Pages', `<p>Diese Website wird über GitHub Pages ausgeliefert, einen Dienst der GitHub, Inc. (USA). Laut GitHub wird beim Aufruf einer GitHub-Pages-Seite die IP-Adresse der Besucherin oder des Besuchers aus Sicherheitsgründen protokolliert und gespeichert – unabhängig davon, ob man bei GitHub angemeldet ist (<a href="https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection" rel="noopener">GitHub-Dokumentation</a>). Zusätzlich fallen technisch notwendige Angaben wie aufgerufene Adresse, Zeitpunkt und Browserkennung an.</p>
<p>Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO: Ich habe ein berechtigtes Interesse daran, die Website sicher und zuverlässig auszuliefern. Dabei können Daten in die USA übermittelt werden. Wie GitHub mit diesen Daten umgeht und auf welcher Grundlage die Übermittlung erfolgt, beschreibt die <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" rel="noopener">Datenschutzerklärung von GitHub</a>. Auf diese Protokolle habe ich keinen Zugriff.</p>`],
    ['Das Werkzeug: Verarbeitung nur auf deinem Gerät', `<p>Dateien, die du im Werkzeug öffnest (CSV, Excel, ICS, ZIP), werden ausschließlich im Arbeitsspeicher deines Browsers verarbeitet. Sie werden nicht hochgeladen, nicht an mich oder Dritte übermittelt – auch nicht an Google Analytics – und nicht dauerhaft gespeichert. Schließt du die Seite, sind sie weg.</p>
<p>Das ist technisch abgesichert: Die Seite gibt sich eine Sicherheitsrichtlinie (Content-Security-Policy), deren Regel <code>connect-src</code> nur die öffentliche Datei <code>robots.txt</code> dieser Domain erlaubt${ga ? ' sowie die Adressen von Google Analytics, die erst nach deiner Einwilligung angesprochen werden' : ''}. Jede andere Verbindung blockiert der Browser. Ein automatischer Test prüft bei jeder Änderung, dass beim Verarbeiten einer Datei keine einzige Netzwerkanfrage entsteht. Die Rechenarbeit läuft in einem Web Worker, für den dieselbe Richtlinie gilt.</p>
<p>Enthalten deine Dateien personenbezogene Daten Dritter – etwa Patienten- oder Kundendaten, auch Gesundheitsdaten im Sinne von Art. 9 DSGVO –, erhalte ich davon nichts. Für den späteren Import in Google Kalender bist du selbst verantwortlich; das Werkzeug hilft, solche Angaben vorher wegzulassen oder zu kürzen.</p>`],
    [ga ? 'Cookies und lokaler Speicher' : 'Keine Cookies, keine Messung, keine Dritten', `<p>${ga ? 'Ohne deine Einwilligung setzt diese Website keine Cookies, verwendet keine Analyse- oder Werbedienste und bindet keine Inhalte Dritter ein.' : 'Diese Website setzt keine Cookies, verwendet keine Analyse- oder Werbedienste und bindet keine Inhalte Dritter ein.'} Schriften und alle Programmteile werden von derselben Adresse geladen.</p>
<p>Damit das Werkzeug nach dem ersten Besuch auch ohne Internet läuft, legt dein Browser die Dateien dieser Website (Seiten, Programmcode, Schrift) in einem Zwischenspeicher ab (Service Worker). Darin stehen <strong>keine Angaben über dich</strong> und keine Kennung. Du kannst den Zwischenspeicher jederzeit in den Browser-Einstellungen löschen.</p>
<p>Blendest du im Editor die Hinweise mit „×“ aus, merkt sich dein Browser nur diese eine Einstellung (Eintrag „ics-editor-hints“ im lokalen Speicher). Er enthält keine Kalenderdaten und keine Kennung und wird nicht übertragen.</p>${ga ? `
<p>Deine Entscheidung im Einwilligungs-Banner speichert dein Browser im lokalen Speicher (Eintrag „${CONSENT_KEY}“ mit Wert und Zeitpunkt), damit das Banner nicht bei jedem Aufruf erscheint. Das ist für den von dir gewünschten Dienst unbedingt erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG); der Eintrag wird nicht übertragen.</p>` : ''}`],
    ...(ga ? [['Google Analytics (nur mit Einwilligung)', `<p>Wenn du im Banner auf „Zustimmen“ klickst, lädt die Seite Google Analytics 4, einen Analysedienst der Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland („Google“). Vorher wird weder ein Skript von Google geladen noch ein Cookie gesetzt.</p>
<ul>
<li><strong>Zweck:</strong> Statistik darüber, welche Seiten wie genutzt werden, um Inhalte und Werkzeug zu verbessern.</li>
<li><strong>Rechtsgrundlage:</strong> deine Einwilligung, Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG.</li>
<li><strong>Verarbeitete Daten:</strong> aufgerufene Seiten und Verweildauer, Herkunftsseite, Gerät, Browser, Bildschirmgröße, Sprache und ungefährer Standort (Land, Region), eine zufällige Kennung in den Cookies <code>_ga</code> und <code>_ga_${GA4_ID.replace(/^G-/, '')}</code> (Speicherdauer bis zu einem Jahr). Laut Google speichert Google Analytics 4 keine IP-Adressen.</li>
<li><strong>Nicht übertragen werden</strong> deine Dateien, Kalendernamen, Termine oder Dateinamen. Google-Signale und Werbefunktionen sind ausgeschaltet.</li>
<li><strong>Empfänger und Drittland:</strong> Google; Daten können an die Google LLC in den USA übermittelt werden. Die Google LLC ist nach dem EU-US Data Privacy Framework zertifiziert, für das die EU-Kommission am 10. Juli 2023 einen Angemessenheitsbeschluss erlassen hat (Art. 45 DSGVO). Mit Google besteht ein Vertrag zur Auftragsverarbeitung.</li>
<li><strong>Speicherdauer bei Google:</strong> Ereignisdaten werden nach zwei Monaten gelöscht.</li>
<li><strong>Widerruf:</strong> jederzeit mit Wirkung für die Zukunft über „Cookie-Einstellungen“ in der Fußzeile oder hier: ${reset}. Danach werden die Analytics-Cookies gelöscht und es wird nicht mehr gemessen.</li>
</ul>
<p>Mehr dazu in der <a href="https://policies.google.com/privacy" rel="noopener">Datenschutzerklärung von Google</a>.</p>`] as [string, string]] : []),
    ['Google Search Console und Bing Webmaster Tools', `<p>Diese Website ist in der Google Search Console und in den Bing Webmaster Tools (Microsoft) angemeldet. <strong>Dabei wird nichts in deinem Browser geladen und nichts über dich an mich übermittelt.</strong> Der Inhabernachweis besteht jeweils aus einer Zeile im Quelltext der Seite, die dein Browser nicht ausführt; es gibt kein Skript, kein Cookie und keinen Zählpixel. Die Daten in diesen Diensten entstehen bei Google bzw. Microsoft im Rahmen der Suche – unabhängig davon, ob du diese Website je aufrufst – und ich sehe sie nur zusammengefasst. Für eine Auskunft zu deinen Suchdaten sind Google bzw. Microsoft die richtigen Ansprechpartner.</p>`],
    ['Kontakt per E-Mail', `<p>Schreibst du mir eine E-Mail, verarbeite ich deine Angaben, um die Anfrage zu beantworten (Art. 6 Abs. 1 lit. f DSGVO). Die Nachricht lösche ich, wenn sie erledigt ist und keine Aufbewahrungspflicht besteht.</p>`],
    ['Deine Rechte', `<p>Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21)${ga ? ' sowie das Recht, eine Einwilligung jederzeit zu widerrufen (Art. 7 Abs. 3 DSGVO); die Rechtmäßigkeit der bis dahin erfolgten Verarbeitung bleibt unberührt' : ''}. Außerdem kannst du dich bei einer Datenschutz-Aufsichtsbehörde beschweren, zum Beispiel beim <a href="https://www.lda.bayern.de" rel="noopener">Bayerischen Landesamt für Datenschutzaufsicht</a>.</p>`],
    ['Keine automatisierte Entscheidungsfindung', `<p>Es findet keine automatisierte Entscheidungsfindung und kein Profiling statt.</p>`]
  ] : [
    ['Controller', `<p>${LEGAL.operator}<br>${address('en')}<br>Email: ${LEGAL.emailDisplay}</p>`],
    ['Hosting on GitHub Pages', `<p>This website is served via GitHub Pages, a service of GitHub, Inc. (USA). According to GitHub, when a GitHub Pages site is visited, the visitor’s IP address is logged and stored for security purposes, regardless of whether the visitor is signed in to GitHub (<a href="https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection" rel="noopener">GitHub documentation</a>). Technically necessary details such as the requested address, time and browser identifier are also processed.</p>
<p>The legal basis is Art. 6(1)(f) GDPR: I have a legitimate interest in delivering the website securely and reliably. Data may be transferred to the USA. How GitHub handles this data and on what basis transfers take place is described in <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" rel="noopener">GitHub’s privacy statement</a>. I have no access to these logs.</p>`],
    ['The tool: processing on your device only', `<p>Files you open in the tool (CSV, Excel, ICS, ZIP) are processed exclusively in your browser’s memory. They are not uploaded, not sent to me or third parties – not to Google Analytics either – and not stored permanently. When you close the page, they are gone.</p>
<p>This is enforced technically: the page sets a Content Security Policy whose <code>connect-src</code> rule only allows this domain’s public <code>robots.txt</code>${ga ? ' plus the Google Analytics addresses, which are only contacted after you consent' : ''}. The browser blocks every other connection. An automated test checks with every change that processing a file causes no network request at all. The computation runs in a web worker subject to the same policy.</p>
<p>If your files contain personal data of third parties – such as patient or customer data, including health data within the meaning of Art. 9 GDPR – I receive none of it. You are responsible for any later import into Google Calendar; the tool helps you leave out or shorten such details beforehand.</p>`],
    [ga ? 'Cookies and local storage' : 'No cookies, no measurement, no third parties', `<p>${ga ? 'Without your consent, this website sets no cookies, uses no analytics or advertising services and embeds no third-party content.' : 'This website sets no cookies, uses no analytics or advertising services and embeds no third-party content.'} Fonts and all program code are loaded from the same address.</p>
<p>So that the tool also works offline after your first visit, your browser keeps this website’s files (pages, program code, font) in a cache (service worker). It contains <strong>no information about you</strong> and no identifier. You can clear it at any time in your browser settings.</p>
<p>If you hide the tips in the editor with “×”, your browser only remembers this one setting (entry “ics-editor-hints” in local storage). It contains no calendar data and no identifier and is never transmitted.</p>${ga ? `
<p>Your choice in the consent banner is stored in your browser’s local storage (entry “${CONSENT_KEY}” with value and time) so that the banner doesn’t appear on every visit. This is strictly necessary for the service you requested (§ 25(2) no. 2 TDDDG); the entry is never transmitted.</p>` : ''}`],
    ...(ga ? [['Google Analytics (only with consent)', `<p>If you click “Accept” in the banner, the page loads Google Analytics 4, an analytics service of Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland (“Google”). Before that, no script from Google is loaded and no cookie is set.</p>
<ul>
<li><strong>Purpose:</strong> statistics on which pages are used and how, to improve content and the tool.</li>
<li><strong>Legal basis:</strong> your consent, Art. 6(1)(a) GDPR and § 25(1) TDDDG.</li>
<li><strong>Data processed:</strong> pages viewed and time spent, referring page, device, browser, screen size, language and approximate location (country, region), a random identifier in the cookies <code>_ga</code> and <code>_ga_${GA4_ID.replace(/^G-/, '')}</code> (stored for up to one year). According to Google, Google Analytics 4 does not store IP addresses.</li>
<li><strong>Never sent:</strong> your files, calendar names, events or file names. Google signals and advertising features are switched off.</li>
<li><strong>Recipients and third country:</strong> Google; data may be transferred to Google LLC in the USA. Google LLC is certified under the EU-US Data Privacy Framework, for which the European Commission adopted an adequacy decision on 10 July 2023 (Art. 45 GDPR). A data processing agreement with Google is in place.</li>
<li><strong>Retention at Google:</strong> event data is deleted after two months.</li>
<li><strong>Withdrawal:</strong> at any time with effect for the future via “Cookie settings” in the footer or here: ${reset}. The analytics cookies are then deleted and nothing more is measured.</li>
</ul>
<p>More in <a href="https://policies.google.com/privacy" rel="noopener">Google’s privacy policy</a>.</p>`] as [string, string]] : []),
    ['Google Search Console and Bing Webmaster Tools', `<p>This website is registered in Google Search Console and Bing Webmaster Tools (Microsoft). <strong>Nothing is loaded in your browser and nothing about you is sent to me.</strong> Ownership is verified by a line in the page source that your browser doesn’t execute; there is no script, no cookie and no tracking pixel. The data in these services is generated by Google or Microsoft as part of search – regardless of whether you ever visit this website – and I only see it in aggregate. For information about your search data, Google or Microsoft is the right contact.</p>`],
    ['Contact by email', `<p>If you email me, I process your details to answer your request (Art. 6(1)(f) GDPR). I delete the message once it has been dealt with and no retention obligation applies.</p>`],
    ['Your rights', `<p>You have the right of access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18), data portability (Art. 20) and objection (Art. 21)${ga ? ', and the right to withdraw consent at any time (Art. 7(3) GDPR) without affecting the lawfulness of processing before the withdrawal' : ''}. You can also lodge a complaint with a data protection supervisory authority, for example the <a href="https://www.lda.bayern.de" rel="noopener">Bavarian Data Protection Authority (BayLDA)</a>.</p>`],
    ['No automated decision-making', `<p>There is no automated decision-making and no profiling.</p>`]
  ];
  return `
<div class="cta"><div class="cta-text"><div class="cta-title">${de ? 'Das Wichtigste in drei Sätzen' : 'The essentials in three sentences'}</div>
<p class="m0">${summary}</p></div></div>
${sections.map(([h, body], i) => `<h2>${i + 1}. ${h}</h2>\n${body}`).join('\n')}
<p class="muted">${de ? 'Stand: 4. November 2026' : 'As of 4 November 2026'}</p>`;
}

export const LEGAL_PAGES: Record<'imprint' | 'privacy' | 'terms', Record<Lang, LegalDoc>> = {
  imprint: {
    de: {
      title: 'Impressum – ICS Editor',
      description: 'Impressum von ICS Editor nach § 5 DDG.',
      h1: 'Impressum',
      html: `
<h2>Angaben gemäß § 5 DDG</h2>
<p><strong>${LEGAL.operator}</strong><br>${address('de')}</p>
<h2>Kontakt</h2>
<p>E-Mail: ${LEGAL.emailDisplay}<br>LinkedIn: <a href="${LEGAL.linkedin}" rel="noopener">linkedin.com/in/freimoser</a></p>
<h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
<p>${LEGAL.responsible}<br>(Anschrift wie oben)</p>
<h2>Verbraucherstreitbeilegung</h2>
<p>Ich bin nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
<h2>Haftung und Urheberrecht</h2>
<p>Hinweise zur Haftung für Inhalte und Links sowie zum Urheberrecht stehen in den <a href="../nutzungsbedingungen/">Nutzungsbedingungen</a>.</p>`
    },
    en: {
      title: 'Legal notice – ICS Editor',
      description: 'Legal notice (Impressum) of ICS Editor according to § 5 DDG.',
      h1: 'Legal notice',
      html: `
<p class="muted">This page is a translation of the German Impressum required by § 5 DDG (German Digital Services Act).</p>
<h2>Provider</h2>
<p><strong>${LEGAL.operator}</strong><br>${address('en')}</p>
<h2>Contact</h2>
<p>Email: ${LEGAL.emailDisplay}<br>LinkedIn: <a href="${LEGAL.linkedin}" rel="noopener">linkedin.com/in/freimoser</a></p>
<h2>Responsible for content (§ 18(2) MStV)</h2>
<p>${LEGAL.responsible}<br>(address as above)</p>
<h2>Consumer dispute resolution</h2>
<p>I am neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board.</p>
<h2>Liability and copyright</h2>
<p>Notes on liability for content and links and on copyright are in the <a href="../terms/">terms of use</a>.</p>`
    }
  },
  privacy: {
    de: {
      title: 'Datenschutz – ICS Editor',
      description: GA4_ID
        ? 'Datenschutzerklärung: Deine Dateien verlassen dein Gerät nicht. Google Analytics nur mit Einwilligung. GitHub verarbeitet als Hoster Zugriffsdaten.'
        : 'Datenschutzerklärung: Deine Dateien verlassen dein Gerät nicht. Keine Cookies, kein Tracking. Nur GitHub verarbeitet als Hoster Zugriffsdaten.',
      h1: 'Datenschutzerklärung',
      html: privacy('de')
    },
    en: {
      title: 'Privacy – ICS Editor',
      description: GA4_ID
        ? 'Privacy policy: your files never leave your device. Google Analytics only with consent. GitHub, as host, processes access data.'
        : 'Privacy policy: your files never leave your device. No cookies, no tracking. Only GitHub, as host, processes access data.',
      h1: 'Privacy policy',
      html: privacy('en')
    }
  },
  terms: {
    de: {
      title: 'Nutzungsbedingungen – ICS Editor',
      description: 'Nutzungsbedingungen und Haftungshinweise für das kostenlose Werkzeug ICS Editor.',
      h1: 'Nutzungsbedingungen und Haftung',
      html: `
<h2>1. Kostenlos und ohne Anmeldung</h2>
<p>ICS Editor ist ein kostenloses Werkzeug. Es gibt keine Anmeldung, keinen Kauf und kein Abonnement. Weil dabei kein Vertrag mit Leistungspflichten entsteht, gibt es keine Allgemeinen Geschäftsbedingungen – diese Seite fasst zusammen, was du wissen solltest.</p>
<h2>2. Ergebnisse prüfen</h2>
<p>Das Werkzeug wurde sorgfältig entwickelt und automatisch getestet. Trotzdem kann ich nicht garantieren, dass jede Datei fehlerfrei umgewandelt wird. Prüfe das Ergebnis bitte, bevor du dich darauf verlässt. Importiere am besten zuerst in einen neuen, leeren Kalender – den kannst du bei Bedarf komplett löschen.</p>
<h2>3. Deine Verantwortung für die Daten</h2>
<p>Deine Dateien bleiben auf deinem Gerät. Was du anschließend in Google Kalender oder ein anderes Programm importierst, liegt in deiner Verantwortung – insbesondere, wenn die Termine personenbezogene Daten Dritter enthalten, zum Beispiel Patienten- oder Kundendaten.</p>
<h2>4. Haftung</h2>
<p>Ich hafte unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit. Im Übrigen ist die Haftung für das unentgeltliche Werkzeug ausgeschlossen, soweit gesetzlich zulässig.</p>
<h2>5. Haftung für Inhalte und Links</h2>
<p>Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt; die Angaben zu Google Kalender stammen aus der Hilfe von Google (Stand siehe jeweilige Seite). Für Richtigkeit, Vollständigkeit und Aktualität kann ich keine Gewähr übernehmen. Als Diensteanbieter bin ich nach § 7 Abs. 1 DDG für eigene Inhalte nach den allgemeinen Gesetzen verantwortlich. Für Inhalte verlinkter fremder Websites ist stets deren Anbieter verantwortlich.</p>
<h2>6. Marken</h2>
<p>Google und Google Kalender sind Marken der Google LLC. Diese Website ist ein unabhängiges Angebot und steht in keiner Verbindung zu Google.</p>
<h2>7. Urheberrecht und Open-Source-Software</h2>
<p>Die Inhalte dieser Website unterliegen dem deutschen Urheberrecht. Das Werkzeug verwendet folgende Open-Source-Software unter ihren jeweiligen Lizenzen:</p>
${ossList()}`
    },
    en: {
      title: 'Terms of use – ICS Editor',
      description: 'Terms of use and liability notes for the free tool ICS Editor.',
      h1: 'Terms of use and liability',
      html: `
<h2>1. Free and without sign-up</h2>
<p>ICS Editor is a free tool. There is no sign-up, no purchase and no subscription. Since no contract with performance obligations is formed, there are no general terms and conditions – this page summarises what you should know.</p>
<h2>2. Check the results</h2>
<p>The tool has been developed carefully and is tested automatically. Still, I can’t guarantee that every file will be converted without errors. Please check the result before relying on it. Ideally, import into a new, empty calendar first – you can delete it completely if needed.</p>
<h2>3. Your responsibility for the data</h2>
<p>Your files stay on your device. What you then import into Google Calendar or another app is your responsibility – especially if the events contain personal data of third parties, such as patient or customer data.</p>
<h2>4. Liability</h2>
<p>I am liable without limitation for intent and gross negligence and for damage resulting from injury to life, body or health. Otherwise, liability for this free tool is excluded to the extent permitted by law.</p>
<h2>5. Liability for content and links</h2>
<p>The content of this website has been created with great care; information about Google Calendar comes from Google’s help pages (see the date on each page). I can’t guarantee accuracy, completeness or timeliness. As a service provider I am responsible for my own content under § 7(1) DDG in accordance with general law. The respective provider is always responsible for the content of linked third-party websites.</p>
<h2>6. Trademarks</h2>
<p>Google and Google Calendar are trademarks of Google LLC. This website is an independent offering and is not affiliated with Google.</p>
<h2>7. Copyright and open-source software</h2>
<p>The content of this website is protected by German copyright law. The tool uses the following open-source software under its respective licences:</p>
${ossList()}`
    }
  }
};
