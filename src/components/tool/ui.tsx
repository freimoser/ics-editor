import { createContext, type ComponentChildren } from 'preact';
import { useContext } from 'preact/hooks';
import type { Lang } from '../../i18n/routes';
import { tr, type UiKey } from '../../i18n/ui';
import { formatBytes, formatInt } from '../../lib/text';
import { fmtDate } from '../../lib/datetime';

export const LangCtx = createContext<Lang>('de');

export function useT() {
  const lang = useContext(LangCtx);
  const t = (k: UiKey, v: Record<string, string | number> = {}) => tr(lang, k, v);
  return {
    lang,
    t,
    n: (x: number) => formatInt(x, lang),
    b: (x: number) => formatBytes(x, lang),
    d: (w: number | null) => (w === null || !isFinite(w) ? '–' : fmtDate(w, lang)),
    y: (w: number | null) => (w === null || !isFinite(w) ? '–' : String(new Date(w).getUTCFullYear()))
  };
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Text mit <strong> aus unseren eigenen Übersetzungen; eingesetzte Werte werden maskiert. */
export function H({ k, v = {}, as = 'span', class: cls }: { k: UiKey; v?: Record<string, string | number>; as?: 'span' | 'p' | 'li' | 'div'; class?: string }) {
  const lang = useContext(LangCtx);
  const safe: Record<string, string> = {};
  for (const [key, val] of Object.entries(v)) safe[key] = esc(String(val));
  const Tag = as;
  return <Tag class={cls} dangerouslySetInnerHTML={{ __html: tr(lang, k, safe) }} />;
}

const P = { fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' } as const;

const ICONS: Record<string, ComponentChildren> = {
  file: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M12 18v-6M9 14.5l3-3 3 3" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14.5v2.5" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>,
  ok: <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  warn: <><path d="M12 3l9.5 17h-19z" /><path d="M12 10v4.5M12 17.5v.5" /></>,
  bad: <><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" /></>,
  parts: <><rect x="3" y="4" width="8" height="16" rx="1.5" /><rect x="13" y="4" width="8" height="16" rx="1.5" /></>,
  download: <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" /></>,
  split: <><path d="M4 6h6l4 6-4 6H4" /><path d="M14 12h6M17 9l3 3-3 3" /></>,
  broom: <><path d="M19 4l-7 7" /><path d="M5 21c0-4 2-7 6-9l2 2c-2 4-5 6-8 7z" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4M8 15l2.5 2.5L16 13" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  monitor: <><rect x="2" y="4" width="20" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  list: <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  left: <path d="M15 6l-6 6 6 6" />,
  right: <path d="M9 6l6 6-6 6" />,
  down: <path d="M7 10l5 5 5-5" />,
  up: <path d="M12 19V5M6 11l6-6 6 6" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></>,
  upload: <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2.2.6 3.5 2.6 3.5 6" /></>,
  pin: <><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  text: <path d="M4 6h16M4 12h16M4 18h10" />,
  repeat: <><path d="M17 2l4 4-4 4" /><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4" /><path d="M21 13v2a3 3 0 0 1-3 3H3" /></>,
  mark: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></>
};

export function Icon({ name, size = 24, class: cls }: { name: keyof typeof ICONS | string; size?: number; class?: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" class={'icon ' + (cls ?? '')} {...P}>
      {ICONS[name]}
    </svg>
  );
}

export function Status({ tone, title, text }: { tone: 'ok' | 'warn' | 'bad'; title: string; text?: string }) {
  const icon = tone === 'ok' ? 'ok' : tone === 'warn' ? 'parts' : 'bad';
  return (
    <div class={'status status-' + tone} role="status">
      <Icon name={icon} size={28} />
      <div>
        <div class="status-title">{title}</div>
        {text && <div class="status-text">{text}</div>}
      </div>
    </div>
  );
}

export function Source({ href, label }: { href: string; label: string }) {
  const { t } = useT();
  return (
    <p class="source">
      {t('src.label')} <a href={href} rel="noopener">{label}</a>
    </p>
  );
}

export const HELP = {
  import: 'https://support.google.com/calendar/answer/37118',
  problems: 'https://support.google.com/calendar/answer/45654',
  create: 'https://support.google.com/calendar/answer/37095',
  delete: 'https://support.google.com/calendar/answer/37188'
};
