import React, { useState, useRef, useEffect } from 'react';
import './VerifyCode.css';
import { verifyForgotPasswordOtp, resendForgotPasswordOtp } from './api';

const VerifyCode = ({ email, onBack, onSuccess }) => {
  const [emailInput, setEmailInput] = useState(email || '');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(480); // مؤقت انتهاء صلاحية الكود (8 دقائق)
  const [resendTimer, setResendTimer] = useState(60); // مؤقت السماح بإعادة الإرسال
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (timeLeft <= 0 && resendTimer <= 0) return;
    const id = setInterval(() => {
      if (timeLeft > 0) setTimeLeft((t) => Math.max(t - 1, 0));
      if (resendTimer > 0) setResendTimer((t) => Math.max(t - 1, 0));
    }, 1000);
    return () => clearInterval(id);
  }, [timeLeft, resendTimer]);

  // s***t@example.com - enough to recognise the address without exposing it
  const maskEmail = (value) => {
    const [local = '', domain = ''] = String(value).split('@');
    if (!domain) return value;
    if (local.length <= 2) return `${local[0] || ''}***@${domain}`;
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (value, index) => {
    if (isNaN(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      if (inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const fullCode = code.join('');

    if (!emailInput || !emailInput.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (fullCode.length < 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');
    try {
      await verifyForgotPasswordOtp(emailInput, fullCode);
      if (onSuccess) onSuccess(fullCode);
    } catch (err) {
      setError(
        err.errors?.otp?.[0] || err.message || 'Invalid or expired code. Please try again.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || isResending) return;

    if (!emailInput || !emailInput.includes('@')) {
      setError('Please enter a valid email address first.');
      return;
    }

    setIsResending(true);
    setError('');
    try {
      await resendForgotPasswordOtp(emailInput);
      setResendTimer(60);
      setTimeLeft(480);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Could not resend the code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="verify-wrapper">
      <div className="verify-card">
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

        <div className="form-right-verify">
          <div className="verify-mail-icon-box" aria-hidden="true" />

          <h1 className="verify-heading">Verify Your Identity</h1>

          <form className="verify-form" onSubmit={handleVerify} noValidate>
            {email ? (
              <p className="verify-email-confirm">
                We've sent a 6-digit verification code to{' '}
                <strong>{maskEmail(email)}</strong>. Please enter it below to proceed.
              </p>
            ) : (
              // Only shown when the wizard has no email (e.g. after a page refresh).
              <div className="verify-email-field">
                <label htmlFor="verify-email-input">Email Address</label>
                <input
                  id="verify-email-input"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your email address"
                  className="verify-email-input"
                />
              </div>
            )}

            <div className="otp-inputs-container">
              {code.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={digit}
                  ref={(el) => (inputRefs.current[index] = el)}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="otp-input-box"
                />
              ))}
            </div>

            <div className="verify-timer-info">
              <span>Code expires in <strong className="verify-timer-highlight">{formatTime(timeLeft)}</strong></span>
            </div>

            <p className="verify-resend-line">
              Didn't get the code?{' '}
              {resendTimer > 0 ? (
                <span className="verify-resend-disabled">Resend in {resendTimer}s</span>
              ) : (
                <button
                  type="button"
                  className="verify-resend-btn"
                  onClick={handleResend}
                  disabled={isResending}
                >
                  {isResending ? 'Resending...' : 'Resend code'}
                </button>
              )}
            </p>

            {error && <span className="error-text verify-error">{error}</span>}

            <button type="submit" className="btn-verify-code" disabled={isVerifying}>
              {isVerifying ? 'Verifying...' : 'Verify code'}
            </button>

            <button type="button" className="verify-back-btn" onClick={onBack}>
              Back
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyCode;