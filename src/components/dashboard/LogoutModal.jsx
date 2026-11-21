import { useEffect, useState } from 'react';
import './LogoutModal.css';

/**
 * LogoutModal
 * -----------
 * Confirmation modal shown before signing the user out of SkillSpan.
 * Matches the "Log out of SkillSpan?" design (dark card, gradient icon,
 * gradient primary action, and a "log out from all devices" danger zone).
 *
 * Fully presentational/controlled - it doesn't call the API itself.
 * Wire `onConfirm` / `onConfirmAllDevices` to your real logout calls
 * (see the `logoutUser` / `logoutAllDevices` placeholders in api.js).
 *
 * Props:
 *  - isOpen: boolean - whether the modal is visible
 *  - onClose: () => void - called on Cancel / backdrop click / Escape
 *  - onConfirm: () => Promise<void> | void - called when "Log out" is confirmed
 *  - onConfirmAllDevices: () => Promise<void> | void - optional, called when
 *      the user confirms "Log out from all devices"
 *  - error: string - optional error message to display (e.g. from a failed API call)
 */
function LogoutModal({ isOpen, onClose, onConfirm, onConfirmAllDevices, error }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [confirmAllDevices, setConfirmAllDevices] = useState(false);

  // Reset local state whenever the modal transitions from closed -> open.
  // Adjusting state during render (rather than in an effect) avoids an
  // extra render pass - see https://react.dev/learn/you-might-not-need-an-effect
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setIsLoggingOut(false);
      setIsLoggingOutAll(false);
      setConfirmAllDevices(false);
    }
  }

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const busy = isLoggingOut || isLoggingOutAll;

  const handleConfirm = async () => {
    if (busy) return;
    try {
      setIsLoggingOut(true);
      await onConfirm?.();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleConfirmAllDevices = async () => {
    if (busy) return;
    // First tap expands the danger zone / asks for confirmation,
    // second tap actually triggers the sign-out-everywhere action.
    if (!confirmAllDevices) {
      setConfirmAllDevices(true);
      return;
    }
    try {
      setIsLoggingOutAll(true);
      await (onConfirmAllDevices ? onConfirmAllDevices() : onConfirm?.());
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  return (
    <div
      className="logout-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="logout-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-modal-title"
      >
        <div className="logout-modal-icon-box">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="logoutIconGradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4F7CFF" />
                <stop offset="100%" stopColor="#9E51FA" />
              </linearGradient>
            </defs>
            <path
              d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3"
              stroke="url(#logoutIconGradient)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 17l5-5-5-5"
              stroke="url(#logoutIconGradient)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21 12H9"
              stroke="url(#logoutIconGradient)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 id="logout-modal-title" className="logout-modal-title">
          Log out of SkillSpan?
        </h2>
        <p className="logout-modal-subtitle">
          Are you sure you want to log out of your account?
        </p>

        {error && <div className="logout-modal-error">{error}</div>}

        <button
          type="button"
          className="logout-modal-btn-primary"
          onClick={handleConfirm}
          disabled={busy}
        >
          {isLoggingOut ? (
            <span className="logout-modal-spinner" aria-hidden="true" />
          ) : (
            <>
              <span className="logout-modal-btn-arrow" aria-hidden="true">→</span>
              Log out
            </>
          )}
        </button>

        <button
          type="button"
          className="logout-modal-btn-secondary"
          onClick={onClose}
          disabled={busy}
        >
          Cancel
        </button>

        <p className="logout-modal-footnote">
          You will need to log in again to access your account.
        </p>

        <button
          type="button"
          className={`logout-modal-danger${confirmAllDevices ? ' is-confirming' : ''}`}
          onClick={handleConfirmAllDevices}
          disabled={busy}
        >
          <span className="logout-modal-danger-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="4" width="20" height="13" rx="2" stroke="#F87171" strokeWidth="1.6" />
              <path d="M8 21h8M12 17v4" stroke="#F87171" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <span className="logout-modal-danger-text">
            <span className="logout-modal-danger-title">
              {isLoggingOutAll
                ? 'Signing out everywhere…'
                : confirmAllDevices
                  ? 'Tap again to confirm'
                  : 'Log out from all devices'}
            </span>
            <span className="logout-modal-danger-subtitle">
              This will sign you out of your current session and every other active device.
            </span>
          </span>
          <span className="logout-modal-danger-chevron" aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  );
}

export default LogoutModal;
