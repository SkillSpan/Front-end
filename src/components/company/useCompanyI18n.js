import { useCallback } from 'react';
import { useI18n } from '../../i18n/useI18n';
import { COMPANY_MESSAGES } from './companyMessages';

/**
 * Same contract as useI18n(): `t(key, vars)` plus lang / isRtl / dir.
 * Looks in the company table first, then falls back to the app-wide
 * MESSAGES (so existing keys like "company.nav.dashboard" keep working).
 */
export function useCompanyI18n() {
  const base = useI18n();
  const { lang, t: baseT } = base;
  const t = useCallback(
    (key, vars) => {
      const table = COMPANY_MESSAGES[lang] || COMPANY_MESSAGES.en;
      let text = table[key] ?? COMPANY_MESSAGES.en[key];
      if (text == null) return baseT(key, vars);
      if (vars) {
        Object.entries(vars).forEach(([name, value]) => {
          text = text.split(`{${name}}`).join(String(value));
        });
      }
      return text;
    },
    [lang, baseT],
  );
  return { ...base, t };
}
