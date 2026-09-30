import React, { useState } from 'react';
import './ResetPassword.css';
import { resetPassword } from './api';

const ResetPassword = ({
  email,
  otp,
  onBackToVerify,
  onSuccess,
}) => {
  // بيانات كلمة المرور الجديدة
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // حالات الخطأ والتحميل
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    // التحقق من وجود كلمة المرور
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // التحقق من تطابق كلمتي المرور
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // التأكد من وجود البيانات القادمة من صفحة التحقق
    if (!email || !otp) {
      newErrors.general =
        'Reset session is missing. Please verify the code again.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      // إرسال بيانات إعادة تعيين كلمة المرور للـBackend
      await resetPassword({
        email,
        otp,
        password,
        password_confirmation: confirmPassword,
      });

      // الانتقال لشاشة النجاح بعد نجاح الـBackend فقط
      if (typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch (error) {
      setErrors({
        general:
          error.message ||
          'Unable to reset your password. Please try again.',
        password: error.errors?.password?.[0] || '',
        confirmPassword:
          error.errors?.password_confirmation?.[0] || '',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reset-password-wrapper">
      <div className="reset-password-card">

        {/* الشريط الجانبي */}
        <div className="reset-sidebar">
          <div>
            <div className="reset-brand">
              <span className="white">Skill</span>
              <span className="blue">Span</span>
            </div>

            <div className="reset-sidebar-content">
              <h2>Start Your Career Journey</h2>

              <p>
                From education to your first opportunity in clear,
                verified steps
              </p>

              <ul className="reset-features">
                <li>
                  <span className="reset-feature-icon">
                    <img src="/image/icon-readiness.png" alt="Readiness" />
                  </span>
                  <span>Assess your real readiness</span>
                </li>

                <li>
                  <span className="reset-feature-icon">
                    <img src="/image/icon-roadmap.png" alt="Roadmap" />
                  </span>
                  <span>A roadmap built for you</span>
                </li>

                <li>
                  <span className="reset-feature-icon">
                    <img src="/image/icon-projects.png" alt="Projects" />
                  </span>
                  <span>Real projects from companies</span>
                </li>

                <li>
                  <span className="reset-feature-icon">
                    <img src="/image/icon-record.png" alt="Record" />
                  </span>
                  <span>A verified professional record</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* القسم الخاص بتغيير كلمة المرور */}
        <div className="reset-form-column">
          <div className="reset-form-inner">
            <div className="reset-icon" aria-hidden="true" />

            <h1 className="reset-heading">Reset Your Password</h1>

            <p className="reset-subtext">Enter your new password below.</p>

            {/* رسالة الخطأ العامة */}
            {errors.general && (
              <div className="reset-error">
                <span className="reset-error-icon">!</span>
                <span>{errors.general}</span>
              </div>
            )}

            <form className="reset-form" onSubmit={handleSubmit} noValidate>

              {/* كلمة المرور الجديدة - the design shows no visible label here */}
              <div className="reset-input-group">
                <label htmlFor="reset-new-password" className="reset-sr-only">New Password</label>

                <div className="reset-password-field">
                  <input
                    id="reset-new-password"
                    type={showPassword ? 'text' : 'password'}
                    className={
                      errors.password
                        ? 'reset-input reset-input-error'
                        : 'reset-input'
                    }
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((prev) => ({
                        ...prev,
                        password: '',
                        general: '',
                      }));
                    }}
                    autoComplete="new-password"
                  />
                <button
                  type="button"
                  className="reset-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
                </div>

                {errors.password && (
                  <span className="reset-error-text">
                    {errors.password}
                  </span>
                )}
              </div>

              {/* تأكيد كلمة المرور */}
              <div className="reset-input-group">
                <label htmlFor="reset-confirm-password">Confirm New Password</label>

                <div className="reset-password-field">
                  <input
                    id="reset-confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    className={
                      errors.confirmPassword
                        ? 'reset-input reset-input-error'
                        : 'reset-input'
                    }
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrors((prev) => ({
                        ...prev,
                        confirmPassword: '',
                        general: '',
                      }));
                    }}
                    autoComplete="new-password"
                  />
                <button
                  type="button"
                  className="reset-toggle-btn"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
                </div>

                {errors.confirmPassword && (
                  <span className="reset-error-text">
                    {errors.confirmPassword}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="reset-submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Resetting...'
                  : 'Reset Password'}
              </button>
            </form>

            <button
              type="button"
              className="reset-back-button"
              onClick={onBackToVerify}
            >
              ← Back to verification code
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;