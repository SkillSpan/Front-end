// Small locale helpers for the dashboard. English keeps the short forms used
// in the design ("10 min ago", "3 Nov 2026"); Arabic uses Intl with Latin
// digits so numbers match the rest of the UI.
const locale = (lang) => (lang === 'ar' ? 'ar-u-nu-latn' : 'en-GB');

export function formatDate(iso, lang, { year = true } = {}) {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return String(iso);
  return new Intl.DateTimeFormat(locale(lang), { day: 'numeric', month: 'short', ...(year ? { year: 'numeric' } : {}) }).format(d);
}

export function formatAgo(ago, lang, t) {
  if (!ago) return '';
  const { value, unit } = ago;
  if (value === 0) return t('company.ws.justNow');
  if (lang !== 'ar') {
    if (unit === 'minute') return `${value} min ago`;
    if (unit === 'hour') return `${value} h ago`;
    if (unit === 'day' && value === 1) return 'Yesterday';
    return `${value} ${unit}s ago`;
  }
  return new Intl.RelativeTimeFormat(locale(lang), { numeric: 'auto' }).format(-value, unit);
}

// created_at (ISO) → { value, unit } for the "10 min ago" form, inside a week;
// older items show their date, like the design.
export function agoFrom(iso, now = Date.now()) {
  const ts = iso ? Date.parse(iso) : NaN;
  if (Number.isNaN(ts)) return null;
  const minutes = Math.max(0, Math.floor((now - ts) / 60000));
  if (minutes < 60) return { value: minutes, unit: 'minute' };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { value: hours, unit: 'hour' };
  const days = Math.floor(hours / 24);
  if (days < 7) return { value: days, unit: 'day' };
  return null;
}

