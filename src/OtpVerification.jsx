import React, { useState, useRef, useEffect } from 'react';
import { verifyOtp, resendOtp } from './api';
import './OtpVerification.css';

// ملاحظة: الصفحتين اللي بتستدعوا هاد الكومبوننت (RegisterWizard.jsx و
// CompanyWizard.jsx) بيبعتوا الإيميل باسم `userEmail` مش `email` - قبل
// التعديل كان الكومبوننت يقرأ `email` فقط، فكانت الخانة تظهر فاضية دايماً.
// هيك صار المستخدم يضطر يكتب إيميله يدوياً، وأي غلطة إملائية = الكود يروح
// لعنوان غلط. الحل: نقرأ `userEmail` (ونخلي `email` احتياطي لأي استدعاء
// مستقبلي).
const OtpVerification = ({ userEmail, email: legacyEmail, onVerifySuccess, onBack, onContinueToLogin }) => {
  const confirmedEmail = userEmail || legacyEmail || '';
  const [emailInput, setEmailInput] = useState(confirmedEmail);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(600);
  const [resendTimer, setResendTimer] = useState(60);
  const [isResendState, setIsResendState] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);

  // نحدّث الحقل تلقائياً إذا وصل الإيميل بعد أول رندر
  useEffect(() => {
    if (confirmedEmail) setEmailInput(confirmedEmail);
  }, [confirmedEmail]);

  useEffect(() => {
    let timer = null;
    if (timeLeft > 0 || resendTimer > 0) {
      timer = setInterval(() => {
        if (timeLeft > 0) setTimeLeft((prev) => prev - 1);
        if (resendTimer > 0) setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft, resendTimer]);

  // s***t@example.com - shows enough to recognise the address without exposing it
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

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (error) setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleResendClick = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      setError('Please enter a valid email address first.');
      return;
    }

    setIsResending(true);
    setError('');
    try {
      await resendOtp(emailInput);
      setIsResendState(true);
      setResendTimer(60);
      setTimeLeft(582);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Failed to resend the code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const enteredCode = otp.join('');

    if (!emailInput || !emailInput.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (enteredCode.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setError('');
    setIsVerifying(true);

    try {
      await verifyOtp(emailInput, enteredCode);
      setIsVerified(true);
    } catch (err) {
      setError(err.message || 'The verification code is invalid or has expired.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerified) {
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

          <div className="form-right verified-container">
            <div className="success-icon-box">
              <svg className="success-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="verified-heading">Email verified!</h1>
            <p className="verified-desc">
              Your email has been successfully verified.<br />
              You can now access your account.
            </p>

            <button
              type="button"
              className="btn-continue"
              onClick={() => {
                if (typeof onContinueToLogin === 'function') {
                  onContinueToLogin();
                } else if (typeof onVerifySuccess === 'function') {
                  onVerifySuccess(otp.join(''));
                }
              }}
            >
              Continue to login
            </button>

            <div className="verified-footer-link">
              <button type="button" className="landing-link-btn" onClick={onBack}>
                Back to landing page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

        <div className="form-right otp-container">
          <div className="email-icon-box" aria-hidden="true" />

          <h1 className="otp-heading">Verify Your Identity</h1>

          <form onSubmit={handleVerify} className="otp-form-content">

            {confirmedEmail ? (
              <p className="otp-email-confirm">
                We've sent a 6-digit verification code to{' '}
                <strong>{maskEmail(confirmedEmail)}</strong>. Please enter it below to proceed.
              </p>
            ) : (
              <div className="otp-email-fallback">
                <label htmlFor="otp-email-input">Email Address</label>
                <input
                  id="otp-email-input"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your email address"
                />
              </div>
            )}

            <div className="otp-inputs-row">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className={`otp-box ${error ? 'otp-box-error' : ''}`}
                />
              ))}
            </div>

            <div className="timer-info">
              <span className="timer-dot"></span>
              <span>Code expires in <strong className="timer-highlight">{formatTime(timeLeft)}</strong></span>
            </div>

            <button type="submit" className="btn-verify-code" disabled={isVerifying}>
              {isVerifying ? 'Verifying...' : 'Verify code'}
            </button>

            {error && <div className="elegant-error-msg">{error}</div>}

            {isResendState && resendTimer > 0 ? (
              <div className="resend-info-box">
                <div className="resend-icon-text">
                  <svg
                    className="repeat-svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  <div className="resend-text-content">
                    <p className="resend-title">Didn't get the code?</p>
                    <p className="resend-desc">You can request a new code after the countdown</p>
                    <p className="resend-countdown">
                      Resend code in <strong>{formatTime(resendTimer)}</strong>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="otp-footer-links">
                {resendTimer > 0 ? (
                  <p>Didn't get the code? Resend in {resendTimer}s</p>
                ) : (
                  <p>
                    Didn't get the code?{' '}
                    <span
                      className="resend-action"
                      onClick={isResending ? undefined : handleResendClick}
                      style={{ cursor: isResending ? 'default' : 'pointer', opacity: isResending ? 0.6 : 1 }}
                    >
                      {isResending ? 'Sending...' : 'Resend code'}
                    </span>
                  </p>
                )}
              </div>
            )}

            <div className="otp-footer-links" style={{ marginTop: '12px' }}>
              <button type="button" className="edit-email-btn" onClick={onBack}>
                Back
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OtpVerification;