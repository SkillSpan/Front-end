import { useCallback } from "react";
import { useI18n } from "./useI18n";
import { getCurrentLang } from "./currentLang";
import { PROJECTS_AR, PROJECTS_EN } from "./projectsMessages";
import { uiText } from "./useUiText";

// The shared learner table already merges the projects table, so both hooks
// resolve project strings and generic strings through the same lookup. This
// wrapper exists so project screens keep their own import and so the trailing
// arrow handling stays in one place.
function projectsText(lang, en, vars) {
  return uiText(lang, en, vars);
}

/**
 * L("View") -> "عرض" in Arabic. Takes the English UI string so the screens stay
 * readable; anything not in the table (API content) is returned unchanged.
 */
export function useProjectsText() {
  const { isRtl, lang } = useI18n();
  const L = useCallback((en, vars) => projectsText(lang, en, vars), [lang]);
  return { L, isRtl, lang };
}

// Callable from a plain function — see the note in useUiText.js.
export function L(en, vars) {
  return projectsText(getCurrentLang(), en, vars);
}

export { PROJECTS_AR, PROJECTS_EN };
