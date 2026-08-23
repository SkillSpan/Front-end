import React, { useEffect, useRef, useState } from 'react';
import './CompanyForgotPassword.css';
import { forgotPassword, resendForgotPassword, resetPassword, verifyForgotPasswordOtp } from './api';

const ShieldIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2.5l7.5 3v5.2c0 4.8-3.2 9.1-7.5 10.3-4.3-1.2-7.5-5.5-7.5-10.3V5.5l7.5-3z"
      stroke="url(#cfpShieldGradient)"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M8.5 12.3l2.3 2.3 4.5-4.8" stroke="url(#cfpShieldGradient)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="cfpShieldGradient" x1="4" y1="2" x2="20" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8b5cf6" />
        <stop offset="1" stopColor="#38bdf8" />
      </linearGradient>
    </defs>
  </svg>
);

// Gradient outline envelope, used on the "Verify Your Identity" screen.
const MailGradientIcon = () => (
  <svg width="46" height="46" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4 6.5C4 5.67 4.67 5 5.5 5h13c.83 0 1.5.67 1.5 1.5v11c0 .83-.67 1.5-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-11z"
      stroke="url(#cfpMailGradient)"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M4.5 6.2l6.6 5.7c.53.46 1.3.46 1.83 0l6.6-5.7"
      stroke="url(#cfpMailGradient)"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="cfpMailGradient" x1="4" y1="5" x2="20" y2="18" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8b5cf6" />
        <stop offset="1" stopColor="#38bdf8" />
      </linearGradient>
    </defs>
  </svg>
);

// Masks an email address for display, e.g. ahmad@example.com -> a***d@example.com
function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0] || ''}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

const Sidebar = () => (
  <div className="cfp-sidebar">
    <div>
      <div className="cfp-brand">
        <span className="white">Skill</span><span className="blue">Span</span>
      </div>
      <div className="cfp-sidebar-content">
        <h2>Welcome Back!</h2>
        <p>Log in to your company account to continue your journey.</p>
        <ul className="cfp-features">
          <li>
            <strong>Access top talent</strong>
            <span>Connect with skilled graduates and future leaders.</span>
          </li>
          <li>
            <strong>Post real projects</strong>
            <span>Share your projects and get quality work.</span>
          </li>
          <li>
            <strong>Track progress</strong>
            <span>Monitor projects and evaluate performance.</span>
          </li>
        </ul>
      </div>
    </div>
    <div className="cfp-security">
      <ShieldIcon />
      <div>
        <p className="cfp-security-title">Your information is secure</p>
        <p className="cfp-security-desc">We protect your data and never share it with anyone.</p>
      </div>
    </div>
  </div>
);

