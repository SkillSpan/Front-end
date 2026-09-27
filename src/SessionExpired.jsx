import './SessionExpired.css';

const SessionExpired = ({ onGoToLogin, onGoHome }) => {
  return (
    <div className="se-wrapper">
      <div className="se-card">
        <div className="se-icon-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round" width="56" height="56">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1 className="se-heading">Your session has expired</h1>
        <p className="se-subtext">
          For your security, we signed you out. Please log in again to continue where you left off.
        </p>

        <div className="se-actions">
          {onGoToLogin && (
            <button type="button" className="se-btn-primary" onClick={onGoToLogin}>
              Log in again
            </button>
          )}
          {onGoHome && (
            <button type="button" className="se-btn-secondary" onClick={onGoHome}>
              Go to home
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionExpired;
