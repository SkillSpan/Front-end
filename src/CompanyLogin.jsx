import React, { useState } from 'react';
import './CompanyLogin.css';
import { loginOrganization, saveSession } from './api';

const ShieldIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2.5l7.5 3v5.2c0 4.8-3.2 9.1-7.5 10.3-4.3-1.2-7.5-5.5-7.5-10.3V5.5l7.5-3z"
      stroke="url(#shieldGradient)"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M8.5 12.3l2.3 2.3 4.5-4.8" stroke="url(#shieldGradient)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="shieldGradient" x1="4" y1="2" x2="20" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8b5cf6" />
        <stop offset="1" stopColor="#38bdf8" />
      </linearGradient>
    </defs>
  </svg>
);

const CompanyLogin = ({ onBack, onSwitchToRegister, onSwitchToStudentLogin, onForgotPassword, onLoginSuccess }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '', general: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    try {
      const res = await loginOrganization(formData.email.trim(), formData.password);
      const { user, organizations, token } = res.data || {};

      // Persist the session in a same-site, path-scoped cookie (see
      // utils/cookies.js) instead of localStorage.
      saveSession({ token, user, organizations });

      setIsSubmitting(false);
      if (onLoginSuccess) onLoginSuccess({ user, organizations, token });
    } catch (err) {
      setIsSubmitting(false);
      // The API already returns tailored messages for a pending or
      // rejected organization, and for bad credentials — surface it as-is.
      setErrors({ general: err.message || 'Unable to log in right now. Please try again.' });
    }
  };

  return (
    <div className="cl-wrapper">
      <div className="cl-card">
        <div className="cl-sidebar">
          <div>
            {onBack && (
              <button className="cl-back-btn" onClick={onBack} type="button">← Back to Home</button>
            )}
            <div className="cl-brand">
              <span className="white">Skill</span><span className="blue">Span</span>
            </div>

            <div className="cl-sidebar-content">
              <h2>Welcome Back!</h2>
              <p>Log in to your company account to continue your journey.</p>

              <ul className="cl-features">
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

          <div className="cl-security">
            <ShieldIcon />
            <div>
              <p className="cl-security-title">Your information is secure</p>
              <p className="cl-security-desc">We protect your data and never share it with anyone.</p>
            </div>
          </div>
        </div>

        <div className="cl-form-col">
          <div className="cl-topbar" />

          <div className="cl-form-inner">
            <h1 className="cl-heading">Log in to your account</h1>
            <p className="cl-subtext">
              New here? <span className="cl-link" onClick={onSwitchToRegister}>Create a new account</span>
            </p>

            <div className="cl-google-wrap">
              <button type="button" className="cl-google-btn" onClick={() => alert('Google login is not connected yet.')}>
                <span className="cl-google-g">G</span> Google
              </button>
            </div>

            {errors.general && <div className="cl-error-alert">{errors.general}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="cl-input-group">
                <label>Email Address</label>
                <input
                  name="email"
                  type="email"
                  className={`cl-input ${errors.email ? 'cl-input-error' : ''}`}
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
                {errors.email && <span className="cl-error-text">{errors.email}</span>}
              </div>

              <div className="cl-input-group">
                <label>Enter your password</label>
                <input
                  name="password"
                  type="password"
                  className={`cl-input ${errors.password ? 'cl-input-error' : ''}`}
                  placeholder="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                {errors.password && <span className="cl-error-text">{errors.password}</span>}
              </div>

              <div className="cl-forgot-row">
                Forgot password? <span className="cl-link" onClick={onForgotPassword}>Reset password</span>
              </div>

              <button type="submit" className="cl-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Logging in...' : 'Log in'}
              </button>
            </form>

            {onSwitchToStudentLogin && (
              <p className="cl-switch-text">
                Not a company? <span className="cl-link" onClick={onSwitchToStudentLogin}>Log in as a student</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyLogin;
