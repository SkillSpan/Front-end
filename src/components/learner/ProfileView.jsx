import { useCallback, useEffect, useMemo, useState } from "react";

import { getProfile, updateProfile, uploadProfileAvatar, deleteProfileAvatar, fetchProfileAvatarUrl, unwrapApiData } from "../../api";
import { useAuth } from "../auth/AuthContext";
import { useI18n } from "../../i18n/useI18n";
import "./profile-settings.css";

const VISIBILITY = ["public", "organization_only", "private"];

const EDITABLE = [
  "university_name",
  "student_university_number",
  "specialization",
  "academic_level",
  "expected_graduation",
  "bio",
  "visibility",
];

function initials(name) {
  const clean = String(name || "").trim();
  if (!clean) return "SS";
  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function formatDate(iso, lang) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function draftFrom(profile) {
  const next = {};
  EDITABLE.forEach((field) => {
    next[field] = profile?.[field] ?? (field === "visibility" ? "private" : "");
  });
  return next;
}

function Field({ label, value, editing, onChange, type = "text", placeholder, hint }) {
  return (
    <div className="ps-field">
      <label className="ps-label" htmlFor={`profile-${label}`}>
        {label}
      </label>
      {editing ? (
        <input
          id={`profile-${label}`}
          className="ps-input"
          type={type}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <p className={`ps-value${value ? "" : " is-empty"}`}>{value || placeholder}</p>
      )}
      {hint ? <p className="ps-hint">{hint}</p> : null}
    </div>
  );
}

export default function ProfileView({ readinessScore = 0, roleLabel = "" }) {
  const { authUser } = useAuth();
  const { t, lang } = useI18n();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => draftFrom(null));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState("");

  // Profile photo: `avatarUrl` is a blob object URL for the current photo
  // (fetched with the bearer token), `previewUrl` shows a locally-selected
  // file before it is uploaded. Both are revoked on change.
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await getProfile();
      const row = unwrapApiData(payload) || {};
      setProfile(row);
      setDraft(draftFrom(row));
      if (row?.has_avatar) {
        const url = await fetchProfileAvatarUrl();
        setAvatarUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      }
    } catch (err) {
      setError(err?.message || "");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // The loader awaits before it touches state, so this cannot cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const completeness = useMemo(() => {
    const value = Number(profile?.completeness_percent);
    return Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0;
  }, [profile]);

  const startEdit = () => {
    setDraft(draftFrom(profile));
    setSaveError("");
    setSaved(false);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setSaveError("");
    setDraft(draftFrom(profile));
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const payload = {};
      EDITABLE.forEach((field) => {
        const value = draft[field];
        payload[field] = field === "expected_graduation"
          ? (value === "" || value == null ? null : Number(value))
          : value === "" ? null : value;
      });
      const response = await updateProfile(payload);
      const row = unwrapApiData(response);
      setProfile((prev) => ({ ...(prev || {}), ...(row || payload) }));
      setEditing(false);
      setSaved(true);
    } catch (err) {
      setSaveError(err?.message || t("profile.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const setField = (field) => (value) => setDraft((prev) => ({ ...prev, [field]: value }));

  // Revoke any outstanding blob URLs when the view unmounts.
  useEffect(() => {
    return () => {
      setAvatarUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
    };
  }, []);

  // Choosing a file saves it immediately — no second "Save photo" click. The
  // local preview shows straight away, then the server's (cropped, re-encoded)
  // copy replaces it once the upload lands.
  const onPickAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    // Let the same file be chosen again after a remove.
    event.target.value = "";
    setAvatarError("");
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setAvatarBusy(true);
    try {
      const response = await uploadProfileAvatar(file);
      const row = unwrapApiData(response) || {};
      setProfile((prev) => ({ ...(prev || {}), ...row }));
      const url = await fetchProfileAvatarUrl();
      setAvatarUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    } catch (err) {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setAvatarError(err?.message || t("profile.avatarError"));
    } finally {
      setAvatarBusy(false);
    }
  };

  const removeAvatar = async () => {
    setAvatarBusy(true);
    setAvatarError("");
    try {
      const response = await deleteProfileAvatar();
      const row = unwrapApiData(response) || {};
      setProfile((prev) => ({ ...(prev || {}), ...row }));
      setAvatarUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    } catch (err) {
      setAvatarError(err?.message || t("profile.avatarError"));
    } finally {
      setAvatarBusy(false);
    }
  };

  const name = authUser?.name || authUser?.full_name || "—";
  const email = authUser?.email || "—";

  const circumference = 2 * Math.PI * 36;
  const dash = (completeness / 100) * circumference;

  return (
    <div className="ps-page">
      <header className="ps-head">
        <div>
          <h1 className="ps-title">{t("profile.title")}</h1>
          <p className="ps-subtitle">{t("profile.subtitle")}</p>
        </div>
        <div className="ps-head-actions">
          {editing ? (
            <>
              <button type="button" className="ps-btn ps-btn--ghost" onClick={cancelEdit} disabled={saving}>
                {t("profile.cancel")}
              </button>
              <button type="button" className="ps-btn ps-btn--primary" onClick={save} disabled={saving}>
                {saving ? t("profile.saving") : t("profile.save")}
              </button>
            </>
          ) : (
            <button type="button" className="ps-btn ps-btn--primary" onClick={startEdit} disabled={loading || !profile}>
              {t("profile.edit")}
            </button>
          )}
        </div>
      </header>

      {saved && !editing && <div className="ps-banner ps-banner--ok">{t("profile.saved")}</div>}
      {error && (
        <div className="ps-banner ps-banner--err" role="alert">
          <span>{t("profile.loadError")}</span>
          <button type="button" className="ps-link" onClick={load}>{t("profile.retry")}</button>
        </div>
      )}
      {saveError && (
        <div className="ps-banner ps-banner--err" role="alert">
          {saveError}
        </div>
      )}

      <div className="ps-grid">
        <aside className="ps-card ps-identity">
          <div className="ps-avatar-wrap">
            <div className="ps-avatar">
              {previewUrl || avatarUrl ? (
                <img className="ps-avatar-img" src={previewUrl || avatarUrl} alt="" />
              ) : (
                <span aria-hidden="true">{initials(name)}</span>
              )}
            </div>
            <div className="ps-avatar-actions">
              <label className={`ps-btn ps-btn--ghost ps-btn--sm${avatarBusy ? " is-disabled" : ""}`}>
                {t("profile.photoChange")}
                <input type="file" accept="image/*" className="ps-file-input" onChange={onPickAvatar} disabled={avatarBusy} />
              </label>
              {(avatarUrl || previewUrl) && (
                <button type="button" className="ps-btn ps-btn--ghost ps-btn--sm" onClick={removeAvatar} disabled={avatarBusy}>
                  {t("profile.photoRemove")}
                </button>
              )}
              {avatarBusy && <span className="ps-avatar-saving">{t("profile.saving")}</span>}
            </div>
          </div>
          {avatarError && (
            <p className="ps-hint ps-banner--err" role="alert">{avatarError}</p>
          )}
          <h2 className="ps-name">{name}</h2>
          <p className="ps-muted ps-email">{email}</p>
          <span className="ps-chip">{roleLabel || t("profile.noRole")}</span>

          <div className="ps-ring">
            <svg width="88" height="88" viewBox="0 0 88 88" role="img" aria-label={`${completeness}%`}>
              <circle cx="44" cy="44" r="36" fill="none" stroke="var(--ps-track)" strokeWidth="8" />
              <circle
                cx="44"
                cy="44"
                r="36"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
                transform="rotate(-90 44 44)"
              />
            </svg>
            <span className="ps-ring-value">{completeness}%</span>
          </div>
          <p className="ps-muted ps-ring-caption">
            {t("profile.completeness")} · {completeness}% {t("profile.complete")}
          </p>

          <dl className="ps-meta">
            <div>
              <dt>{t("profile.readiness")}</dt>
              <dd>{Math.round(Number(readinessScore) || 0)}/100</dd>
            </div>
            <div>
              <dt>{t("profile.updated")}</dt>
              <dd>{formatDate(profile?.updated_at, lang)}</dd>
            </div>
          </dl>
        </aside>

        <div className="ps-col">
          <section className="ps-card">
            <h3 className="ps-section-title">{t("profile.identity")}</h3>
            <div className="ps-fields">
              <div className="ps-field">
                <span className="ps-label">{t("profile.name")}</span>
                <p className="ps-value">{name}</p>
              </div>
              <div className="ps-field">
                <span className="ps-label">{t("profile.email")}</span>
                <p className="ps-value">{email}</p>
              </div>
            </div>
            <p className="ps-hint ps-locked">{t("profile.lockedNote")}</p>
          </section>

          <section className="ps-card">
            <h3 className="ps-section-title">{t("profile.academic")}</h3>
            <div className="ps-fields ps-fields--two">
              <Field
                label={t("profile.university")}
                value={editing ? draft.university_name : profile?.university_name}
                editing={editing}
                onChange={setField("university_name")}
                placeholder={t("profile.notSet")}
              />
              <Field
                label={t("profile.studentNumber")}
                value={editing ? draft.student_university_number : profile?.student_university_number}
                editing={editing}
                onChange={setField("student_university_number")}
                placeholder={t("profile.notSet")}
              />
              <Field
                label={t("profile.specialization")}
                value={editing ? draft.specialization : profile?.specialization}
                editing={editing}
                onChange={setField("specialization")}
                placeholder={t("profile.notSet")}
              />
              <Field
                label={t("profile.level")}
                value={editing ? draft.academic_level : profile?.academic_level}
                editing={editing}
                onChange={setField("academic_level")}
                placeholder={t("profile.notSet")}
              />
              <Field
                label={t("profile.graduation")}
                value={editing ? draft.expected_graduation : profile?.expected_graduation}
                editing={editing}
                onChange={setField("expected_graduation")}
                type="number"
                placeholder={t("profile.notSet")}
              />
            </div>
          </section>

          <section className="ps-card">
            <h3 className="ps-section-title">{t("profile.about")}</h3>
            {editing ? (
              <textarea
                className="ps-input ps-textarea"
                rows={4}
                maxLength={2000}
                value={draft.bio ?? ""}
                placeholder={t("profile.bioPlaceholder")}
                onChange={(event) => setField("bio")(event.target.value)}
              />
            ) : (
              <p className={`ps-value${profile?.bio ? "" : " is-empty"}`}>
                {profile?.bio || t("profile.bioPlaceholder")}
              </p>
            )}
          </section>

          <section className="ps-card">
            <h3 className="ps-section-title">{t("profile.visibility")}</h3>
            <div className="ps-segment" role="radiogroup" aria-label={t("profile.visibility")}>
              {VISIBILITY.map((option) => {
                const active = (editing ? draft.visibility : profile?.visibility) === option;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`ps-segment-item${active ? " is-active" : ""}`}
                    onClick={() => (editing ? setField("visibility")(option) : startEdit())}
                  >
                    {t(`profile.visibility.${option}`)}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
