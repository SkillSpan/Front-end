import { useState, useRef } from 'react';
import './VerifyCode.css';
import { resetPassword, resendForgotPassword } from './api';

const VerifyCode = ({ email, onBack, onSuccess }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [timer, setTimer] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);

  const handleChange = (value, index) => {
    if (isNaN(value)) return; // السماح بالأرقام فقط

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setErrors((prev) => ({ ...prev, code: '' }));

    // الانتقال تلقائياً للمربع التالي
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // الرجوع للمربع السابق عند الضغط على Backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      if (inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handleResend = async () => {
    if (isResending || timer > 0) return;
    setIsResending(true);
    try {
      await resendForgotPassword(email);
      setTimer(60);
    } catch (err) {
      setErrors((prev) => ({ ...prev, code: err.message || 'Unable to resend the code.' }));
    } finally {
      setIsResending(false);
    }
  };

  // This is the fix for the flow that used to reach a success screen
  // without the user ever entering a new password: the code AND the new
  // password are collected together here, and the success screen only
  // shows after POST /api/auth/reset-password actually succeeds.
  const handleVerify = async (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    const newErrors = {};

    if (fullCode.length < 6) {
      newErrors.code = 'Please enter the complete 6-digit code';
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
      await resetPassword({
        email,
        otp: fullCode,
        password,
        password_confirmation: confirmPassword,
      });
      setIsSubmitting(false);
      if (onSuccess) onSuccess(fullCode);
    } catch (err) {
      setIsSubmitting(false);
      setErrors({ code: err.message || 'Unable to reset your password. Please try again.' });
    }
  };

  return (
    <div className="verify-wrapper">
      <div className="verify-card">
        {/* الشريط الجانبي الثابت */}
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

        {/* القسم الأيمن لإدخال الكود */}
        <div className="form-right-verify">
          <div className="verify-top-bar">
            <span className="resend-text">
              {timer > 0 ? (
                `Resend in ${timer}s`
              ) : (
                <span onClick={handleResend} style={{ cursor: 'pointer' }}>
                  {isResending ? 'Resending...' : 'Resend code'}
                </span>
              )}
            </span>
          </div>

          <div className="verify-content-box">
            {/* أيقونة الرسالة العلوية */}
            <div className="verify-mail-icon-box">
              <img src="/image/7.png" alt="Email icon" className="verify-mail-img" />
            </div>

            <h1 className="verify-heading">Reset Your Password</h1>
            <p className="verify-subtitle">
              We've sent a 6-digit verification code to <strong>{email || 'your email'}</strong>. Enter it below along with your new password.
            </p>

            <form onSubmit={handleVerify}>
              {/* مربعات إدخال الـ 6 أرقام */}
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
              {errors.code && <div className="error-text" style={{ textAlign: 'center', marginBottom: '10px' }}>{errors.code}</div>}

              <div className="input-group" style={{ textAlign: 'left', marginBottom: '12px' }}>
                <label>New Password</label>
                <input
                  type="password"
                  className={`forgot-input ${errors.password ? 'input-error' : ''}`}
                  placeholder="New password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                />
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <div className="input-group" style={{ textAlign: 'left', marginBottom: '12px' }}>
                <label>Confirm New Password</label>
                <input
                  type="password"
                  className={`forgot-input ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }}
                />
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>

              <button type="submit" className="btn-verify-code" disabled={isSubmitting}>
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </button>

              {onBack && (
                <div style={{ textAlign: 'center', marginTop: '14px' }}>
                  <span onClick={onBack} className="link-action" style={{ cursor: 'pointer' }}>
                    ← Edit email address
                  </span>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyCode;
