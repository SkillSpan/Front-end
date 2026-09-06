import { useState, useEffect } from 'react';
import './EmailVerification.css';

const EmailVerification = ({ onContinueToSetup, onResendEmail, userEmail }) => {
  const [timer, setTimer] = useState(60);
  const [message, setMessage] = useState({ text: '', type: '' });

  const canResend = timer === 0;

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = () => {
    if (!canResend) return;
    setTimer(60);
    if (typeof onResendEmail === 'function') {
      onResendEmail();
    }
    setMessage({
      text: 'A new verification code has been sent to your email!',
      type: 'success',
    });
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 4000);
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <div className="sidebar-left">
          <div className="sidebar-brand">SkillSpan</div>
          <div className="sidebar-content">
            <h2>
              Start Your
              <br />
              Career Journey
            </h2>
            <p className="sidebar-desc">
              From education to your first opportunity in clear, verified steps
            </p>

            <ul className="features-list">
              <li>
                <span className="icon">
                  <img src="/image/2.png" alt="Readiness" />
                </span>
                <span>Assess your real readiness</span>
              </li>
              <li>
                <span className="icon">
                  <img src="/image/3.png" alt="Roadmap" />
                </span>
                <span>A roadmap built for you</span>
              </li>
              <li>
                <span className="icon">
                  <img src="/image/4.png" alt="Projects" />
                </span>
                <span>Real projects from companies</span>
              </li>
              <li>
                <span className="icon">
                  <img src="/image/5.png" alt="Record" />
                </span>
                <span>A verified professional record</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="form-right verification-container">
          <div className="email-icon-box">
            <svg
              className="email-svg-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>

          <h1 className="verification-title">Check your email</h1>
          <p className="verification-desc">
            We sent a 6-digit verification code to your email address
            {userEmail ? <strong> {userEmail}</strong> : ''}. Enter it on the next screen to activate your account.
          </p>

          {message.text && (
            <div className={`status-banner ${message.type}`}>
              <span>{message.text}</span>
            </div>
          )}

          <button className="btn-continue-setup" onClick={onContinueToSetup}>
            Continue to Setup
          </button>

          <div className="resend-wrapper">
            {canResend ? (
              <p className="resend-text">
                Didn't receive it?{' '}
                <button type="button" className="btn-resend-link" onClick={handleResend}>
                  Resend email
                </button>
              </p>
            ) : (
              <p className="resend-text disabled">
                Didn't receive it? Resend email in <span className="timer-count">{timer}s</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;