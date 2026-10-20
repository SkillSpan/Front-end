import { useEffect } from "react";

// How long the banner stays before it slides away on its own. Long enough to
// read two lines, short enough not to sit on top of the workspace.
const AUTO_DISMISS_MS = 8000;

// SupportView owns the composer, the workspace owns the shell. Rather than
// threading state through both, the created request is announced on the window
// and the shell listens — the banner has to outlive the view anyway.
export const SUPPORT_CREATED_EVENT = "skillspan:support-created";

function initials(name) {
  const clean = String(name || "").trim();
  if (!clean) return "SS";
  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

/**
 * The "someone is waiting for you" banner.
 *
 * A learner who has just handed a conversation to a person gets no feedback
 * from the thread itself — the reply is minutes away at best. This drops a
 * single card from the top of the screen naming whoever picked the request up
 * (the API returns `assignee_name` on create) and offers the one action that
 * matters: open the thread.
 *
 * `toast` is `{ id, name }`. `name` is empty when the request is still
 * unclaimed, and the copy falls back to the support team.
 */
export default function SupportWaitingToast({ toast = null, onOpen, onClose }) {
  const open = Boolean(toast);
  const toastId = toast?.id ?? null;

  useEffect(() => {
    if (!open) return undefined;
    const timer = setTimeout(() => onClose?.(), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [open, toastId, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const name = String(toast?.name || "").trim();

  return (
    <div className="ss-toast" role="status" aria-live="polite">
      <div className="ss-toast-card">
        <div className="ss-toast-avatar" aria-hidden="true">
          {initials(name)}
          <span className="ss-toast-online" />
        </div>

        <div className="ss-toast-body">
          <p className="ss-toast-title">
            {name ? `${name} is waiting for you` : "Support is waiting for you"}
          </p>
          <p className="ss-toast-text">
            {name
              ? "Your mentor picked up the request. The reply lands in this thread."
              : "Your request is in the queue. A mentor will answer in this thread."}
          </p>
          <div className="ss-toast-actions">
            <button type="button" className="ss-toast-open" onClick={() => onOpen?.()}>
              Open the thread
            </button>
            <button type="button" className="ss-toast-dismiss" onClick={() => onClose?.()}>
              Later
            </button>
          </div>
        </div>

        <button
          type="button"
          className="ss-toast-close"
          aria-label="Dismiss notification"
          onClick={() => onClose?.()}
        >
          ×
        </button>
      </div>
    </div>
  );
}
