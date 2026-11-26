import { useCallback } from "react";
import { useI18n } from "./useI18n";
import { getCurrentLang } from "./currentLang";
import { PROJECTS_AR, PROJECTS_EN } from "./projectsMessages";
import careerJourney from "./ui/careerJourney";
import careerRoles from "./ui/careerRoles";
import skillMatrix from "./ui/skillMatrix";
import assistant from "./ui/assistant";
import messages from "./ui/messages";
import support from "./ui/support";
import evidence from "./ui/evidence";
import skills from "./ui/skills";
import shared from "./ui/shared";

// One English -> Arabic table for learner screens. L("Refresh") returns the
// Arabic in AR and the English otherwise; a string not in the table (API
// content) comes back unchanged. {name} placeholders are filled from vars.
export const UI_AR = Object.fromEntries([shared, careerJourney, careerRoles, skillMatrix, assistant, messages, support, evidence].flat());

// The projects screens keep their strings in their own table, but a screen may
// legitimately show a project string next to a generic one, so both hooks
// consult both tables. The projects table wins when both have the string.
const ALL_AR = { ...UI_AR, ...PROJECTS_AR };
const ALL_EN = { ...PROJECTS_EN };

// Buttons carry a trailing glyph ("Browse All →"). The table holds the words
// without it, so split the glyph off, translate the words, and put it back —
// mirrored in Arabic.
const SUFFIX_RE = /^(.*?)(\s*[→←»«])\s*$/;

function fill(text, vars) {
  if (!vars) return text;
  return Object.entries(vars).reduce((acc, [k, v]) => acc.split(`{${k}}`).join(String(v ?? "")), text);
}

export function uiText(lang, en, vars) {
  if (lang !== "ar") return fill(en, vars);
  const m = SUFFIX_RE.exec(en);
  if (m) {
    const core = ALL_AR[m[1]] ?? m[1];
    return fill(`${core} ${m[2]}`, vars);
  }
  const base = ALL_AR[en] != null ? ALL_AR[en] : en;
  return fill(base, vars);
}

// Skill names: the API's own Arabic name first, then the shared dictionary
// (case-insensitive), then the name as sent. Never a key or an empty string.
const SKILLS_AR_LOWER = new Map(skills.map(([en, ar]) => [en.toLowerCase(), ar]));

export function skillText(lang, name, skill) {
  const en = name == null ? "" : String(name);
  if (lang !== "ar") return en;
  const fromApi = skill && (skill.skillNameAr ?? skill.skill_name_ar ?? skill.name_ar ?? skill.nameAr);
  if (fromApi) return String(fromApi);
  return SKILLS_AR_LOWER.get(en.trim().toLowerCase()) ?? en;
}

export function useUiText() {
  const { lang, isRtl, t } = useI18n();
  const L = useCallback((en, vars) => uiText(lang, en, vars), [lang]);
  const skillLabel = useCallback((name, skill) => skillText(lang, name, skill), [lang]);
  return { L, lang, isRtl, t, skillLabel };
}

// The same translation, callable from a plain function (a data mapper, an
// event handler, a formatter). Hooks cannot be used there, and wrapping the
// call in a hook is what used to crash whole screens. Reads the language from
// the store PreferencesProvider keeps in sync.
export function L(en, vars) {
  return uiText(getCurrentLang(), en, vars);
}
