import { useCallback } from "react";
import { useI18n } from "./useI18n";
import { PROJECTS_AR, PROJECTS_EN, PROJECTS_KEY_BY_EN } from "./projectsMessages";
import { UI_AR, uiText } from "./useUiText";

/**
 * L("View") -> "عرض" in Arabic. Takes the English UI string so the screens stay
 * readable; anything not in the table (API content) is returned unchanged.
 *
 * The projects table is consulted first, then the shared learner table, so a
 * project screen can show both project-specific and generic strings.
 */
export function useProjectsText() {
  const { t, isRtl, lang } = useI18n();
  const L = useCallback(
    (en, vars) => {
      const key = PROJECTS_KEY_BY_EN[en];
      if (key) {
        const direct = t(key, vars);
        if (direct !== key) return direct;
      }
      // Fall back to the shared learner table (which also handles the
      // trailing-arrow case).
      return uiText(lang, en, vars);
    },
    [t, lang]
  );
  return { L, isRtl, lang };
}

export { PROJECTS_AR, PROJECTS_EN };
