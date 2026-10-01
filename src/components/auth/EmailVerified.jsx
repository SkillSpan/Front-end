import { useState, useEffect } from 'react';
import './EmailVerification.css';

const EmailVerification = ({ onContinueToSetup, onResendEmail }) => {
  const [timer, setTimer] = useState(0);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isResending, setIsResending] = useState(false);

  const canResend = timer === 0 && !isResending;

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = async () => {
    if (!canResend) return;

    setIsResending(true);
    setMessage({ text: '', type: '' });

    try {
      if (typeof onResendEmail === 'function') {
        await onResendEmail();
      }
      setTimer(60);
      setMessage({
        text: 'A new verification code has been sent to your email!',
        type: 'success',
      });
    } catch (err) {
      setMessage({
        text: err?.message || 'Could not resend the code. Please try again.',
        type: 'error',
      });
    } finally {
      setIsResending(false);
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 4000);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <div className="sidebar-left">
          <div className="sidebar-brand">SkillSpan</div>
          <div className="sidebar-content">
            <h2>Start Your<br />Career&nbsp;Journey</h2>
            <p className="sidebar-desc">
              From education to your first opportunity in clear, verified steps
            </p>

            <ul className="features-list">
              <li>
                <span className="icon"><img src="/image/icon-readiness.png" alt="Readiness" /></span>
                <span>Assess your real readiness</span>
              </li>
              <li>
                <span className="icon"><img src="/image/icon-roadmap.png" alt="Roadmap" /></span>
                <span>A roadmap built for you</span>
              </li>
              <li>
                <span className="icon"><img src="/image/icon-projects.png" alt="Projects" /></span>
                <span>Real projects from companies</span>
              </li>
              <li>
                <span className="icon"><img src="/image/icon-record.png" alt="Record" /></span>
                <span>A verified professional record</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="form-right verification-container">
          <div className="email-icon-box" aria-hidden="true" />

          <h1 className="verification-title">Check your email</h1>
          <p className="verification-desc">
            We sent a verification link to your email address.
            <br />
            Click it to activate your account
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
            {isResending ? (
              <p className="resend-text disabled">Resending...</p>
            ) : canResend ? (
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