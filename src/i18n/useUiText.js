import { useCallback } from "react";
import { useI18n } from "./useI18n";
import careerJourney from "./ui/careerJourney";
import careerRoles from "./ui/careerRoles";
import skillMatrix from "./ui/skillMatrix";
import assistant from "./ui/assistant";
import messages from "./ui/messages";
import support from "./ui/support";
import evidence from "./ui/evidence";
import skills from "./ui/skills";

// One English -> Arabic table for learner screens. L("Refresh") returns the
// Arabic in AR and the English otherwise; a string not in the table (API
// content) comes back unchanged. {name} placeholders are filled from vars.
export const UI_AR = Object.fromEntries([careerJourney, careerRoles, skillMatrix, assistant, messages, support, evidence].flat());

function fill(text, vars) {
  if (!vars) return text;
  return Object.entries(vars).reduce((acc, [k, v]) => acc.split(`{${k}}`).join(String(v ?? "")), text);
}

export function uiText(lang, en, vars) {
  const base = lang === "ar" && UI_AR[en] != null ? UI_AR[en] : en;
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
