// Dialoge: Aufteilen, Datei-Info, Tabellen-Werkzeuge. Alle nutzen das native <dialog> (Fokus, Escape, Hintergrund).
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { Loaded, TableInfo } from '../../lib/engine';
import type { Rule, SplitConfig, Target, TextField } from '../../lib/plan';
import type { Suggestion } from '../../lib/analyze';
import { Icon, useT } from './ui';
import { CheckTab, ColumnsTab, PrivacyTab, type TableProps } from './Editor';
import { bestSuggestion } from './Studio';
import type { UiKey } from '../../i18n/ui';

export function Modal({ open, onClose, title, children, foot, wide = false }: { open: boolean; onClose: () => void; title: string; children: ComponentChildren; foot?: ComponentChildren; wide?: boolean }) {
  const { t } = useT();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} class={'dlg' + (wide ? ' wide' : '')} aria-label={title} onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      {open && <>
        <div class="dh"><h2>{title}</h2><button type="button" class="ib" aria-label={t('k.close')} onClick={onClose}><Icon name="x" size={18} /></button></div>
        <div class="db">{children}</div>
        {foot && <div class="df">{foot}</div>}
      </>}
    </dialog>
  );
}

// ---------------------------------------------------------------- Aufteilen

type Kind = 'initials' | 'prefix' | 'categories' | 'organizer';
const RULE: Record<Kind, { field: TextField; op: Rule['op'] }> = {
  initials: { field: 'summary', op: 'word' }, prefix: { field: 'summary', op: 'starts' },
  categories: { field: 'categories', op: 'word' }, organizer: { field: 'organizer', op: 'contains' }
};

export function SplitDialog({ open, onClose, loaded, split, setSplit, onDone }: {
  open: boolean; onClose: () => void; loaded: Loaded; split: SplitConfig; setSplit: (s: SplitConfig) => void; onDone: (n: number) => void;
}) {
  const { t, n } = useT();
  const kinds = (['initials', 'prefix', 'categories', 'organizer'] as Kind[]).filter((k) => loaded.suggestions.some((s) => s.kind === k && s.values.length >= 2));
  const [kind, setKind] = useState<Kind>(((bestSuggestion(loaded)?.kind as Kind) ?? kinds[0] ?? 'initials'));
  const [draft, setDraft] = useState<Record<string, { on: boolean; name: string }>>({});
  const sg: Suggestion | undefined = loaded.suggestions.find((s) => s.kind === kind);
  const values = (sg?.values ?? []).slice(0, 40);
  useEffect(() => {
    if (!open) return;
    const names = new Map(split.targets.map((x) => [x.rules[0]?.value, x.name]));
    const d: Record<string, { on: boolean; name: string }> = {};
    for (const v of values) d[v.value] = { on: split.mode !== 'rules' || names.has(v.value), name: names.get(v.value) ?? v.value };
    setDraft(d);
  }, [open, kind]);
  const on = values.filter((v) => draft[v.value]?.on);
  const apply = () => {
    const r = RULE[kind];
    const targets: Target[] = on.map((v, i) => ({ id: 't' + i + '-' + v.value.replace(/\W+/g, ''), name: draft[v.value].name.trim() || v.value, rules: [{ field: r.field, op: r.op, value: v.value }] }));
    setSplit({ ...split, mode: 'rules', targets, multi: 'all', includeRest: true, manual: {} });
    onClose();
    onDone(targets.length + 1);
  };
  return (
    <Modal open={open} onClose={onClose} title={t('k.sp.title')} foot={
      <>
        <span class="grow" />
        <button type="button" class="btn" onClick={onClose}>{t('k.sp.cancel')}</button>
        <button type="button" class="btn primary" disabled={!on.length} onClick={apply}>{t('k.sp.apply', { n: on.length + 1 })}</button>
      </>
    }>
      {kinds.length > 1 && (
        <div class="xr">
          <div class="xl" id="sp-by">{t('k.sp.by')}</div>
          <div class="seg" role="group" aria-labelledby="sp-by">
            {kinds.map((k) => <button type="button" aria-pressed={kind === k} onClick={() => setKind(k)}>{t(('k.sp.' + k) as UiKey)}</button>)}
          </div>
        </div>
      )}
      <p class="muted m0">{t('k.sp.intro', { ex: values[0]?.value ?? '' })}</p>
      <ul class="kzl">
        {values.map((v, i) => {
          const d = draft[v.value] ?? { on: true, name: v.value };
          const upd = (x: Partial<typeof d>) => setDraft({ ...draft, [v.value]: { ...d, ...x } });
          return (
            <li class={'kz' + (d.on ? '' : ' off')}>
              <input type="checkbox" class="cbx" checked={d.on} aria-label={t('k.sp.use', { v: v.value })} onChange={(e) => upd({ on: (e.target as HTMLInputElement).checked })} style={{ '--c': `var(--c${i % 7})` }} />
              <code class="break">{v.value}</code>
              <input type="text" value={d.name} disabled={!d.on} placeholder={t('k.sp.namePh')} aria-label={t('k.sp.nameFor', { v: v.value })} onInput={(e) => upd({ name: (e.target as HTMLInputElement).value })} />
              <em>{n(v.count)}</em>
            </li>
          );
        })}
      </ul>
      <p class="muted small m0">{t('k.sp.rest', { name: split.restName })}</p>
    </Modal>
  );
}

