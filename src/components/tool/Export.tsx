// Export in einem Schritt: Zeitraum wählen, Ergebnis sehen, herunterladen. Alles Weitere steckt in „Mehr Optionen“.
import { useState } from 'preact/hooks';
import type { Format, Loaded, PlanRequest, PlanResult } from '../../lib/engine';
import type { Selection, SplitConfig } from '../../lib/plan';
import { ALL, NO_CLEAN } from '../../lib/plan';
import { parseIsoDay } from '../../lib/datetime';
import { call, download } from './client';
import { H, Icon, useT } from './ui';
import { Modal } from './Dialogs';

/** Zeitraum: fromN/beforeN beziehen sich auf das Jahr (aktuelles Jahr − N), z. B. 2026 − 2 = „Ab 2024“ / „Vor 2024“. */
export type Range = 'all' | 'from2' | 'before2' | 'from1' | 'before1' | 'future' | 'custom';
const RANGES: Range[] = ['all', 'from2', 'before2', 'from1', 'before1', 'future', 'custom'];
const rangeYear = (r: Range) => new Date().getFullYear() - (r.endsWith('2') ? 2 : 1);

export interface ExportOpts { range: Range; from: string; to: string; years: number[]; max999: boolean; admin: boolean; cancelled: boolean; dupes: boolean; phones: boolean; desc: boolean; uids: boolean; format: Format }
export const DEFAULT_EXPORT: ExportOpts = { range: 'all', from: '', to: '', years: [], max999: false, admin: true, cancelled: false, dupes: false, phones: false, desc: false, uids: false, format: 'ics' };

const statusWords = (loaded: Loaded) => (loaded.suggestions.find((s) => s.kind === 'status')?.values ?? []).filter((v) => v.value !== 'STATUS:CANCELLED');

/** Baut aus den Export-Optionen die Anfrage an den Rechenkern. */
export function exportRequest(o: ExportOpts, sel: Selection, split: SplitConfig, loaded: Loaded, hidden: string[]): PlanRequest {
  const y = new Date().getFullYear();
  return {
    selection: {
      ...ALL, today: sel.today, deleted: sel.deleted,
      years: o.range === 'custom' && o.years.length ? [...o.years].sort() : null, hidePast: o.range === 'future',
      from: o.range.startsWith('from') ? Date.UTC(rangeYear(o.range), 0, 1) : o.range === 'custom' ? parseIsoDay(o.from) : null,
      to: o.range.startsWith('before') ? Date.UTC(rangeYear(o.range) - 1, 11, 31) : o.range === 'custom' ? parseIsoDay(o.to) : null,
      dropCancelled: o.cancelled, dropWords: o.cancelled ? statusWords(loaded).map((v) => v.value) : [], dedupe: o.dupes
    },
    clean: { ...NO_CLEAN, dropAdmin: o.admin, maskPhones: o.phones, maskEmails: o.phones, dropDescription: o.desc, newUids: o.uids },
    split, format: o.format, hidden, maxEvents: o.max999 ? 999 : undefined
  };
}

