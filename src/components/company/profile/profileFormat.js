// Locale helpers for the Organization Profile. Latin digits in Arabic too,
// like the dashboard (dashboard/format.js).
import { formatDate } from '../dashboard/format';

export function formatDay(iso, lang) {
  if (!iso) return '';
  return formatDate(String(iso).slice(0, 10), lang);
}

export function formatBytes(bytes, lang) {
  const n = Number(bytes) || 0;
  const mb = lang === 'ar' ? 'م.ب' : 'MB';
  const kb = lang === 'ar' ? 'ك.ب' : 'KB';
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} ${mb}`;
  return `${Math.max(1, Math.round(n / 1024))} ${kb}`;
}
