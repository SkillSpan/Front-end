import React, { useState } from 'react';
import './ForgotPassword.css';
import { forgotPassword } from '../../api';

const ForgotPassword = ({ onBackToLogin, onContinueToVerify }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Email address is required');
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setIsSubmitted(true);
    } catch (err) {
      setError(err.message || 'Unable to send the reset code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="forgot-wrapper">
      <div className="forgot-card">
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

        <div className="form-right-forgot">
          {isSubmitted ? (
            <>
              <div className="fp-icon fp-icon-mail" aria-hidden="true" />

              <h1 className="forgot-heading fp-heading fp-heading-sent">Check your email</h1>
              <p className="forgot-subtitle fp-subtitle fp-subtitle-sent">
                A 6-digit reset code has been sent to your email address <strong>{email}</strong>.
                {' '}Please check your inbox (and spam folder) and enter the code on the next screen.
                {' '}The code will expire in 10 minutes.
              </p>

              <button
                type="button"
                className="btn-send-link fp-btn"
                onClick={() => onContinueToVerify && onContinueToVerify(email)}
              >
                Continue to Verify
              </button>
            </>
          ) : (
            <>
              <div className="fp-icon fp-icon-lock" aria-hidden="true" />

              <h1 className="forgot-heading fp-heading">Reset Your Password</h1>
              <p className="forgot-subtitle fp-subtitle">
                Please enter the email address associated with your account, and we will send you a password reset link.
              </p>

              <form className="fp-form" onSubmit={handleSubmit} noValidate>
                <div className="input-group fp-input-group">
                  <input
                    type="email"
                    className={`forgot-input ${error ? 'input-error' : ''}`}
                    placeholder="Email Address"
                    aria-label="Email Address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                  />
                  {error && <span className="error-text">{error}</span>}
                </div>

                <button type="submit" className="btn-send-link fp-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </button>

                <div className="back-link-container fp-back">
                  <span onClick={onBackToLogin} className="link-action">← Back to Log in</span>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;