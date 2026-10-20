import { useState } from "react";

import { logoutAllDevices, logoutUser } from "../../api";
import { ACCENT_SWATCHES, ACCENTS, THEMES } from "../../preferences/constants";
import { usePreferences } from "../../preferences/PreferencesContext";
import { SUPPORTED_LANGUAGES } from "../../i18n/messages";
import { useI18n } from "../../i18n/useI18n";
import "./profile-settings.css";

const THEME_COPY = {
  light: "settings.light",
  dark: "settings.dark",
  system: "settings.system",
};

function ThemeCard({ value, active, onSelect }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      className={`ps-theme-card${active ? " is-active" : ""}`}
      onClick={() => onSelect(value)}
      aria-pressed={active}
    >
      <span className={`ps-theme-preview ps-theme-preview--${value}`} aria-hidden="true">
        <span className="ps-theme-preview-bar" />
        <span className="ps-theme-preview-card" />
        <span className="ps-theme-preview-card" />
      </span>
      <span className="ps-theme-name">{t(THEME_COPY[value])}</span>
      {active && <span className="ps-theme-check" aria-hidden="true">✓</span>}
    </button>
  );
}

export default function SettingsView({ onLogout }) {
  const { t, lang } = useI18n();
  const { theme, accent, setTheme, setAccent, setLang, reset, isRtl } = usePreferences();
  const [accountBusy, setAccountBusy] = useState("");
  const [accountError, setAccountError] = useState("");

  const signOut = async (allDevices) => {
    if (accountBusy) return;
    setAccountBusy(allDevices ? "all" : "one");
    setAccountError("");
    try {
      await (allDevices ? logoutAllDevices() : logoutUser());
    } catch (err) {
      if (err?.status && err.status !== 401) {
        setAccountError(err.message || "Something went wrong while logging out.");
        setAccountBusy("");
        return;
      }
    }
    setAccountBusy("");
    onLogout?.();
  };

  return (
    <div className="ps-page">
      <header className="ps-head">
        <div>
          <h1 className="ps-title">{t("settings.title")}</h1>
          <p className="ps-subtitle">{t("settings.subtitle")}</p>
        </div>
        <span className="ps-saved-badge">{t("settings.savedLocally")}</span>
      </header>

      <div className="ps-col ps-col--narrow">
        <section className="ps-card">
          <div className="ps-section-head">
            <h3 className="ps-section-title">{t("settings.theme")}</h3>
            <p className="ps-hint">{t("settings.themeHint")}</p>
          </div>
          <div className="ps-theme-grid">
            {THEMES.map((value) => (
              <ThemeCard key={value} value={value} active={theme === value} onSelect={setTheme} />
            ))}
          </div>

          <div className="ps-divider" />

          <h3 className="ps-section-title">{t("settings.accent")}</h3>
          <div className="ps-swatches">
            {ACCENTS.map((value) => {
              const swatch = ACCENT_SWATCHES[value];
              return (
                <button
                  key={value}
                  type="button"
                  className={`ps-swatch${accent === value ? " is-active" : ""}`}
                  style={{ "--swatch": swatch.hex }}
                  onClick={() => setAccent(value)}
                  aria-pressed={accent === value}
                  aria-label={swatch.label}
                  title={swatch.label}
                >
                  <span className="ps-swatch-dot" />
                </button>
              );
            })}
          </div>
        </section>

        <section className="ps-card">
          <div className="ps-section-head">
            <h3 className="ps-section-title">{t("settings.language")}</h3>
            <p className="ps-hint">{t("settings.languageHint")}</p>
          </div>
          <div className="ps-lang-grid">
            {SUPPORTED_LANGUAGES.map((option) => (
              <button
                key={option.code}
                type="button"
                className={`ps-lang${lang === option.code ? " is-active" : ""}`}
                onClick={() => setLang(option.code)}
                aria-pressed={lang === option.code}
              >
                <span className="ps-lang-native">{option.native}</span>
                <span className="ps-lang-label">{option.code === "ar" ? "العربية" : "English"}</span>
              </button>
            ))}
          </div>
          <p className={`ps-rtl-note${isRtl ? " is-on" : ""}`}>
            <span className="ps-rtl-dot" aria-hidden="true" />
            {t("settings.rtl")}
          </p>
        </section>

        <section className="ps-card">
          <h3 className="ps-section-title">{t("settings.account")}</h3>
          {accountError && (
            <div className="ps-banner ps-banner--err" role="alert">{accountError}</div>
          )}
          <div className="ps-actions">
            <button
              type="button"
              className="ps-btn ps-btn--ghost"
              onClick={() => signOut(false)}
              disabled={Boolean(accountBusy)}
            >
              {t("settings.logout")}
            </button>
            <button
              type="button"
              className="ps-btn ps-btn--danger"
              onClick={() => signOut(true)}
              disabled={Boolean(accountBusy)}
            >
              {t("settings.logoutAll")}
            </button>
          </div>

          <div className="ps-divider" />

          <div className="ps-reset-row">
            <div>
              <p className="ps-value">{t("settings.reset")}</p>
              <p className="ps-hint">{t("settings.resetHint")}</p>
            </div>
            <button type="button" className="ps-btn ps-btn--ghost" onClick={reset}>
              {t("settings.reset")}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
