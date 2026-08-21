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
                    <img src="/image/2.png" alt="Readiness" />
                  </span>
                  <span>Assess your real readiness</span>
                </li>

                <li>
                  <span className="reset-feature-icon">
                    <img src="/image/3.png" alt="Roadmap" />
                  </span>
                  <span>A roadmap built for you</span>
                </li>

                <li>
                  <span className="reset-feature-icon">
                    <img src="/image/4.png" alt="Projects" />
                  </span>
                  <span>Real projects from companies</span>
                </li>

                <li>
                  <span className="reset-feature-icon">
                    <img src="/image/5.png" alt="Record" />
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

            <h1 className="reset-heading">
              Reset Your Password
            </h1>

            <p className="reset-subtext">
              Enter your new password below.
            </p>

            {/* رسالة الخطأ العامة */}
            {errors.general && (
              <div className="reset-error">
                <span className="reset-error-icon">!</span>
                <span>{errors.general}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* كلمة المرور الجديدة */}
              <div className="reset-input-group">
                <label>New Password</label>

                <input
                  type="password"
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

                {errors.password && (
                  <span className="reset-error-text">
                    {errors.password}
                  </span>
                )}
              </div>

              {/* تأكيد كلمة المرور */}
              <div className="reset-input-group">
                <label>Confirm New Password</label>

                <input
                  type="password"
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