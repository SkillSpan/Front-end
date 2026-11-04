import { useCallback } from "react";

import { usePreferences } from "../preferences/PreferencesContext";
import { MESSAGES } from "./messages";

/**
 * `t("profile.title")`, with `{name}` placeholders for anything dynamic.
 * Falls back to English and then to the key itself, so a missing translation
 * shows something readable instead of "undefined".
 */
export function translate(lang, key, vars) {
  const table = MESSAGES[lang] || MESSAGES.en;
  let text = table[key] ?? MESSAGES.en[key] ?? key;
  if (vars) {
    Object.entries(vars).forEach(([name, value]) => {
      text = text.split(`{${name}}`).join(String(value));
    });
  }
  return text;
}

export function useI18n() {
  const { lang, isRtl } = usePreferences();

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);

  return { t, lang, isRtl, dir: isRtl ? "rtl" : "ltr" };
}
