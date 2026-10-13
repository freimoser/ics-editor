// Tabellen-Werkzeuge (nur CSV/Excel): Probleme prüfen, persönliche Spalten, Spalten zuordnen. Erscheinen im Dialog „Spalten und Probleme“.
import type { Loaded, TableInfo } from '../../lib/engine';
import type { ConvertOptions, PiiKind, Role, ShortenMode } from '../../lib/table';
import { EXPORT_TIMEZONES } from '../../lib/tz';
import { H, Icon, Status, useT } from './ui';
import type { UiKey } from '../../i18n/ui';

export interface TableProps {
  loaded: Loaded; table: TableInfo | null;
  roles: Record<number, Role>; setRoles: (r: Record<number, Role>) => void; conv: ConvertOptions; setConv: (c: ConvertOptions) => void;
}

// ---------------------------------------------------------------- Persönliche Daten

export function PrivacyTab({ table, conv, setConv }: TableProps) {
  const { t } = useT();
  const piiCols = (table?.columns ?? []).filter((c) => !!c.pii && !(conv.birthdays && c.role === 'birthday'));
  return (
    <div class="stack-sm">
      {piiCols.length > 0 && <H as="p" k="p.intro" class="muted m0" />}
      {piiCols.map((c) => {
        const mode: ShortenMode = conv.pii[c.index] ?? 'keep';
        const kind = c.pii as PiiKind;
        const sample = c.samples[0] ?? '';
        const opts: { v: ShortenMode; label: string }[] = [
          { v: 'remove', label: t('p.remove') },
          { v: 'short', label: t(('p.short.' + kind) as UiKey) },
          { v: 'keep', label: t('p.keep') }
        ];
        return (
          <div class="box">
            <div class="head-row"><h4 class="h4 break">{t('p.column', { col: c.header })}</h4><span class="muted small">{t(('p.kind.' + kind) as UiKey)}</span></div>
            <div role="radiogroup" aria-label={t('p.column', { col: c.header })} class="seg">
              {opts.map((o) => (
                <button type="button" role="radio" aria-checked={mode === o.v} aria-pressed={mode === o.v}
                  onClick={() => setConv({ ...conv, pii: { ...conv.pii, [c.index]: o.v } })}>{o.label}</button>
              ))}
            </div>
            <div class="muted small">{t('p.result')} <strong>{mode === 'remove' ? t('p.nothing') : mode === 'short' ? shortPreview(kind, sample) : sample}</strong></div>
          </div>
        );
      })}
      {piiCols.length === 0 && <p class="muted m0">{t('p.none')}</p>}
    </div>
  );
}

function shortPreview(kind: PiiKind, v: string): string {
  const s = v.trim();
  if (kind === 'name') return s.split(/[\s,]+/).filter(Boolean).map((p) => p[0].toUpperCase() + '.').join(' ');
  if (kind === 'phone') { const d = s.replace(/\D/g, ''); return d.length > 4 ? s.slice(0, 4) + ' … ' + d.slice(-2) : '…'; }
  if (kind === 'email') { const at = s.indexOf('@'); return at > 0 ? s[0] + '…' + s.slice(at) : '…'; }
  if (kind === 'birthdate') return (/(\d{4})/.exec(s) || ['', '…'])[1];
  const m = /\b\d{5}\b\s*(\S+)?/.exec(s);
  return m ? m[0] : '…';
}

// ---------------------------------------------------------------- Spalten (nur Tabellen)

const ROLES: Role[] = ['subject', 'startDate', 'startTime', 'endDate', 'endTime', 'start', 'end', 'duration', 'allDay', 'description', 'location', 'private', 'name', 'birthday', 'extra', 'skip'];

