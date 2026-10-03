import './SessionExpired.css';

const ClockIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="#6d5cff" strokeWidth="1.8" />
    <path d="M12 7v5l3.5 2" stroke="#6d5cff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Shown full-page whenever api.js clears the session in response to a 401
// on an authenticated request (see api.js `onSessionExpired` / AuthContext
// `sessionExpired`) - this is not a login failure, it's an already-signed-in
// user whose token stopped being valid mid-session.
const SessionExpired = ({ onLoginAgain, onGoToLanding, supportEmail = 'support@skillspan.com' }) => (
  <div className="se-wrapper">
    <div className="se-card">
      <div className="se-icon-box">
        <ClockIcon />
      </div>

      <div className="se-badge">
        <span className="se-badge-dot" />
        Secured Session
      </div>

      <h1 className="se-heading">Your session has expired</h1>
      <p className="se-subtext">
        For your security, your session has ended. Please log in again to continue using SkillSpan.
      </p>

      <button type="button" className="se-btn-primary" onClick={onLoginAgain}>
        Log in again <span aria-hidden="true">→</span>
      </button>

      <button type="button" className="se-btn-secondary" onClick={onGoToLanding}>
        ← Go to Landing Page
      </button>

      <p className="se-support-text">
        Having trouble?{' '}
        <a className="se-support-link" href={`mailto:${supportEmail}`}>
          Contact support
        </a>
      </p>
    </div>
  </div>
);

export default SessionExpired;
