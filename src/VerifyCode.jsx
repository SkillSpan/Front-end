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
           <div className="sidebar-brand">
             <span className="white">Skill</span><span className="blue">Span</span>
           </div>
           
           <div className="sidebar-content">
             <h2>Start Your Career Journey</h2>
             <p>From education to your first opportunity in clear, verified steps</p>
             
             <ul className="features-list">
               <li>
                 <span className="icon"><img src="/image/2.png" alt="Readiness" /></span>
                 <span>Assess your real readiness</span>
               </li>
               <li>
                 <span className="icon"><img src="/image/3.png" alt="Roadmap" /></span>
                 <span>A roadmap built for you</span>
               </li>
               <li>
                 <span className="icon"><img src="/image/4.png" alt="Projects" /></span>
                 <span>Real projects from companies</span>
               </li>
               <li>
                 <span className="icon"><img src="/image/5.png" alt="Record" /></span>
                 <span>A verified professional record</span>
               </li>
             </ul>
           </div>
        </div>

        <div className="form-right-verify">
          <div className="verify-content-box">
            <div className="verify-mail-icon-box">
              <svg className="verify-mail-svg" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>

            <span className="verify-subtag">EMAIL VERIFICATION</span>
            <h1 className="verify-heading">Check your inbox</h1>

            <form onSubmit={handleVerify}>
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
                <span className="verify-timer-dot"></span>
                <span>Code expires in <strong className="verify-timer-highlight">{formatTime(timeLeft)}</strong></span>
              </div>

              {error && <span className="error-text">{error}</span>}

              <button type="submit" className="btn-verify-code" disabled={isVerifying}>
                {isVerifying ? 'Verifying...' : 'Verify code'}
              </button>
            </form>
          </div>

          <div className="verify-footer">
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
            <button type="button" className="verify-back-btn" onClick={onBack}>
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyCode;