// Small helper: counts down to a given ISO timestamp (resend_available_at) and
// returns the remaining whole seconds (0 once it has passed / is missing).
function useCountdown(targetIso) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!targetIso) {
      setSecondsLeft(0);
      return undefined;
    }
    const target = new Date(targetIso).getTime();
    const tick = () => {
      const diff = Math.ceil((target - Date.now()) / 1000);
      setSecondsLeft(diff > 0 ? diff : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  return secondsLeft;
}

const CompanyForgotPassword = ({ onBackToLogin }) => {
  // request -> checkEmail -> verify -> reset -> success
  const [stage, setStage] = useState('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendAvailableAt, setResendAvailableAt] = useState(null);
  const otpRefs = useRef([]);

  const secondsLeft = useCountdown(resendAvailableAt);

  // ---- Stage 1: request the reset code -----------------------------------
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrors({ email: 'Email address is required' });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    try {
      const res = await forgotPassword(email.trim());
      setResendAvailableAt(res?.data?.resend_available_at || null);
      setIsSubmitting(false);
      setStage('checkEmail');
    } catch (err) {
      setIsSubmitting(false);
      setErrors({ email: err.message || 'Unable to send the reset code. Please try again.' });
    }
  };

  // ---- Resend (used on both the "check email" and "verify" screens) -----
  const handleResend = async () => {
    if (secondsLeft > 0 || resending || isSubmitting) return;
    setResending(true);
    setErrors((prev) => ({ ...prev, otp: '' }));
    try {
      const res = await resendForgotPassword(email.trim());
      setResendAvailableAt(res?.data?.resend_available_at || null);
    } catch (err) {
      setErrors((prev) => ({ ...prev, otp: err.message || 'Unable to resend the code right now.' }));
    } finally {
      setResending(false);
    }
  };

  // ---- Stage 3: OTP entry -------------------------------------------------
  const handleOtpChange = (value, index) => {
    if (value && isNaN(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setErrors((prev) => ({ ...prev, otp: '' }));
    if (value && index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0 && otpRefs.current[index - 1]) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = pasted.split('');
    while (next.length < 6) next.push('');
    setOtp(next);
    const lastIndex = Math.min(pasted.length, 6) - 1;
    if (otpRefs.current[lastIndex]) otpRefs.current[lastIndex].focus();
  };

  // ---- Stage 3: OTP screen -------------------------------------------------
  // Never navigate to the password screen until Laravel validates the reset
  // OTP. Wrong / expired codes stay here and display the Backend error.
  const handleOtpContinue = async (e) => {
    e.preventDefault();
    const code = otp.join('');

    if (code.length !== 6) {
      setErrors({ otp: 'Please enter the complete 6-digit code' });
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await verifyForgotPasswordOtp(email.trim(), code);
      setStage('reset');
    } catch (err) {
      const backendOtpError =
        err.errors?.otp?.[0] ||
        err.errors?.code?.[0] ||
        err.message ||
        'The verification code is invalid or has expired.';

      setErrors({ otp: backendOtpError });
      setStage('verify');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Stage 4: reset password -------------------------------------------
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    const newErrors = {};

    if (code.length !== 6) {
      setErrors({ otp: 'Please enter the complete 6-digit code' });
      setStage('verify');
      return;
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      // IMPORTANT: Laravel remains the source of truth for the reset OTP.
      // The success screen is shown only after /reset-password accepts both
      // the OTP and the new password. No email here — the OTP alone is
      // enough for Backend to find the matching reset token.
      await resetPassword({
        otp: code,
        password,
        password_confirmation: confirmPassword,
      });
      setStage('success');
    } catch (err) {
      const otpMessage = err.errors?.otp?.[0] || '';
      const hasOtpError = Boolean(err.errors?.otp) || /otp|code|expired|invalid/i.test(err.message || '');

      if (hasOtpError) {
        setErrors({
          otp: otpMessage || err.message || 'The reset code is invalid or has expired.',
        });
        // Return to the dedicated OTP page so the user can correct the code.
        setStage('verify');
      } else {
        setErrors({
          password: err.errors?.password?.[0] || err.message || 'Unable to reset your password. Please try again.',
          confirmPassword: err.errors?.password_confirmation?.[0] || '',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="cfp-wrapper">
      <div className="cfp-card">
        <Sidebar />

        <div className="cfp-form-col">
          <div className="cfp-topbar" />

          <div className="cfp-form-inner">
            {/* ---------------- Stage 1: request email ---------------- */}
            {stage === 'request' && (
              <>
                <h1 className="cfp-heading">Reset Your Password</h1>
                <p className="cfp-subtext">
                  Please enter the email address associated with your account, and we will send you a password reset code.
                </p>

                <form onSubmit={handleRequestSubmit} noValidate>
                  <div className="cfp-input-group">
                    <input
                      type="email"
                      className={`cfp-input ${errors.email ? 'cfp-input-error' : ''}`}
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors({});
                      }}
                      autoComplete="email"
                    />
                    {errors.email && <span className="cfp-error-text">{errors.email}</span>}
                  </div>

                  <button type="submit" className="cfp-submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Reset Code'}
                  </button>
                </form>

                {onBackToLogin && (
                  <p className="cfp-switch-text">
                    <span className="cfp-link" onClick={onBackToLogin}>← Back to Log in</span>
                  </p>
                )}
              </>
            )}

            {/* ---------------- Stage 2: check your email ---------------- */}
            {stage === 'checkEmail' && (
              <div className="cfp-center-col">
                <div className="cfp-icon-badge">
                  <img src="/image/7.png" alt="Check your email" />
                </div>

                <h1 className="cfp-heading">Check your email</h1>
                <p className="cfp-subtext">
                  A reset code has been sent to your email address <strong>{email}</strong>.
                  Please check your inbox (and spam folder) to reset your password. The code will expire in 15 minutes.
                </p>

                <button type="button" className="cfp-submit-btn" onClick={() => setStage('verify')}>
                  Continue to Verify
                </button>

                <p className="cfp-switch-text">
                  Didn't get an email?{' '}
                  <span className={`cfp-link ${secondsLeft > 0 ? 'cfp-link-disabled' : ''}`} onClick={handleResend}>
                    {resending ? 'Resending...' : secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend code'}
                  </span>
                </p>
              </div>
            )}

            {/* ---------------- Stage 3: verify identity (OTP only) ---------------- */}
            {stage === 'verify' && (
              <div className="cfp-center-col">
                <div className="cfp-icon-badge cfp-icon-badge-gradient">
                  <MailGradientIcon />
                </div>

                <h1 className="cfp-heading">Verify Your Identity</h1>
                <p className="cfp-subtext">
                  We've sent a 6-digit verification code to <strong>{maskEmail(email)}</strong>.
                  Please enter it below to proceed.
                </p>

                <form onSubmit={handleOtpContinue} noValidate>
                  <div className="cfp-otp-row" onPaste={handleOtpPaste}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        type="text"
                        inputMode="numeric"
                        maxLength="1"
                        value={digit}
                        ref={(el) => (otpRefs.current[index] = el)}
                        onChange={(e) => handleOtpChange(e.target.value, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        className={`cfp-otp-box ${errors.otp ? 'cfp-input-error' : ''}`}
                        aria-label={`Verification code digit ${index + 1}`}
                      />
                    ))}
                  </div>
                  {errors.otp && <span className="cfp-error-text cfp-center">{errors.otp}</span>}

                  <button type="submit" className="cfp-submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? 'Verifying...' : 'Verify code'}
                  </button>
                </form>

                <p className="cfp-switch-text">
                  Didn't get a code?{' '}
                  <span className={`cfp-link ${secondsLeft > 0 || resending ? 'cfp-link-disabled' : ''}`} onClick={handleResend}>
                    {resending ? 'Resending...' : secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend code'}
                  </span>
                </p>
              </div>
            )}

            {/* ---------------- Stage 4: reset password only ---------------- */}
            {stage === 'reset' && (
              <>
                <h1 className="cfp-heading">Reset Your Password</h1>
                <p className="cfp-subtext">Enter your new password below.</p>

                <form onSubmit={handleResetSubmit} noValidate>
                  <div className="cfp-input-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      className={`cfp-input ${errors.password ? 'cfp-input-error' : ''}`}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors((prev) => ({ ...prev, password: '' }));
                      }}
                      autoComplete="new-password"
                    />
                    {errors.password && <span className="cfp-error-text">{errors.password}</span>}
                  </div>

                  <div className="cfp-input-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      className={`cfp-input ${errors.confirmPassword ? 'cfp-input-error' : ''}`}
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                      }}
                      autoComplete="new-password"
                    />
                    {errors.confirmPassword && <span className="cfp-error-text">{errors.confirmPassword}</span>}
                  </div>

                  <button type="submit" className="cfp-submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>

                <p className="cfp-switch-text">
                  <span
                    className="cfp-link"
                    onClick={() => {
                      setErrors({});
                      setStage('verify');
                    }}
                  >
                    ← Back to verification code
                  </span>
                </p>
              </>
            )}

            {/* ---------------- Stage 5: success ---------------- */}
            {stage === 'success' && (
              <div className="cfp-center-col">
                <div className="cfp-success-icon-wrap">
                  <img src="/image/6.png" alt="Password reset successful" />
                </div>
                <h1 className="cfp-heading">Password Reset Successful!</h1>
                <p className="cfp-subtext">
                  Your password has been updated successfully. You can now login with your new password.
                </p>
                <button type="button" className="cfp-submit-btn" onClick={onBackToLogin}>
                  Go to log in
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyForgotPassword;
