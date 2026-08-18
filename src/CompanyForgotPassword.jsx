import React, { useRef, useState } from 'react';
import './CompanyForgotPassword.css';
import { forgotPassword, resendForgotPassword, resetPassword } from './api';

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

const CompanyForgotPassword = ({ onBackToLogin }) => {
  const [stage, setStage] = useState('request'); // request -> reset -> success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const otpRefs = useRef([]);

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
      await forgotPassword(email.trim());
      setIsSubmitting(false);
      setStage('reset');
    } catch (err) {
      setIsSubmitting(false);
      setErrors({ email: err.message || 'Unable to send the reset code. Please try again.' });
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendForgotPassword(email.trim());
    } catch (err) {
      setErrors((prev) => ({ ...prev, otp: err.message }));
    } finally {
      setResending(false);
    }
  };

  const handleOtpChange = (value, index) => {
    if (value && isNaN(value)) return;
    const next = [...otp];
    next[index] = value;
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

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    const newErrors = {};
    if (code.length < 6) newErrors.otp = 'Please enter the complete 6-digit code';
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (confirmPassword !== password) newErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    try {
      await resetPassword({
        email: email.trim(),
        otp: code,
        password,
        password_confirmation: confirmPassword,
      });
      setIsSubmitting(false);
      setStage('success');
    } catch (err) {
      setIsSubmitting(false);
      setErrors({ otp: err.message || 'Unable to reset your password. Please try again.' });
    }
  };

  return (
    <div className="cfp-wrapper">
      <div className="cfp-card">
        <Sidebar />

        <div className="cfp-form-col">
          <div className="cfp-topbar" />

          <div className="cfp-form-inner">
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
                    />
                    {errors.email && <span className="cfp-error-text">{errors.email}</span>}
                  </div>

                  <button type="submit" className="cfp-submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>

                {onBackToLogin && (
                  <p className="cfp-switch-text">
                    <span className="cfp-link" onClick={onBackToLogin}>← Back to Log in</span>
                  </p>
                )}
              </>
            )}

            {stage === 'reset' && (
              <>
                <h1 className="cfp-heading">Enter Reset Code</h1>
                <p className="cfp-subtext">
                  We've sent a 6-digit code to <strong>{email}</strong>. Enter it below along with your new password.
                </p>

                <form onSubmit={handleResetSubmit} noValidate>
                  <div className="cfp-otp-row">
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
                        className="cfp-otp-box"
                      />
                    ))}
                  </div>
                  {errors.otp && <span className="cfp-error-text cfp-center">{errors.otp}</span>}

                  <div className="cfp-input-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      className={`cfp-input ${errors.password ? 'cfp-input-error' : ''}`}
                      placeholder="New password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors((prev) => ({ ...prev, password: '' }));
                      }}
                    />
                    {errors.password && <span className="cfp-error-text">{errors.password}</span>}
                  </div>

                  <div className="cfp-input-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      className={`cfp-input ${errors.confirmPassword ? 'cfp-input-error' : ''}`}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                      }}
                    />
                    {errors.confirmPassword && <span className="cfp-error-text">{errors.confirmPassword}</span>}
                  </div>

                  <button type="submit" className="cfp-submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>

                <p className="cfp-switch-text">
                  Didn't get a code?{' '}
                  <span className="cfp-link" onClick={handleResend}>
                    {resending ? 'Resending...' : 'Resend code'}
                  </span>
                </p>
              </>
            )}

            {stage === 'success' && (
              <div className="cfp-success">
                <div className="cfp-success-icon">✓</div>
                <h1 className="cfp-heading">Password Reset Successful!</h1>
                <p className="cfp-subtext">
                  Your password has been updated successfully. You can now log in with your new password.
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
