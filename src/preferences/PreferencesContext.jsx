import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  ACCENTS,
  DEFAULT_PREFERENCES,
  LANGUAGES,
  STORE_KEY,
  THEMES,
} from "./constants";

// One small store for everything the learner can change about the app itself.
// It is deliberately separate from AuthContext: preferences belong to the
// browser, not to the session, and they must survive a logout on a shared
// machine (the next learner simply gets their own).
const PreferencesContext = createContext(null);

function readStored() {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      theme: THEMES.includes(parsed?.theme) ? parsed.theme : DEFAULT_PREFERENCES.theme,
      accent: ACCENTS.includes(parsed?.accent) ? parsed.accent : DEFAULT_PREFERENCES.accent,
      lang: LANGUAGES.includes(parsed?.lang) ? parsed.lang : DEFAULT_PREFERENCES.lang,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function systemPrefersDark() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function PreferencesProvider({ children }) {
  const [prefs, setPrefs] = useState(readStored);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  // "system" is a choice, not a value: follow the OS and re-render when it
  // flips, instead of freezing whatever it was at first paint.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event) => setSystemDark(event.matches);
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);

  const resolvedTheme = prefs.theme === "system" ? (systemDark ? "dark" : "light") : prefs.theme;

  // Written straight to <html> so CSS, the browser chrome and screen readers
  // all agree on the current language and direction.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.dataset.accent = prefs.accent;
    root.lang = prefs.lang;
    root.dir = prefs.lang === "ar" ? "rtl" : "ltr";
  }, [resolvedTheme, prefs.accent, prefs.lang]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(prefs));
    } catch {
      // Storage blocked — the choice still applies for this session.
    }
  }, [prefs]);

  const setTheme = useCallback((theme) => {
    if (!THEMES.includes(theme)) return;
    setPrefs((prev) => ({ ...prev, theme }));
  }, []);

  const setAccent = useCallback((accent) => {
    if (!ACCENTS.includes(accent)) return;
    setPrefs((prev) => ({ ...prev, accent }));
  }, []);

  const setLang = useCallback((lang) => {
    if (!LANGUAGES.includes(lang)) return;
    setPrefs((prev) => ({ ...prev, lang }));
  }, []);

  const reset = useCallback(() => setPrefs(DEFAULT_PREFERENCES), []);

  const value = useMemo(
    () => ({
      ...prefs,
      resolvedTheme,
      isRtl: prefs.lang === "ar",
      setTheme,
      setAccent,
      setLang,
      reset,
    }),
    [prefs, resolvedTheme, setTheme, setAccent, setLang, reset],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

// The hook is the only way to read the context and belongs next to its
// provider, even though that upsets the fast-refresh rule.
// eslint-disable-next-line react-refresh/only-export-components
export function usePreferences() {
  const context = useContext(PreferencesContext);
  // A component rendered outside the provider (a unit test, an isolated
  // widget) still gets sane defaults instead of throwing.
  if (!context) {
    return {
      ...DEFAULT_PREFERENCES,
      resolvedTheme: "light",
      isRtl: false,
      setTheme: () => {},
      setAccent: () => {},
      setLang: () => {},
      reset: () => {},
    };
  }
  return context;
}
