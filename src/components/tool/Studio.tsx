// Der Editor im Kalender-Stil: Seitenleiste mit Kalendern, Monat oder Liste, Termin-Panel.
// Die Ansicht zeigt immer alle Termine; Zeitraum und Aufräumen wirken nur auf den Export.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { EventDetail, EventRow, Loaded, MonthResult, PlanRequest, PlanResult, TableInfo } from '../../lib/engine';
import type { Selection, SplitConfig } from '../../lib/plan';
import type { ConvertOptions } from '../../lib/table';
import type { Patch } from '../../lib/edit';
import { DAY, isoDay, todayWall, wallParts } from '../../lib/datetime';
import { call } from './client';
import { H, Icon, useT } from './ui';
import type { UiKey } from '../../i18n/ui';

export type View = 'month' | 'list';
export interface ViewCal { key: string; name: string; events: number }
export interface Active { id: number; key: string }
export interface Links { home: string; guides: string; lang: string; langLabel: string; langCode: string; imprint: string; privacy: string; about: string }

export interface StudioProps {
  loaded: Loaded; table: TableInfo | null; viewReq: PlanRequest; plan: PlanResult | null;
  cals: ViewCal[]; colorOf: (key: string) => string; calName: (key: string) => string;
  hidden: string[]; setHidden: (h: string[]) => void;
  split: SplitConfig; setSplit: (s: SplitConfig) => void;
  sel: Selection; setSel: (s: Selection) => void; conv: ConvertOptions; setConv: (c: ConvertOptions) => void;
  view: View; setView: (v: View) => void; cursor: number; setCursor: (w: number) => void; q: string; setQ: (q: string) => void;
  active: Active | null; setActive: (a: Active | null) => void; editsVersion: number; bumpEdits: () => void;
  toast: (msg: string, undo?: () => void) => void;
}

const hm = (w: number | null) => { if (w === null) return ''; const p = wallParts(w); return `${String(p.h).padStart(2, '0')}:${String(p.mi).padStart(2, '0')}`; };
const dayStart = (w: number) => Math.floor(w / DAY) * DAY;
export const narrow = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 860px)').matches;

// ---------------------------------------------------------------- Seitenleiste

const SUGGEST_KINDS = ['initials', 'categories', 'organizer', 'prefix'] as const;
export const bestSuggestion = (loaded: Loaded) => {
  for (const k of SUGGEST_KINDS) { const s = loaded.suggestions.find((x) => x.kind === k && x.values.length >= 2); if (s) return s; }
  return null;
};

