// ICS Editor: eine Leiste, Kalender links, Monat oder Liste in der Mitte, Termin-Panel rechts. Export in einem Dialog.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { Lang } from '../../i18n/routes';
import type { Loaded, PlanRequest, PlanResult, TableInfo } from '../../lib/engine';
import type { Selection, SplitConfig } from '../../lib/plan';
import type { Column, ConvertOptions, Role } from '../../lib/table';
import { ALL, NO_CLEAN, NO_SPLIT } from '../../lib/plan';
import { DAY, todayWall, wallParts } from '../../lib/datetime';
import { call, download, latest, warmUp } from './client';
import { H, Icon, LangCtx, useT } from './ui';
import { ListView, MonthView, Panel, Sidebar, type Active, type Links, type View, type ViewCal } from './Studio';
import { DEFAULT_EXPORT, ExportDialog, exportRequest, type ExportOpts } from './Export';
import { InfoDialog, SplitDialog, TableDialog } from './Dialogs';

type Screen = 'start' | 'loading' | 'date' | 'studio';
type Dialog = 'export' | 'split' | 'info' | 'table' | null;

function detect(name: string, b: Uint8Array): 'ics' | 'zip' | 'csv' | 'xlsx' {
  const l = name.toLowerCase();
  if (b[0] === 0x50 && b[1] === 0x4b) return /\.(xlsx|xlsm|ods)$/.test(l) ? 'xlsx' : 'zip';
  if (/\.(xlsx|xlsm|xls|ods)$/.test(l) || (b[0] === 0xd0 && b[1] === 0xcf)) return 'xlsx';
  if (/\.(ics|ical|ifb)$/.test(l)) return 'ics';
  const head = new TextDecoder('latin1').decode(b.subarray(0, 64)).replace(/^﻿|^ï»¿/, '').trimStart().toUpperCase();
  return head.startsWith('BEGIN:VCALENDAR') ? 'ics' : 'csv';
}

export function defaultConvert(lang: Lang): ConvertOptions {
  return {
    tz: 'Europe/Berlin', defaultMinutes: 30, orders: {}, pii: {}, fixes: {}, birthdays: false, birthdayYearInTitle: true,
    birthdayPrefix: lang === 'de' ? 'Geburtstag: ' : 'Birthday: ', birthdayYearLabel: lang === 'de' ? 'geb. ' : 'born ',
    defaultSubject: lang === 'de' ? 'Termin' : 'Event', thisYear: new Date().getFullYear()
  };
}

const DATE_ROLES: Role[] = ['startDate', 'endDate', 'start', 'end', 'birthday'];
const dayStart = (w: number) => Math.floor(w / DAY) * DAY;

export default function Tool({ lang, h1, lead, links }: { lang: Lang; h1: string; lead: string; links: Links }) {
  return (
    <LangCtx.Provider value={lang}>
      <App h1={h1} lead={lead} links={links} />
    </LangCtx.Provider>
  );
}