export function ExportDialog({ open, onClose, loaded, plan, opts, setOpts, req, calCount, hiddenCount, onShowAll }: {
  open: boolean; onClose: () => void; loaded: Loaded; plan: PlanResult | null; opts: ExportOpts; setOpts: (o: ExportOpts) => void; req: PlanRequest;
  calCount: number; hiddenCount: number; onShowAll: () => void;
}) {
  const { t, n, b, d } = useT();
  const [busy, setBusy] = useState('');
  const salt = useState(() => Math.random().toString(36).slice(2))[0];
  const cals = loaded.calendars;
  const sum = (f: (c: Loaded['calendars'][number]) => number) => cals.reduce((a, c) => a + f(c), 0);
  const counts = {
    cancelled: sum((c) => c.cancelled) + statusWords(loaded).reduce((a, v) => a + v.count, 0),
    dupes: sum((c) => c.duplicates),
    phones: sum((c) => Math.max(c.phoneInTitle, c.phoneInDescription) + Math.max(c.emailInTitle, c.emailInDescription)),
    desc: sum((c) => c.withDescription)
  };
  const files = plan ? plan.calendars.flatMap((c) => c.parts.map((p) => ({ cal: c.key, name: c.name, ...p }))) : [];
  const withEvents = plan ? plan.calendars.filter((c) => c.events > 0).length : 0;
  const tone = !plan || !plan.events ? 'bad' : files.length > withEvents ? 'warn' : 'ok';
  const status = !plan ? '' : !plan.events ? t('k.ex.empty') : files.length > withEvents ? t(opts.max999 ? 'k.ex.split999' : 'k.ex.split', { n: files.length }) : files.length === 1 ? t('k.ex.fits1') : t('k.ex.fitsN', { n: files.length });
  const bytes = plan ? (plan.format === 'csv' ? plan.csv.bytes : plan.ics.bytes) : 0;
  const years = (() => {
    const m = new Map<number, number>();
    for (const c of cals) for (const x of c.perYear) m.set(x.year, (m.get(x.year) ?? 0) + x.count);
    return [...m.entries()].filter(([, c]) => c > 0).sort((a, b) => b[0] - a[0]);
  })();
  const set = (k: keyof ExportOpts, v: ExportOpts[keyof ExportOpts]) => setOpts({ ...opts, [k]: v });

  async function get(which: { cal: string; part: number } | 'zip', key: string) {
    setBusy(key);
    try {
      const f = await call<{ name: string; data: Uint8Array; type: string }>({ type: 'build', req, which, salt });
      download(f.name, f.data, f.type);
    } finally { setBusy(''); }
  }
  const main = files.length > 1 ? () => get('zip', 'zip') : files.length === 1 ? () => get({ cal: files[0].cal, part: files[0].index }, 'one') : undefined;
  const ck = (k: 'admin' | 'cancelled' | 'dupes' | 'phones' | 'desc', label: string, hint: string) => (
    <label class="ck"><input type="checkbox" checked={opts[k]} onChange={(e) => set(k, (e.target as HTMLInputElement).checked)} /><span>{label}</span><span class="muted">{hint}</span></label>
  );
  return (
    <Modal open={open} onClose={onClose} title={t('k.ex.title')} wide foot={
      <>
        <span class="grow" />
        <button type="button" class="btn primary" disabled={!main || !!busy} onClick={main}>
          <Icon name="download" size={16} /> {busy === 'zip' || busy === 'one' ? t('k.ex.building') : files.length > 1 ? t('k.ex.downloadZip', { n: files.length }) : t('k.ex.download')}
        </button>
      </>
    }>
      {calCount > 1 && (
        <div class="xr">
          <div class="xl">{t('k.ex.cals')}</div>
          <div class="x-line">{hiddenCount > 0
            ? <>{t('k.ex.calsSome', { n: calCount - hiddenCount, m: calCount })} · <button type="button" class="link" onClick={onShowAll}>{t('k.ex.calsInclude')}</button></>
            : t('k.ex.calsAll', { m: calCount })}</div>
        </div>
      )}
      <div class="xr">
        <div class="xl" id="ex-range">{t('k.ex.range')}</div>
        <div class="stack-sm">
          <div class="seg" role="group" aria-labelledby="ex-range">
            {RANGES.map((r) => <button type="button" aria-pressed={opts.range === r} onClick={() => set('range', r)}>{t(r === 'all' ? 'k.ex.all' : r.startsWith('from') ? 'k.ex.fromY' : r.startsWith('before') ? 'k.ex.beforeY' : r === 'future' ? 'k.ex.future' : 'k.ex.custom', { y: rangeYear(r) })}</button>)}
          </div>
          <div class="muted small">{t(('k.ex.hint.' + opts.range.replace(/\d$/, '')) as 'k.ex.hint.all', { y: rangeYear(opts.range), last: rangeYear(opts.range) - 1, d: d(req.selection.today) })}</div>
          {opts.range === 'custom' && (
            <div class="custom">
              <div class="dates">
                <label>{t('k.ex.from')} <input type="date" value={opts.from} onChange={(e) => setOpts({ ...opts, from: (e.target as HTMLInputElement).value, years: [] })} /></label>
                <label>{t('k.ex.to')} <input type="date" value={opts.to} onChange={(e) => setOpts({ ...opts, to: (e.target as HTMLInputElement).value, years: [] })} /></label>
                {(opts.from || opts.to || opts.years.length > 0) && <button type="button" class="link small" onClick={() => setOpts({ ...opts, from: '', to: '', years: [] })}>{t('k.ex.reset')}</button>}
              </div>
              <div class="muted small">{t('k.ex.years')} · {t('k.ex.yearsHint')}</div>
              <div class="ychips">
                {years.map(([y, c]) => (
                  <button type="button" aria-pressed={opts.years.includes(y)} title={n(c)}
                    onClick={() => setOpts({ ...opts, from: '', to: '', years: opts.years.includes(y) ? opts.years.filter((x) => x !== y) : [...opts.years, y] })}>
                    {y}<span>{n(c)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div class={'result is-' + tone} aria-live="polite">
        {plan ? <>
          <div class="big">{t('k.ex.events', { n: n(plan.events), size: b(bytes) })}</div>
          <div class="st"><Icon name={tone === 'ok' ? 'ok' : tone === 'warn' ? 'split' : 'warn'} size={16} /> {status}</div>
          {plan.format === 'csv' && plan.csv.skippedSeries > 0 && <div class="muted small">{t('live.csvSeries', { n: n(plan.csv.skippedSeries) })}</div>}
          {files.length > 0 && (
            <details class="files-d">
              <summary>{t('k.ex.files', { n: files.length })}</summary>
              <ul class="files">
                {files.map((f) => {
                  const key = f.cal + '-' + f.index;
                  return (
                    <li>
                      <span class="f-name">{f.file}<span class="muted">{t('ex.events', { n: n(f.events) })} · {b(f.bytes)} · {d(f.from)} – {d(f.to)}</span></span>
                      <button type="button" class="ib" disabled={!!busy} aria-label={t('k.ex.downloadOne', { file: f.file })} title={t('k.ex.download')} onClick={() => get({ cal: f.cal, part: f.index }, key)}>
                        {busy === key ? <span class="spinner" aria-hidden="true" /> : <Icon name="download" size={16} />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </details>
          )}
        </> : <span class="spinner" aria-hidden="true" />}
      </div>

      <details class="more-opts">
        <summary>{t('k.ex.moreOpts')}</summary>
        <div class="xr">
          <div class="xl">{t('k.ex.omit')}</div>
          <div class="checks">
            {ck('admin', t('k.ex.admin'), t('k.ex.adminHint'))}
            {counts.cancelled > 0 && ck('cancelled', t('k.ex.cancelled'), n(counts.cancelled))}
            {counts.dupes > 0 && ck('dupes', t('k.ex.dupes'), n(counts.dupes))}
            {counts.phones > 0 && ck('phones', t('k.ex.phones'), n(counts.phones))}
            {counts.desc > 0 && ck('desc', t('k.ex.desc'), n(counts.desc))}
          </div>
        </div>
        <div class="xr">
          <div class="xl" id="ex-fmt">{t('k.ex.format')}</div>
          <div>
            <div class="seg" role="group" aria-labelledby="ex-fmt">
              {(['ics', 'csv'] as const).map((f) => <button type="button" aria-pressed={opts.format === f} onClick={() => set('format', f)}>{t(f === 'ics' ? 'k.ex.ics' : 'k.ex.csv')}</button>)}
            </div>
            <div class="muted small">{opts.format === 'ics' ? t('ex.icsHint') : t('ex.csvHint')}</div>
          </div>
        </div>
        <label class="ck"><input type="checkbox" checked={opts.max999} onChange={(e) => set('max999', (e.target as HTMLInputElement).checked)} /><span>{t('k.ex.max999')}</span><span class="muted">{t('k.ex.max999Hint')}</span></label>
        <label class="ck"><input type="checkbox" checked={opts.uids} onChange={(e) => set('uids', (e.target as HTMLInputElement).checked)} /><span>{t('k.ex.uids')}</span></label>
        <p class="muted small m0">{t('c.uidsHint')}</p>
      </details>

      <details class="howto">
        <summary>{t('k.ex.how')}</summary>
        <ol>
          <H as="li" k="k.ex.how1" />
          <H as="li" k="ex.how3" />
          <H as="li" k="ex.how4" />
          {files.length > 1 && <H as="li" k="ex.how5" />}
        </ol>
      </details>
    </Modal>
  );
}
