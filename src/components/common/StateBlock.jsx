import "./StateBlock.css";

/**
 * One look for loading, empty and error states on every learner screen.
 * <StateBlock kind="loading" title="Loading…" />
 * <StateBlock kind="error" title="…" message="…" action={{ label: "Try again", onClick }} />
 * <StateBlock kind="empty" title="…" message="…" action={…} />
 */
export default function StateBlock({ kind = "empty", title, message, action, secondary, compact = false }) {
  const role = kind === "error" ? "alert" : kind === "loading" ? "status" : undefined;
  return (
    <div className={`ss-state ss-state--${kind}${compact ? " ss-state--compact" : ""}`} role={role} aria-live={kind === "loading" ? "polite" : undefined}>
      {kind === "loading" && <span className="ss-state-spinner" aria-hidden="true" />}
      {title && <p className="ss-state-title">{title}</p>}
      {message && <p className="ss-state-message">{message}</p>}
      {(action || secondary) && (
        <div className="ss-state-actions">
          {action && (
            <button type="button" className="ss-btn ss-btn--primary" onClick={action.onClick}>
              {action.label}
            </button>
          )}
          {secondary && (
            <button type="button" className="ss-btn ss-btn--ghost" onClick={secondary.onClick}>
              {secondary.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