function App({ h1, lead, links }: { h1: string; lead: string; links: Links }) {
  const { t, lang, n, b } = useT();
  const today = useMemo(() => todayWall(), []);
  const [screen, setScreen] = useState<Screen>('start');
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [table, setTable] = useState<TableInfo | null>(null);
  const [roles, setRoles] = useState<Record<number, Role>>({});
  const [conv, setConv] = useState<ConvertOptions>(() => defaultConvert(lang));
  const [askCols, setAskCols] = useState<number[]>([]);
  const [sel, setSel] = useState<Selection>({ ...ALL, today });
  const [split, setSplit] = useState<SplitConfig>({ ...NO_SPLIT, restName: t('s.restDefault') });
  const [opts, setOpts] = useState<ExportOpts>({ ...DEFAULT_EXPORT });
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [cals, setCals] = useState<ViewCal[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [view, setView] = useState<View>('month');
  const [cursor, setCursor] = useState(() => dayStart(today));
  const [q, setQ] = useState('');
  const [active, setActive] = useState<Active | null>(null);
  const [editsVersion, setEditsVersion] = useState(0);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [drawer, setDrawer] = useState(false);
  const [drag, setDrag] = useState(false);
  const [browsing, setBrowsing] = useState(false);
  const [hints, setHints] = useState(true);
  const [help, setHelp] = useState(false);
  const [note, setNote] = useState<{ msg: string; undo?: () => void; id: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const planLatest = useMemo(() => latest<PlanResult>(), []);
  const calsLatest = useMemo(() => latest<ViewCal[]>(), []);
  const convLatest = useMemo(() => latest<Loaded>(), []);
  const lastConvert = useRef('');
  const studio = screen === 'studio' && !!loaded;

  useEffect(() => { try { if (localStorage.getItem('ics-editor-hints') === 'off') setHints(false); } catch { /* ohne Speicher: Hinweise zeigen */ } }, []);
  useEffect(() => {
    if (!help) return;
    const close = (e: Event) => { if (e instanceof KeyboardEvent ? e.key === 'Escape' : !(e.target as HTMLElement).closest('.hint-iw')) setHelp(false); };
    addEventListener('pointerdown', close);
    addEventListener('keydown', close);
    return () => { removeEventListener('pointerdown', close); removeEventListener('keydown', close); };
  }, [help]);
  const hideHints = () => { setHints(false); setHelp(false); try { localStorage.setItem('ics-editor-hints', 'off'); } catch { /* egal */ } };

  useEffect(() => {
    const idle = (window as unknown as { requestIdleCallback?: (f: () => void) => void }).requestIdleCallback;
    if (idle) idle(() => warmUp()); else setTimeout(warmUp, 1500);
  }, []);

  // Datei offen: der Editor füllt den Bildschirm, die Seite darunter ruht.
  useEffect(() => {
    document.documentElement.classList.toggle('studio-mode', studio && !browsing);
    if (studio && !browsing) window.scrollTo(0, 0);
    if (!studio) setBrowsing(false);
  }, [studio, browsing]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[data-guides]');
      if (!a || !studio) return;
      e.preventDefault();
      setBrowsing(true);
      requestAnimationFrame(() => document.getElementById('ratgeber')?.scrollIntoView({ behavior: 'smooth' }));
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [studio]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && studio) { e.preventDefault(); searchRef.current?.focus(); }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [studio]);

  const viewReq = useMemo<PlanRequest>(() => ({ selection: { ...ALL, today, deleted: sel.deleted }, clean: NO_CLEAN, split, format: 'ics' }), [sel.deleted, split, today]);
  const exportReq = useMemo<PlanRequest | null>(() => (loaded ? exportRequest(opts, sel, split, loaded, hidden) : null), [opts, sel, split, loaded, hidden]);

  useEffect(() => {
    if (!loaded || !exportReq) return;
    const h = setTimeout(async () => { const r = await planLatest({ type: 'plan', req: exportReq }); if (r) setPlan(r); }, 120);
    return () => clearTimeout(h);
  }, [loaded, exportReq, editsVersion]);

  useEffect(() => {
    if (!loaded) return;
    const h = setTimeout(async () => { const r = await calsLatest({ type: 'calendars', req: viewReq }); if (r) setCals(r); }, 40);
    return () => clearTimeout(h);
  }, [loaded, viewReq, editsVersion]);

  // Tabelle neu umwandeln, wenn Spalten oder Optionen sich ändern
  useEffect(() => {
    if (!table || screen !== 'studio') return;
    const key = JSON.stringify([roles, conv]);
    if (key === lastConvert.current) return;
    const h = setTimeout(async () => {
      lastConvert.current = key;
      const r = await convLatest({ type: 'convert', roles, options: conv });
      if (r) { setLoaded(r); setActive(null); }
    }, 200);
    return () => clearTimeout(h);
  }, [roles, conv]);

  function toast(msg: string, undo?: () => void) { setNote({ msg, undo, id: Date.now() }); }
  useEffect(() => { if (!note) return; const h = setTimeout(() => setNote(null), note.undo ? 6000 : 4000); return () => clearTimeout(h); }, [note]);

  /** Startet den Editor beim jüngsten Monat mit Terminen, wenn heute außerhalb der Datei liegt. */
  function enter(info: Loaded) {
    setLoaded(info);
    setSel({ ...ALL, today });
    setSplit({ ...NO_SPLIT, restName: t('s.restDefault'), mode: info.calendars.length > 1 ? 'source' : 'none' });
    setOpts({ ...DEFAULT_EXPORT });
    setPlan(null);
    setHidden([]);
    setActive(null);
    setQ('');
    setView('month');
    setBrowsing(false);
    const first = Math.min(...info.calendars.map((c) => c.first ?? Infinity));
    const last = Math.max(...info.calendars.map((c) => c.mainTo ?? c.last ?? -Infinity));
    setCursor(dayStart(isFinite(first) && isFinite(last) && (today < first || today > last) ? last : today));
    setScreen('studio');
  }

  async function afterTable(info: TableInfo) {
    setTable(info);
    const r: Record<number, Role> = {};
    for (const c of info.columns) r[c.index] = c.role;
    setRoles(r);
    const birthdays = info.columns.some((c) => c.role === 'birthday');
    const o = { ...defaultConvert(lang), birthdays };
    setConv(o);
    const ask = info.columns.filter((c) => c.ambiguous && DATE_ROLES.includes(c.role)).map((c) => c.index);
    setAskCols(ask);
    if (ask.length) { setScreen('date'); return; }
    await convertAndShow(r, o);
  }

  async function convertAndShow(r: Record<number, Role>, o: ConvertOptions) {
    lastConvert.current = JSON.stringify([r, o]);
    const info = await call<Loaded>({ type: 'convert', roles: r, options: o });
    if (!info.calendars[0]?.events) { setError(t('start.empty')); setScreen('start'); return; }
    enter(info);
  }

  async function openBytes(name: string, bytes: Uint8Array) {
    const kind = detect(name, bytes);
    if (kind === 'ics' || kind === 'zip') {
      const info = await call<Loaded>({ type: 'loadIcs', name, bytes }, [bytes.buffer]);
      setTable(null);
      if (!info.calendars.some((c) => c.events > 0)) { setError(t('start.empty')); setScreen('start'); return; }
      enter(info);
    } else if (kind === 'csv') {
      await afterTable(await call<TableInfo>({ type: 'loadCsv', name, bytes }, [bytes.buffer]));
    } else {
      const { readXlsxRows } = await import('../../lib/xlsx');
      const rows = await readXlsxRows(bytes);
      await afterTable(await call<TableInfo>({ type: 'loadRows', name, rows, totalBytes: bytes.length }));
    }
  }

  async function openFiles(list: FileList | File[] | null | undefined) {
    const files = list ? [...list] : [];
    if (!files.length) return;
    setError('');
    setDialog(null);
    setScreen('loading');
    try {
      if (files.length === 1) { await openBytes(files[0].name, new Uint8Array(await files[0].arrayBuffer())); return; }
      const read = await Promise.all(files.map(async (f) => ({ name: f.name, bytes: new Uint8Array(await f.arrayBuffer()) })));
      if (!read.every((f) => ['ics', 'zip'].includes(detect(f.name, f.bytes)))) { setError(t('start.multiMixed')); setScreen('start'); return; }
      const info = await call<Loaded>({ type: 'loadIcsMany', files: read }, read.map((f) => f.bytes.buffer));
      setTable(null);
      if (!info.calendars.some((c) => c.events > 0)) { setError(t('start.empty')); setScreen('start'); return; }
      enter(info);
    } catch (e) {
      setError(t('start.error', { msg: e instanceof Error ? e.message : String(e) }));
      setScreen('start');
    }
  }

  async function sample(which: 'practice' | 'csv' | 'birthdays') {
    setError('');
    setScreen('loading');
    try {
      const r = await call<{ kind: 'ics' | 'table'; info: Loaded | TableInfo }>({ type: 'sample', which, lang });
      if (r.kind === 'ics') { setTable(null); enter(r.info as Loaded); } else await afterTable(r.info as TableInfo);
    } catch (e) {
      setError(t('start.error', { msg: e instanceof Error ? e.message : String(e) }));
      setScreen('start');
    }
  }

  async function template(which: 'csv' | 'birthdays') {
    if (which === 'csv') {
      const f = await call<{ name: string; data: Uint8Array; type: string }>({ type: 'template' });
      download(lang === 'de' ? f.name : 'google-calendar-template.csv', f.data, f.type);
      return;
    }
    const [{ writeXlsx }, { sampleBirthdayRows }] = await Promise.all([import('../../lib/xlsx'), import('../../lib/sample')]);
    const rows = lang === 'de' ? sampleBirthdayRows() : sampleBirthdayRows().map((r, i) => (i === 0 ? ['Name', 'Birthday', 'Phone'] : r));
    const data = await writeXlsx(rows, lang === 'de' ? 'Geburtstage' : 'Birthdays');
    download(lang === 'de' ? 'geburtstagsliste-vorlage.xlsx' : 'birthday-list-template.xlsx', data, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  function answerDate(order: 'dmy' | 'mdy') {
    const [col, ...rest] = askCols;
    const o = { ...conv, orders: { ...conv.orders, [col]: order } };
    setConv(o);
    setAskCols(rest);
    if (!rest.length) void convertAndShow(roles, o);
  }

  const open = () => fileRef.current?.click();
  const palette = (key: string) => {
    if (split.mode === 'rules') {
      if (key === 'rest') return 'var(--c7)';
      const i = split.targets.findIndex((x) => x.id === key);
      return `var(--c${(i < 0 ? 0 : i) % 7})`;
    }
    const i = cals.findIndex((c) => c.key === key);
    return `var(--c${(i < 0 ? 0 : i) % 8})`;
  };
  const calName = (key: string) => {
    const c = cals.find((x) => x.key === key);
    return c?.name || loaded?.calendars[0]?.name || loaded?.fileName || '';
  };
  const step = (dir: number) => {
    if (view === 'month') { const p = wallParts(cursor); setCursor(Date.UTC(p.y, p.mo - 1 + dir, 1)); }
    else setCursor(cursor + dir * 14 * DAY);
  };
  const locale = lang === 'de' ? 'de-DE' : 'en-GB';
  const title = q.trim() ? t('k.search') : view === 'month'
    ? new Date(cursor).toLocaleDateString(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' })
    : t('k.fromDay', { d: new Date(cursor).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) });
  const sp = studio ? {
    loaded: loaded!, table, viewReq, plan, cals, colorOf: palette, calName, hidden, setHidden, split, setSplit, sel, setSel, conv, setConv,
    view, setView, cursor, setCursor, q, setQ, active, setActive, editsVersion, bumpEdits: () => setEditsVersion((v) => v + 1), toast
  } : null;
  const issues = table && loaded ? (loaded.issues ?? []).filter((i) => !conv.fixes[i.row]).length + Math.max(0, (loaded.issueCount ?? 0) - (loaded.issues?.length ?? 0)) : 0;

  return (
    <div class={'app' + (studio ? ' loaded' : '') + (drawer ? ' drawer' : '') + (drag ? ' dragging' : '')}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDrag(false); }}
      onDrop={(e) => { e.preventDefault(); setDrag(false); void openFiles(e.dataTransfer?.files); }}>
      <input ref={fileRef} type="file" multiple class="sr-only" tabIndex={-1} aria-hidden="true"
        accept=".ics,.ical,.ifb,.zip,.csv,.txt,.tsv,.xlsx,.xlsm,.xls,.ods,text/calendar,text/csv"
        onChange={async (e) => { const input = e.target as HTMLInputElement; await openFiles(input.files); input.value = ''; }} />

      {studio && <header class="top">
        {studio && <button type="button" class="ib menu-btn" aria-label={t('k.menu')} aria-expanded={drawer} onClick={() => setDrawer(!drawer)}><Icon name="menu" size={18} /></button>}
        {studio ? (
          <>
            <button type="button" class="file" onClick={() => setDialog('info')} title={loaded!.fileName}>
              <Icon name="file" size={16} /><b>{loaded!.fileName}</b><span class="muted small">{b(loaded!.totalBytes)}</span><Icon name="down" size={14} />
            </button>
            <div class="nav">
              <button type="button" class="ib" aria-label={t('k.prev')} onClick={() => step(-1)} disabled={!!q.trim()}><Icon name="left" size={18} /></button>
              <button type="button" class="ib" aria-label={t('k.next')} onClick={() => step(1)} disabled={!!q.trim()}><Icon name="right" size={18} /></button>
              <button type="button" class="btn" onClick={() => { setQ(''); setCursor(dayStart(today)); }}>{t('k.today')}</button>
              <span class="title" aria-live="polite">{title}</span>
            </div>
            <div class="right">
              <label class="search"><Icon name="search" size={16} /><span class="sr-only">{t('k.searchLabel')}</span>
                <input ref={searchRef} type="search" placeholder={t('k.search')} value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
              </label>
              <div class="seg" role="group" aria-label={t('k.view')}>
                <button type="button" aria-pressed={view === 'month' && !q.trim()} onClick={() => { setView('month'); setQ(''); }}>{t('k.month')}</button>
                <button type="button" aria-pressed={view === 'list' || !!q.trim()} onClick={() => setView('list')}>{t('k.list')}</button>
              </div>
              <button type="button" class="btn primary" aria-label={t('k.export')} onClick={() => { setActive(null); setDialog('export'); }}>
                <Icon name="download" size={16} /><span class="bl">{t('k.exportShort')}<span class="bl2">{t('k.exportMore')}</span></span>
              </button>
            </div>
          </>
        ) : null}
      </header>}

      {studio && <>
        {hints && (
          <div class="hints">
            <p class="hint hint-l"><Icon name="up" size={14} /><H k="k.hint.cals" /></p>
            <span class="hint-iw">
              <button type="button" class="ib hint-i" aria-label={t('k.hint.info')} title={t('k.hint.info')} aria-expanded={help} onClick={() => setHelp(!help)}><Icon name="info" size={16} /><span class="hint-il">{t('k.hint.info')}</span></button>
              {help && (
                <div class="help" role="dialog" aria-label={t('k.help.title')}>
                  <strong>{t('k.help.title')}</strong>
                  <ul>
                    <H as="li" k="k.help.1" /><H as="li" k="k.help.2" /><H as="li" k="k.help.3" /><H as="li" k="k.help.4" />
                  </ul>
                  <a href={links.help}>{t('k.help.more')} →</a>
                </div>
              )}
            </span>
            <p class="hint hint-r"><H k="k.hint.export" /><Icon name="up" size={14} /></p>
            <button type="button" class="ib hint-x" aria-label={t('k.hint.close')} title={t('k.hint.close')} onClick={hideHints}><Icon name="x" size={14} /></button>
          </div>
        )}
        {!hints && <button type="button" class="ib hint-again" aria-label={t('k.hint.info')} title={t('k.hint.info')} onClick={() => { setHints(true); setHelp(true); }}><Icon name="info" size={16} /></button>}
      </>}
      {studio ? (
        <div class="body">
          <aside class="side" aria-label={t('k.calendars')}>
            <Sidebar {...sp!} links={links} onSplit={() => { setDrawer(false); setDialog('split'); }} onExport={() => setDialog('export')} />
          </aside>
          {drawer && <div class="scrim" onClick={() => setDrawer(false)} />}
          <section class="view" aria-label={title}>
            {issues > 0 && <div class="banner" role="status"><Icon name="warn" size={16} /> {t('k.tblBanner', { n: n(issues) })} <button type="button" class="link" onClick={() => setDialog('table')}>{t('k.tblFix')}</button></div>}
            <div class="view-in">
              {view === 'month' && !q.trim()
                ? <MonthView {...sp!} onDay={(w) => { setCursor(w); setView('list'); }} />
                : <ListView {...sp!} />}
            </div>
          </section>
          {active && <Panel {...sp!} id={active.id} calKey={active.key} />}
        </div>
      ) : screen === 'date' && table && askCols.length > 0 ? (
        <div class="start"><DateQuestion table={table} col={askCols[0]} onAnswer={answerDate} /></div>
      ) : (
        <div class="start">
          <div class="start-in">
            <h1 id="h1">{h1}</h1>
            <p class="lead">{lead}</p>
            <div class={'drop' + (drag ? ' on' : '')}>
              {screen === 'loading' ? (
                <div class="loading" role="status" aria-live="polite"><span class="spinner" aria-hidden="true" />{t('start.loading')}</div>
              ) : (
                <>
                  <Icon name="upload" size={28} />
                  <div><strong>{t('start.drop')}</strong> <span class="muted">{t('start.or')}</span></div>
                  <button type="button" class="btn primary lg" onClick={open}>{t('start.choose')}</button>
                  <span class="muted small">{t('start.types')}</span>
                </>
              )}
            </div>
            {error && <div class="error" role="alert"><Icon name="bad" size={18} /> {error}</div>}
            <p class="priv"><Icon name="lock" size={14} /> {t('k.start.priv')}</p>
            <div class="samples">
              <span class="muted">{t('k.start.samples')}</span>
              <button type="button" class="link" onClick={() => sample('practice')}>{t('start.samplePractice')}</button>
              <button type="button" class="link" onClick={() => sample('csv')}>{t('start.sampleCsv')}</button>
              <button type="button" class="link" onClick={() => sample('birthdays')}>{t('start.sampleBirthdays')}</button>
            </div>
            <div class="samples small">
              <span class="muted">{t('k.start.tpl')}</span>
              <button type="button" class="link" onClick={() => template('csv')}>{t('start.tplCsv')}</button>
              <button type="button" class="link" onClick={() => template('birthdays')}>{t('start.tplBirthdays')}</button>
            </div>
          </div>
        </div>
      )}

      {drag && <div class="drop-overlay" aria-hidden="true"><Icon name="upload" size={28} /> {t('k.drop')}</div>}

      {studio && <>
        <ExportDialog open={dialog === 'export'} onClose={() => setDialog(null)} loaded={loaded!} plan={plan} opts={opts} setOpts={setOpts} req={exportReq!}
          calCount={cals.length} hiddenCount={cals.filter((c) => hidden.includes(c.key)).length} onShowAll={() => setHidden([])} />
        <SplitDialog open={dialog === 'split'} onClose={() => setDialog(null)} loaded={loaded!} split={split} setSplit={(s) => { setSplit(s); setHidden([]); setActive(null); }} onDone={(k) => toast(t('k.splitDone', { n: k }))} />
        <InfoDialog open={dialog === 'info'} onClose={() => setDialog(null)} loaded={loaded!} table={table} sourceText={sourceTextOf(loaded!, table, t, n, b)}
          onOpen={open} onSample={(w) => void sample(w)} onTemplate={(w) => void template(w)} onTable={() => setDialog('table')} />
        {table && <TableDialog open={dialog === 'table'} onClose={() => setDialog(null)} loaded={loaded!} table={table} roles={roles} setRoles={setRoles} conv={conv} setConv={setConv} />}
      </>}

      {note && (
        <div class="toast" role="status" key={note.id}>
          <span>{note.msg}</span>
          {note.undo && <button type="button" onClick={() => { note.undo!(); setNote(null); }}>{t('k.undo')}</button>}
        </div>
      )}
    </div>
  );
}

function DateQuestion({ table, col, onAnswer }: { table: TableInfo; col: number; onAnswer: (o: 'dmy' | 'mdy') => void }) {
  const { t, lang } = useT();
  const c = table.columns.find((x) => x.index === col)!;
  const ex = c.samples[0] ?? '03/04/2025';
  const m = /^(\d{1,2})\D(\d{1,2})\D(\d{2,4})/.exec(ex);
  const fmt = (d: number, mo: number, y: number) =>
    new Date(Date.UTC(y < 100 ? 2000 + y : y, mo - 1, d)).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const a = m ? fmt(+m[1], +m[2], +m[3]) : '';
  const b = m ? fmt(+m[2], +m[1], +m[3]) : '';
  const subjectCol = table.columns.find((x) => x.role === 'subject');
  return (
    <section class="start-in question" aria-labelledby="date-q">
      <h2 id="date-q">{t('date.title')}</h2>
      <H as="p" k="date.text" v={{ col: c.header, ex, a, b }} />
      <div class="table-wrap">
        <table class="data">
          <thead><tr><th>{t('date.row')}</th><th>{t('date.value')}</th><th>{t('date.entry')}</th></tr></thead>
          <tbody>
            {table.preview.slice(0, 3).map((r, i) => <tr><td>{i + 2}</td><td><strong>{r[col]}</strong></td><td>{subjectCol ? r[subjectCol.index] : ''}</td></tr>)}
          </tbody>
        </table>
      </div>
      <div class="choices">
        <button type="button" class="choice" onClick={() => onAnswer('dmy')}><strong>{t('date.dmy', { ex, a })}</strong><span class="muted">{t('date.dmyHint')}</span></button>
        <button type="button" class="choice" onClick={() => onAnswer('mdy')}><strong>{t('date.mdy', { ex, b })}</strong><span class="muted">{t('date.mdyHint')}</span></button>
      </div>
      <p class="muted small">{t('date.tip')}</p>
    </section>
  );
}

function sourceTextOf(loaded: Loaded, table: TableInfo | null, t: ReturnType<typeof useT>['t'], n: (x: number) => string, b: (x: number) => string): string {
  const src = loaded.kind === 'table' && table
    ? t('an.source.table', { enc: table.encoding === 'windows-1252' ? 'Windows/Excel' : table.encoding === 'utf-8' ? 'UTF-8' : table.encoding, delim: t(('an.delim.' + table.delimiter) as 'an.delim.;'), rows: n(table.rowCount) })
    : /\.zip$/i.test(loaded.fileName) ? t('an.source.zip', { n: loaded.files.length }) : loaded.files.length > 1 ? t('an.source.many', { n: loaded.files.length }) : t('an.source.ics');
  return `${src} · ${b(loaded.totalBytes)} · ${loaded.calendars.length === 1 ? t('an.calCount1') : t('an.calCount', { n: loaded.calendars.length })}`;
}

export type { Column };
