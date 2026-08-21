import React, { useState, useRef, useEffect } from 'react';
import './OtpVerification.css';
import { verifyOtp, resendOtp } from './api';

const OtpVerification = ({ userEmail,onVerifySuccess,onBack,onContinueToLogin, }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(582); // 09:42 in seconds
  const [resendTimer, setResendTimer] = useState(60); // 60s for resend
  const [isResendState, setIsResendState] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    let timer = null;
    if (timeLeft > 0 || (isResendState && resendTimer > 0)) {
      timer = setInterval(() => {
        if (timeLeft > 0) setTimeLeft((prev) => prev - 1);
        if (isResendState && resendTimer > 0) setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft, resendTimer, isResendState]);

  // Format time to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle Input Change
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

  // Handle Backspace
  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Handle Resend Click
  const handleResendClick = async () => {
  if (!userEmail) {
    setError('Email address is missing. Please go back and try again.');
    return;
  }

  try {
    setError('');

    await resendOtp(userEmail);

    setIsResendState(true);
    setResendTimer(60);
    setTimeLeft(582);
    setOtp(['', '', '', '', '', '']);

    inputRefs.current[0]?.focus();
  } catch (error) {
    setError(
      error.message || 'Unable to resend the verification code.'
    );
  }
};

  // Handle Verify Submit
  const handleVerify = (e) => {
    e.preventDefault();
    const enteredCode = otp.join('');

    if (enteredCode.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setError('');
    setIsVerified(true); // إظهار شاشة النجاح فوراً داخل المكون

    // تأجيل الـ Callback قليلاً لضمان ظهور شاشة النجاح وعدم تقاطعها مع توجيه الأب الفوري
    if (typeof onVerifySuccess === 'function') {
      // إذا أردتِ إرسال الكود للخارج دون تغيير الصفحة الفوري، اتركيها هكذا
      // أو استدعيها بحذر إذا كانت لا تعيد توجيه الصفحة فوراً
    }
  };

  // شاشة النجاح (Email Verified)
  if (isVerified) {
    return (
      <div className="register-wrapper">
        <div className="register-card">
          {/* Left Sidebar */}
          <div className="sidebar-left">
            <div className="sidebar-brand">SkillSpan</div>
            <div className="sidebar-content">
              <h2>Start Your<br />Career Journey</h2>
              <p className="sidebar-desc">
                From education to your first opportunity in clear, verified steps
              </p>

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

          {/* Right Success Container */}
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

  // شاشة إدخال رمز التحقق العادية
  return (
    <div className="register-wrapper">
      <div className="register-card">
        {/* Left Sidebar */}
        <div className="sidebar-left">
          <div className="sidebar-brand">SkillSpan</div>
          <div className="sidebar-content">
            <h2>Start Your<br />Career Journey</h2>
            <p className="sidebar-desc">
              From education to your first opportunity in clear, verified steps
            </p>

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

        {/* Right OTP Container */}
        <div className="form-right otp-container">
          <div className="email-icon-box">
            <svg className="email-svg-icon" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>

          <span className="sub-tag">EMAIL VERIFICATION</span>
          
          <h1 className="otp-heading">
            {isResendState ? 'We sent you a new code!' : 'Check your inbox'}
          </h1>

          <form onSubmit={handleVerify} className="otp-form-content">
            {/* 6 OTP Input Boxes */}
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

            {/* Timer info */}
            <div className="timer-info">
              <span className="timer-dot"></span>
              <span>Code expires in <strong className="timer-highlight">{formatTime(timeLeft)}</strong></span>
            </div>

            {/* Verify Button */}
            <button type="submit" className="btn-verify-code">
              Verify code
            </button>

            {/* Error Message */}
            {error && <div className="elegant-error-msg">{error}</div>}

            {/* Resend States */}
            {!isResendState ? (
              <div className="otp-footer-links">
                <p>
                  Didn't get the code?{' '}
                  <span className="resend-action" onClick={handleResendClick} style={{ cursor: 'pointer', color: '#0056b3', fontWeight: 'bold' }}>
                    Resend in 60s
                  </span>
                </p>
              </div>
            ) : (
              <div className="resend-info-box">
                <div className="resend-icon-text">
                  <svg className="repeat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.68-5.68" />
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
            )}

            {/* Edit email link */}
            <div className="otp-footer-links" style={{ marginTop: '15px' }}>
              <button type="button" className="edit-email-btn" onClick={onBack}>
                Edit email address
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OtpVerification;