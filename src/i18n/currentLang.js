// The active UI language, readable from anywhere.
//
// Most screens reach the language through `useUiText()` / `useProjectsText()`,
// but a lot of the learner screens also translate inside plain helpers
// (`formatWhen`, `normaliseReadiness`, event handlers, data mappers). Those are
// not components, so a hook cannot be called there — React throws "Invalid hook
// call" and the whole screen unmounts. This module holds the value in one
// place so `L()` works as an ordinary function too.
//
// It is kept in sync by PreferencesProvider, which calls `setCurrentLang`
// during render (before any child renders), so a helper that runs in a child
// always sees the language of the current commit.
import { DEFAULT_PREFERENCES, LANGUAGES, STORE_KEY } from "../preferences/constants";

function readStoredLang() {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES.lang;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return DEFAULT_PREFERENCES.lang;
    const parsed = JSON.parse(raw);
    return LANGUAGES.includes(parsed?.lang) ? parsed.lang : DEFAULT_PREFERENCES.lang;
  } catch {
    return DEFAULT_PREFERENCES.lang;
  }
}

let currentLang = readStoredLang();

export function setCurrentLang(lang) {
  if (LANGUAGES.includes(lang)) currentLang = lang;
}

export function getCurrentLang() {
  return currentLang;
}
