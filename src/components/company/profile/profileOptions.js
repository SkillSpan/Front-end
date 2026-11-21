import { useCompanyI18n } from '../useCompanyI18n';
import { COMPANY_INDUSTRIES, COMPANY_SIZES, ORGANIZATION_TYPES } from '../../../config';

// Option lists come from src/config.js — the same ones Company Registration uses.
export const OPTION_LISTS = { types: ORGANIZATION_TYPES, industries: COMPANY_INDUSTRIES, sizes: COMPANY_SIZES };

/** Translated label of a select value (falls back to the config label). */
export function useOptionLabel() {
  const { t } = useCompanyI18n();
  return (field, value) => {
    if (!value) return '';
    const list = OPTION_LISTS[field.options] || [];
    const opt = list.find((o) => o.value === value);
    const key = `company.pf.opt.${value}`;
    const tr = t(key);
    return tr && tr !== key ? tr : (opt?.label || value);
  };
}

/** Text of a field error: the server's own message, or ours for a code. */
export function errorText(t, entry) {
  if (!entry) return '';
  if (entry.message && !entry.code) return entry.message;
  return t(`company.pf.err.${entry.code}`, { max: entry.max });
}