// ---------------------------------------------------------------- Datei-Info

export function InfoDialog({ open, onClose, loaded, table, sourceText, onOpen, onSample, onTemplate, onTable }: {
  open: boolean; onClose: () => void; loaded: Loaded; table: TableInfo | null; sourceText: string;
  onOpen: () => void; onSample: (w: 'practice' | 'csv' | 'birthdays') => void; onTemplate: (w: 'csv' | 'birthdays') => void; onTable: () => void;
}) {
  const { t, n, b, d, y } = useT();
  return (
    <Modal open={open} onClose={onClose} title={loaded.fileName} wide>
      <p class="muted m0">{sourceText}</p>
      {loaded.calendars.map((c) => {
        const years = c.perYear.filter((x) => c.mainFrom === null || (x.year >= new Date(c.mainFrom).getUTCFullYear() && x.year <= new Date(c.mainTo!).getUTCFullYear()));
        const max = Math.max(1, ...years.map((x) => x.count));
        return (
          <section class="info-cal" aria-label={c.name || c.fileName}>
            {loaded.calendars.length > 1 && <h3 class="h4 break">{c.name || c.fileName}</h3>}
            <dl class="kpis">
              <div class="kpi"><dt>{t('k.kpi.events')}</dt><dd>{n(c.events)}</dd></div>
              <div class="kpi"><dt>{t('k.kpi.range')}</dt><dd>{y(c.mainFrom)}–{y(c.mainTo)}</dd><dd class="sub">{d(c.first)} – {d(c.last)}</dd></div>
              <div class="kpi"><dt>{t('k.kpi.size')}</dt><dd>{b(c.bytes)}</dd></div>
              <div class="kpi"><dt>{t('k.kpi.series')}</dt><dd>{n(c.seriesMasters)}</dd><dd class="sub">{n(c.allDay)} {t('k.kpi.allDay').toLowerCase()}</dd></div>
              <div class="kpi"><dt>{t('k.kpi.desc')}</dt><dd>{c.events ? Math.round((c.withDescription / c.events) * 100) : 0} %</dd></div>
              <div class="kpi"><dt>{t('k.kpi.tz')}</dt><dd class="break">{c.timezone}</dd></div>
            </dl>
            {years.length > 1 && (
              <div>
                <div class="muted small">{t('k.perYear')}</div>
                <div class="bars" role="img" aria-label={years.map((x) => `${x.year}: ${n(x.count)}`).join(', ')}>
                  {years.map((x) => <div title={`${x.year}: ${n(x.count)}`}><i style={{ height: Math.max(2, Math.round((x.count / max) * 100)) + '%' }} /><span>{String(x.year).slice(2)}</span></div>)}
                </div>
              </div>
            )}
            <dl class="kv">
              <dt>{t('k.kpi.cancelled')}</dt><dd>{n(c.cancelled)}</dd>
              <dt>{t('k.kpi.dupes')}</dt><dd>{n(c.duplicates)}</dd>
              <dt>{t('k.kpi.phones')}</dt><dd>{n(Math.max(c.phoneInTitle, c.phoneInDescription))}</dd>
            </dl>
          </section>
        );
      })}
      <div class="btn-row">
        <button type="button" class="btn primary" onClick={() => { onClose(); onOpen(); }}><Icon name="file" size={16} /> {t('k.openOther')}</button>
        {table && <button type="button" class="btn" onClick={() => { onClose(); onTable(); }}>{t('k.table')}</button>}
      </div>
      <div class="btn-row small">
        <span class="muted">{t('k.samples')}:</span>
        <button type="button" class="link" onClick={() => { onClose(); onSample('practice'); }}>{t('start.samplePractice')}</button>
        <button type="button" class="link" onClick={() => { onClose(); onSample('csv'); }}>{t('start.sampleCsv')}</button>
        <button type="button" class="link" onClick={() => { onClose(); onSample('birthdays'); }}>{t('start.sampleBirthdays')}</button>
      </div>
      <div class="btn-row small">
        <span class="muted">{t('k.templates')}:</span>
        <button type="button" class="link" onClick={() => onTemplate('csv')}>{t('start.tplCsv')}</button>
        <button type="button" class="link" onClick={() => onTemplate('birthdays')}>{t('start.tplBirthdays')}</button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- Tabellen (CSV/Excel)

export function TableDialog(p: TableProps & { open: boolean; onClose: () => void }) {
  const { t } = useT();
  return (
    <Modal open={p.open} onClose={p.onClose} title={t('k.tbl.title')} wide>
      <h3 class="h4">{t('k.tbl.issues')}</h3>
      <CheckTab {...p} />
      <h3 class="h4">{t('k.tbl.privacy')}</h3>
      <PrivacyTab {...p} />
      <h3 class="h4">{t('k.tbl.columns')}</h3>
      <ColumnsTab {...p} />
    </Modal>
  );
}