export function Sidebar(p: StudioProps & { links: Links; onSplit: () => void; onExport: () => void; onGuides: () => void }) {
  const { t, n, b, lang } = useT();
  const sg = p.split.mode === 'rules' ? null : bestSuggestion(p.loaded);
  const parts = p.plan ? (p.plan.format === 'csv' ? p.plan.csv.parts : p.plan.ics.parts) : 0;
  const bytes = p.plan ? (p.plan.format === 'csv' ? p.plan.csv.bytes : p.plan.ics.bytes) : 0;
  const files = parts === 1 ? t('k.files1') : t('k.filesN', { n: parts });
  const tooBig = !!p.plan && parts > p.plan.calendars.length;
  const toggle = (k: string) => p.setHidden(p.hidden.includes(k) ? p.hidden.filter((x) => x !== k) : [...p.hidden, k]);
  return (
    <>
      <section aria-labelledby="side-cals">
        <div class="label-row">
          <h2 id="side-cals" class="label">{t('k.calendars')}</h2>
          {p.cals.length > 1 && (p.hidden.length > 0
            ? <button type="button" class="link small" aria-label={t('k.allShowL')} onClick={() => p.setHidden([])}>{t('k.allShow')}</button>
            : <button type="button" class="link small" aria-label={t('k.allHideL')} onClick={() => p.setHidden(p.cals.map((c) => c.key))}>{t('k.allHide')}</button>)}
        </div>
        <ul class="cals">
          {p.cals.map((c) => (
            <li><label class="cal">
              <input type="checkbox" class="cbx" checked={!p.hidden.includes(c.key)} onChange={() => toggle(c.key)} style={{ '--c': p.colorOf(c.key) }} />
              <span class="break">{p.calName(c.key)}</span><em>{n(c.events)}</em>
            </label></li>
          ))}
        </ul>
        {p.split.mode === 'rules' && <button type="button" class="link small" onClick={() => { p.setSplit({ ...p.split, mode: p.loaded.calendars.length > 1 ? 'source' : 'none', manual: {} }); p.setHidden([]); }}>{t('k.unsplit')}</button>}
      </section>
      {sg && (
        <section class="suggest" aria-labelledby="side-sg">
          <h2 id="side-sg" class="sg-t"><Icon name="users" size={16} />{t(('k.sg.' + sg.kind) as UiKey, { n: sg.values.length })}</h2>
          <div class="sg-tags">{sg.values.slice(0, 12).map((v) => <span class="break">{v.value}</span>)}{sg.values.length > 12 && <span>…</span>}</div>
          <p>{t(('k.sg.' + sg.kind + 'Text') as UiKey)}</p>
          <button type="button" class="btn block" onClick={p.onSplit}><Icon name="split" size={16} /> {t('k.split')}</button>
        </section>
      )}
      <div class="s-foot">
        {p.plan && (
          <button type="button" class="s-status" onClick={p.onExport}>
            <Icon name={tooBig ? 'info' : 'ok'} size={16} />
            <H k={tooBig ? 'k.statusBig' : 'k.status'} v={{ size: b(bytes), files }} />
          </button>
        )}
        <nav class="links" aria-label={t('nav.main')}>
          <a href={p.links.guides} onClick={(e) => { e.preventDefault(); p.onGuides(); }}>{t('nav.guides')}</a>
          <a href={p.links.about}>{lang === 'de' ? 'Über' : 'About'}</a>
          <a href={p.links.imprint}>{lang === 'de' ? 'Impressum' : 'Legal notice'}</a>
          <a href={p.links.privacy}>{lang === 'de' ? 'Datenschutz' : 'Privacy'}</a>
          <a href={p.links.lang} hreflang={p.links.langCode} lang={p.links.langCode}>{p.links.langLabel}</a>
        </nav>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- Monat

export function MonthView(p: StudioProps & { onDay: (w: number) => void }) {
  const { t, lang } = useT();
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(4);
  const [res, setRes] = useState<MonthResult | null>(null);
  const { y, mo } = wallParts(p.cursor);
  const m = mo - 1;
  const first = Date.UTC(y, m, 1);
  const off = (new Date(first).getUTCDay() + 6) % 7;
  const nd = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const rows = Math.ceil((off + nd) / 7);
  const today = useMemo(() => dayStart(todayWall()), []);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setFit(Math.max(1, Math.floor(((el.clientHeight - 30) / rows - 30) / 22)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [rows]);
  useEffect(() => {
    const h = setTimeout(async () => setRes(await call<MonthResult>({ type: 'month', req: p.viewReq, query: '', focus: null, year: y, month: m, perDay: fit, hidden: p.hidden })), 40);
    return () => clearTimeout(h);
  }, [y, m, fit, p.viewReq, p.hidden, p.editsVersion, p.loaded]);
  const byDay = new Map((res && res.year === y && res.month === m ? res.days : []).map((d) => [d.day, d]));
  const locale = lang === 'de' ? 'de-DE' : 'en-GB';
  const wd = [...Array(7)].map((_, i) => new Date(Date.UTC(2024, 0, 1 + i)).toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' }).replace('.', ''));
  const cells = [...Array(rows * 7)].map((_, i) => first + (i - off) * DAY);
  const mon = (w: number) => new Date(w).toLocaleDateString(locale, { month: 'short', timeZone: 'UTC' });
  return (
    <div class="month" ref={ref} style={{ '--rows': rows }} role="grid" aria-label={new Date(first).toLocaleDateString(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' })}>
      {wd.map((w) => <div class="wdn" role="columnheader">{w}</div>)}
      {cells.map((w, i) => {
        const inMonth = w >= first && w < first + nd * DAY;
        const d = new Date(w).getUTCDate();
        const day = inMonth ? byDay.get(d) : undefined;
        const items = day ? (day.more > 0 ? day.items.slice(0, Math.max(0, day.items.length - 1)) : day.items) : [];
        const more = day ? day.more + (day.items.length - items.length) : 0;
        const label = new Date(w).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
        return (
          <div role="gridcell" class={'cell' + (inMonth ? '' : ' other') + (w === today ? ' today' : '') + (i % 7 > 4 ? ' we' : '')} onClick={(e) => { if (narrow() && !(e.target as HTMLElement).closest('button')) p.onDay(w); }}>
            <button type="button" class="num" aria-label={t('k.dayList', { d: label })} onClick={() => p.onDay(w)}>{d === 1 ? `${d}. ${mon(w)}` : d}</button>
            <div class="evs">
              {items.map((it) => (
                <button type="button" class={'chip' + (it.allDay ? ' allday' : '') + (it.deleted ? ' del' : '') + (it.edited ? ' ed' : '') + (p.active?.id === it.id ? ' on' : '')}
                  style={{ '--c': p.colorOf(it.key) }} title={(it.allDay ? '' : hm(it.start) + ' ') + it.summary} onClick={() => p.setActive({ id: it.id, key: it.key })}>
                  {!it.allDay && <><i class="dot" /><span class="t">{hm(it.start)}</span></>}<span class="tt">{it.summary || '–'}</span>
                </button>
              ))}
              {more > 0 && <button type="button" class="more" onClick={() => p.onDay(w)}>{t('k.more', { n: more })}</button>}
            </div>
            {day && <div class="dots" aria-hidden="true">{day.items.slice(0, 6).map((it) => <i class="dot" style={{ '--c': p.colorOf(it.key) }} />)}</div>}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------- Liste

const PAGE = 150;

export function ListView(p: StudioProps) {
  const { t, n, lang } = useT();
  const [limit, setLimit] = useState(PAGE);
  const [res, setRes] = useState<{ rows: EventRow[]; total: number } | null>(null);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const search = p.q.trim() !== '';
  useEffect(() => { setLimit(PAGE); setChecked(new Set()); }, [p.q, p.cursor, p.hidden]);
  useEffect(() => {
    const h = setTimeout(async () => setRes(await call({ type: 'list', req: p.viewReq, query: p.q, focus: null, offset: 0, limit, order: search ? 'desc' : 'asc', hidden: p.hidden, from: search ? null : p.cursor })), search ? 150 : 30);
    return () => clearTimeout(h);
  }, [p.q, p.cursor, p.viewReq, p.hidden, limit, p.editsVersion, p.loaded]);
  const rows = res?.rows ?? [];
  const locale = lang === 'de' ? 'de-DE' : 'en-GB';
  const groups: { day: number; rows: EventRow[] }[] = [];
  for (const r of rows) {
    const d = r.start === null ? -1 : dayStart(r.start);
    if (!groups.length || groups[groups.length - 1].day !== d) groups.push({ day: d, rows: [] });
    groups[groups.length - 1].rows.push(r);
  }
  const chosen = rows.filter((r) => checked.has(r.id));
  const toggle = (id: number) => { const s = new Set(checked); if (s.has(id)) s.delete(id); else s.add(id); setChecked(s); };
  const showCal = p.cals.length > 1;
  const today = dayStart(todayWall());
  const assign = (to: string) => {
    if (!to) return;
    const manual = { ...(p.split.manual ?? {}) };
    for (const r of chosen) manual[r.id] = to;
    p.setSplit({ ...p.split, manual });
    p.toast(t('k.moved', { name: p.calName(to) }));
    setChecked(new Set());
  };
  return (
    <div class="list">
      <div class="l-head">
        {chosen.length > 0 ? (
          <div class="bulk" role="region" aria-label={t('k.selected', { n: chosen.length })}>
            <strong>{t('k.selected', { n: n(chosen.length) })}</strong>
            <button type="button" class="btn sm" onClick={() => { markDeleted(p, chosen, true, t); setChecked(new Set()); }}><Icon name="trash" size={16} /> {t('k.delete')}</button>
            {chosen.some((r) => r.deleted) && <button type="button" class="btn sm" onClick={() => { markDeleted(p, chosen, false, t); setChecked(new Set()); }}>{t('k.restore')}</button>}
            {p.split.mode === 'rules' && (
              <select aria-label={t('k.assign')} value="" onChange={(e) => assign((e.target as HTMLSelectElement).value)}>
                <option value="">{t('k.assign')}</option>
                {p.cals.map((c) => <option value={c.key}>{p.calName(c.key)}</option>)}
              </select>
            )}
            <button type="button" class="link small" onClick={() => setChecked(new Set())}>{t('k.clearSel')}</button>
          </div>
        ) : (
          <>
            <label class="chk"><input type="checkbox" checked={false} disabled={!rows.length} onChange={() => setChecked(new Set(rows.map((r) => r.id)))} /> <span class="sr-only">{t('k.selectAll')}</span></label>
            {res && <span class="muted">{search ? t('k.searchHead', { n: n(res.total), q: p.q.trim() }) : t('k.listHead', { n: n(res.total), d: new Date(p.cursor).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) })}</span>}
            {search && <button type="button" class="link small" onClick={() => p.setQ('')}>{t('k.clearSearch')}</button>}
          </>
        )}
      </div>
      {groups.map((g) => (
        <section class={'day' + (g.day === today ? ' today' : '')}>
          <div class="d">{g.day >= 0 && <><b>{new Date(g.day).getUTCDate()}</b><span>{new Date(g.day).toLocaleDateString(locale, { weekday: 'short', month: 'short', year: wallParts(g.day).y !== wallParts(today).y ? 'numeric' : undefined, timeZone: 'UTC' })}</span></>}</div>
          <ul class="rows">
            {g.rows.map((r) => {
              const key = r.keys.find((k) => !p.hidden.includes(k)) ?? r.keys[0] ?? 'all';
              const isDel = r.deleted || (r.row !== null && p.conv.fixes[r.row] === 'drop');
              return (
                <li class={'row' + (isDel ? ' del' : '') + (r.edited ? ' ed' : '') + (p.active?.id === r.id ? ' on' : '') + (showCal ? '' : ' nocal')}>
                  <input type="checkbox" aria-label={t('k.select', { t: r.summary.slice(0, 60) })} checked={checked.has(r.id)} onChange={() => toggle(r.id)} />
                  <span class="rtime">{r.allDay ? t('k.allDay') : `${hm(r.start)}–${hm(r.end ?? r.start)}`}</span>
                  <i class="dot" style={{ '--c': p.colorOf(key) }} />
                  <button type="button" class="rt" onClick={() => p.setActive({ id: r.id, key })}>{r.summary || '–'}{r.series && <span class="tag"><Icon name="repeat" size={12} /></span>}</button>
                  {showCal && <span class="rcal">{p.calName(key)}</span>}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {res && rows.length === 0 && <p class="muted">{t('k.nothing')}</p>}
      {res && res.total > rows.length && <button type="button" class="btn" onClick={() => setLimit(limit + PAGE)}>{t('k.loadMore')}</button>}
    </div>
  );
}

type T = ReturnType<typeof useT>['t'];
export function markDeleted(p: Pick<StudioProps, 'table' | 'conv' | 'setConv' | 'sel' | 'setSel' | 'toast'>, list: { id: number; row: number | null }[], on: boolean, t: T) {
  const msg = list.length === 1 ? t('k.deleted') : t('k.deletedN', { n: list.length });
  if (p.table) {
    const before = p.conv;
    const fx = { ...p.conv.fixes };
    for (const r of list) if (r.row !== null) { if (on) fx[r.row] = 'drop'; else delete fx[r.row]; }
    p.setConv({ ...p.conv, fixes: fx });
    if (on) p.toast(msg, () => p.setConv(before));
    return;
  }
  const before = p.sel;
  const s = new Set(p.sel.deleted);
  for (const r of list) { if (on) s.add(r.id); else s.delete(r.id); }
  p.setSel({ ...p.sel, deleted: [...s] });
  if (on) p.toast(msg, () => p.setSel(before));
}

const freqLabel = (t: T, rrule: string) => {
  const f = (/FREQ=(\w+)/i.exec(rrule)?.[1] ?? '').toUpperCase();
  return ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(f) ? t(('k.freq.' + f) as UiKey) : f.toLowerCase();
};

// ---------------------------------------------------------------- Termin-Panel (Änderungen gelten sofort)

export function Panel(p: StudioProps & { id: number; calKey: string }) {
  const { t } = useT();
  const [dt, setDt] = useState<EventDetail | null>(null);
  const [f, setF] = useState({ summary: '', location: '', description: '', allDay: false, sDate: '', sTime: '', eDate: '', eTime: '' });
  const timer = useRef<number | null>(null);
  const pending = useRef<typeof f | null>(null);
  const deleted = p.sel.deleted.includes(p.id);
  const fill = (x: EventDetail) => {
    const endIncl = x.end !== null ? (x.allDay ? x.end - DAY : x.end) : x.start;
    setF({
      summary: x.summary, location: x.location, description: x.description, allDay: x.allDay,
      sDate: x.start !== null ? isoDay(x.start) : '', sTime: x.allDay ? '' : hm(x.start),
      eDate: endIncl !== null ? isoDay(Math.max(endIncl, x.start ?? endIncl)) : '', eTime: x.allDay ? '' : hm(x.end ?? x.start)
    });
  };
  useEffect(() => { call<EventDetail | null>({ type: 'get', id: p.id }).then((x) => { setDt(x); if (x) fill(x); }); }, [p.id]);
  async function save(v: typeof f) {
    const patch: Patch = { summary: v.summary, location: v.location, description: v.description };
    if (v.sDate) {
      patch.start = v.allDay ? v.sDate : `${v.sDate}T${v.sTime || '00:00'}`;
      patch.end = v.allDay ? (v.eDate || v.sDate) : `${v.eDate || v.sDate}T${v.eTime || v.sTime || '00:00'}`;
    }
    const x = await call<EventDetail | null>({ type: 'edit', id: p.id, patch });
    if (x) { setDt(x); p.bumpEdits(); }
  }
  const flush = () => { if (timer.current !== null) { clearTimeout(timer.current); timer.current = null; if (pending.current) void save(pending.current); } };
  useEffect(() => () => flush(), [p.id]);
  const upd = (k: keyof typeof f, wait = 450) => (e: Event) => {
    const el = e.target as HTMLInputElement;
    const v = { ...f, [k]: el.type === 'checkbox' ? el.checked : el.value };
    if (k === 'sDate' && f.eDate === f.sDate) v.eDate = el.value;
    setF(v);
    pending.current = v;
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { timer.current = null; void save(v); }, wait);
  };
  const close = () => { flush(); p.setActive(null); };
  async function reset() {
    if (timer.current !== null) { clearTimeout(timer.current); timer.current = null; }
    const x = await call<EventDetail | null>({ type: 'edit', id: p.id, patch: null });
    if (x) { setDt(x); fill(x); p.bumpEdits(); }
  }
  const assign = (to: string) => { p.setSplit({ ...p.split, manual: { ...(p.split.manual ?? {}), [p.id]: to } }); p.setActive({ id: p.id, key: to }); p.toast(t('k.moved', { name: p.calName(to) })); };
  return (
    <aside class="panel" aria-label={t('k.title')} onKeyDown={(e) => { if (e.key === 'Escape') close(); }}>
      <div class="p-head">
        <i class="sq" style={{ '--c': p.colorOf(p.calKey) }} />
        {p.split.mode === 'rules'
          ? <select aria-label={t('k.calendars')} value={p.calKey} onChange={(e) => assign((e.target as HTMLSelectElement).value)}>{p.cals.map((c) => <option value={c.key}>{p.calName(c.key)}</option>)}</select>
          : <span class="muted break">{p.calName(p.calKey)}</span>}
        <button type="button" class="ib" aria-label={t('k.close')} onClick={close}><Icon name="x" size={18} /></button>
      </div>
      {!dt ? <div class="p-body"><span class="spinner" aria-hidden="true" /></div> : (
        <>
          <div class="p-body">
            {deleted && <div class="p-del">{t('k.deletedNote')} <button type="button" class="link" onClick={() => markDeleted(p, [{ id: p.id, row: null }], false, t)}>{t('k.restore')}</button></div>}
            <label class="sr-only" for="p-title">{t('k.title')}</label>
            <textarea id="p-title" class="p-title" rows={2} value={f.summary} onInput={upd('summary')} />
            {dt.rrule && !dt.recurrenceId && <div class="muted small">{t('k.seriesStart')}</div>}
            <div class="p-when">
              <label class="sr-only" for="p-date">{t('k.date')}</label>
              <input id="p-date" type="date" value={f.sDate} onInput={upd('sDate', 700)} />
              {!f.allDay && <>
                <label class="sr-only" for="p-from">{t('k.start')}</label><input id="p-from" type="time" value={f.sTime} onInput={upd('sTime', 700)} />
                <span class="muted">–</span>
                <label class="sr-only" for="p-to">{t('k.end')}</label><input id="p-to" type="time" value={f.eTime} onInput={upd('eTime', 700)} />
              </>}
              {f.allDay && f.eDate !== f.sDate && <><span class="muted">–</span><label class="sr-only" for="p-edate">{t('k.end')}</label><input id="p-edate" type="date" value={f.eDate} onInput={upd('eDate', 700)} /></>}
              <label class="chk small"><input type="checkbox" checked={f.allDay} onChange={upd('allDay', 0)} /> {t('k.allDayToggle')}</label>
            </div>
            {dt.rrule && <p class="p-note"><Icon name="repeat" size={16} /> {t('k.series', { rule: freqLabel(t, dt.rrule) })}</p>}
            {dt.recurrenceId && <p class="p-note"><Icon name="info" size={16} /> {t('k.exception')}</p>}
            <label class="p-field"><Icon name="pin" size={16} /><span class="sr-only">{t('k.loc')}</span><input type="text" value={f.location} placeholder={t('k.locPh')} onInput={upd('location')} /></label>
            <label class="p-field top"><Icon name="text" size={16} /><span class="sr-only">{t('k.desc')}</span><textarea rows={3} value={f.description} placeholder={t('k.descPh')} onInput={upd('description')} /></label>
            <details class="raw"><summary>{t('k.raw')}</summary><pre>{dt.lines.join('\n')}</pre></details>
          </div>
          <div class="p-foot">
            {!p.table && <button type="button" class="btn danger" onClick={() => markDeleted(p, [{ id: p.id, row: null }], !deleted, t)}>{deleted ? t('k.restore') : t('k.delete')}</button>}
            <span class="muted small grow">{dt.edited && <>{t('k.edited')} · <button type="button" class="link" onClick={reset}>{t('k.reset')}</button></>}</span>
            <button type="button" class="btn primary" onClick={close}>{t('k.done')}</button>
          </div>
        </>
      )}
    </aside>
  );
}

export function Banner({ children }: { children: ComponentChildren }) {
  return <div class="banner" role="status">{children}</div>;
}
