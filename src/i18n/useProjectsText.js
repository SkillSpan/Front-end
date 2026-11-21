import { useCallback } from "react";
import { useI18n } from "./useI18n";
import { PROJECTS_KEY_BY_EN } from "./projectsMessages";

/**
 * L("View") -> "عرض" in Arabic. Takes the English UI string so the screens stay
 * readable; anything not in the table (API content) is returned unchanged.
 */
export function useProjectsText() {
  const { t, isRtl, lang } = useI18n();
  const L = useCallback((en, vars) => {
    const key = PROJECTS_KEY_BY_EN[en];
    return key ? t(key, vars) : en;
  }, [t]);
  return { L, isRtl, lang };
}