export function ColumnsTab({ table, roles, setRoles, conv, setConv }: TableProps) {
  const { t } = useT();
  if (!table) return null;
  const hasBirthday = Object.values(roles).includes('birthday');
  return (
    <div class="stack">
      <div class="card">
        <p class="muted">{t('col.intro')}</p>
        <div class="table-wrap">
          <table class="data">
            <thead><tr><th>{t('col.yours')}</th><th>{t('col.example')}</th><th>{t('col.target')}</th></tr></thead>
            <tbody>
              {table.columns.map((c) => (
                <tr class={roles[c.index] === 'skip' ? 'dim' : ''}>
                  <td><strong class="break">{c.header}</strong></td>
                  <td class="muted break">{c.samples[0] ?? ''}</td>
                  <td>
                    <select aria-label={t('col.target') + ': ' + c.header} value={roles[c.index]} onChange={(e) => setRoles({ ...roles, [c.index]: (e.target as HTMLSelectElement).value as Role })}>
                      {ROLES.map((r) => <option value={r}>{t(('role.' + r) as UiKey)}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card stack-sm">
        <div class="field-row">
          <label class="field">{t('col.duration')}
            <select value={String(conv.defaultMinutes)} onChange={(e) => setConv({ ...conv, defaultMinutes: +(e.target as HTMLSelectElement).value })}>
              {[15, 30, 45, 60, 90, 120].map((m) => <option value={String(m)}>{t('col.minutes', { n: m })}</option>)}
            </select>
          </label>
          <label class="field">{t('col.tz')}
            <select value={conv.tz} onChange={(e) => setConv({ ...conv, tz: (e.target as HTMLSelectElement).value })}>
              {EXPORT_TIMEZONES.map((z) => <option value={z}>{z}</option>)}
            </select>
          </label>
        </div>
        {hasBirthday && (
          <>
            <label class="check-line"><input type="checkbox" checked={conv.birthdays} onChange={() => setConv({ ...conv, birthdays: !conv.birthdays })} />{t('col.birthdays')}</label>
            {conv.birthdays && <label class="check-line"><input type="checkbox" checked={conv.birthdayYearInTitle} onChange={() => setConv({ ...conv, birthdayYearInTitle: !conv.birthdayYearInTitle })} />{t('col.birthYear')}</label>}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Prüfen

export function CheckTab({ loaded, table, conv, setConv }: TableProps) {
  const { t, n } = useT();
  if (!table) {
    const sum = (f: (c: Loaded['calendars'][number]) => number) => loaded.calendars.reduce((a, c) => a + f(c), 0);
    const other = loaded.calendars.reduce((a, c) => a + Object.values(c.otherComponents).reduce((x, y) => x + y, 0), 0);
    const items: [number, UiKey][] = [
      [sum((c) => c.problems.noStart), 'chk.ics.noStart'], [sum((c) => c.problems.endBeforeStart), 'chk.ics.endBeforeStart'],
      [sum((c) => c.problems.noSummary), 'chk.ics.noSummary'], [sum((c) => c.floating), 'chk.ics.floating'], [other, 'chk.ics.other']
    ];
    const shown = items.filter(([x]) => x > 0);
    return shown.length
      ? <ul class="plain stack-sm">{shown.map(([x, k]) => <li class="card row-icon"><Icon name="warn" size={26} class="warn" />{t(k, { n: n(x) })}</li>)}</ul>
      : <Status tone="ok" title={t('chk.ok')} />;
  }
  const issues = loaded.issues ?? [];
  const total = loaded.issueCount ?? 0;
  const open = issues.filter((i) => !conv.fixes[i.row]).length;
  const setFix = (row: number, v: 'fix' | 'drop') => setConv({ ...conv, fixes: { ...conv.fixes, [row]: v } });
  if (!total) return <Status tone="ok" title={t('chk.ok')} />;
  return (
    <div class="stack-sm">
      <div class="head-row">
        <p>{open ? t('chk.intro', { n: n(open + Math.max(0, total - issues.length)) }) : t('chk.ok')}</p>
        {open > 0 && <button type="button" class="btn btn-secondary" onClick={() => {
          const fx = { ...conv.fixes };
          for (const i of issues) if (!fx[i.row]) fx[i.row] = i.fix === 'drop' ? 'drop' : 'fix';
          setConv({ ...conv, fixes: fx });
        }}>{t('chk.fixAll')}</button>}
      </div>
      <ul class="plain stack-sm">
        {issues.map((i) => {
          const f = conv.fixes[i.row];
          return (
            <li class="card issue">
              <Icon name={f ? 'check' : 'warn'} size={26} class={f ? 'ok' : 'warn'} />
              <div class="grow">
                <div><strong>{t('chk.line', { n: n(i.line) })}:</strong> {t(('issue.' + i.code) as UiKey, { v: i.value })}</div>
                {!f ? (
                  <>
                    <div class="muted">{t('chk.suggest')} {t(('fix.' + i.fix) as UiKey, { v: i.fixValue ?? '' })}</div>
                    <div class="btn-row">
                      <button type="button" class="btn btn-primary btn-small" onClick={() => setFix(i.row, i.fix === 'drop' ? 'drop' : 'fix')}>{t('chk.apply')}</button>
                      {i.fix !== 'drop' && <button type="button" class="btn btn-small" onClick={() => setFix(i.row, 'drop')}>{t('chk.drop')}</button>}
                    </div>
                  </>
                ) : <div class="ok-text">{f === 'drop' ? t('chk.dropped') : t('chk.done')}</div>}
              </div>
            </li>
          );
        })}
      </ul>
      {total > issues.length && <p class="muted">{t('chk.more', { n: n(total - issues.length) })}</p>}
    </div>
  );
}

