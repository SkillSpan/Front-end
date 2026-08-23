import React, { useState, useRef, useEffect } from 'react';
import './VerifyCode.css';
import { verifyForgotPasswordOtp, resendForgotPasswordOtp } from './api';

const VerifyCode = ({ email, onBack, onSuccess }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => Math.max(t - 1, 0)), 1000);
    return () => clearInterval(id);
  }, [timer]);

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

    if (fullCode.length < 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');
    try {
      await verifyForgotPasswordOtp(email, fullCode);
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
    if (timer > 0 || isResending) return;
    setIsResending(true);
    setError('');
    try {
      await resendForgotPasswordOtp(email);
      setTimer(60);
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
          <div className="verify-top-bar">
            <span className="resend-text">
              {timer > 0 ? (
                `Resend in ${timer}s`
              ) : (
                <button
                  type="button"
                  className="link-action"
                  onClick={handleResend}
                  disabled={isResending}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {isResending ? 'Resending...' : 'Resend code'}
                </button>
              )}
            </span>
          </div>

          <div className="verify-content-box">
            <div className="verify-mail-icon-box">
              <img src="/image/7.png" alt="Email icon" className="verify-mail-img" />
            </div>

            <h1 className="verify-heading">Verify Your Identity</h1>
            <p className="verify-subtitle">
              We've sent a 6-digit verification code to <strong>{email || 'your email'}</strong>. Please enter it below to proceed.
            </p>

            <form onSubmit={handleVerify}>
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

              {error && <span className="error-text">{error}</span>}

              <button type="submit" className="btn-verify-code" disabled={isVerifying}>
                {isVerifying ? 'Verifying...' : 'Verify code'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyCode;