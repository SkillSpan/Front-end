import { useState } from 'react';
import './CompanyLogin.css';
import { loginOrganization, saveSession } from './api';
<<<<<<< HEAD

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
=======
import { ShieldCheckIcon, EyeIcon, EyeOffIcon } from './CompanyIcons';
>>>>>>> feature/hide-scrollbars

const CompanyLogin = ({ onBack, onSwitchToRegister, onSwitchToStudentLogin, onForgotPassword, onLoginSuccess }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
<<<<<<< HEAD
=======
  const [showPassword, setShowPassword] = useState(false);
>>>>>>> feature/hide-scrollbars

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
<<<<<<< HEAD
            {onBack && (
              <button className="cl-back-btn" onClick={onBack} type="button">← Back to Home</button>
            )}
            <div className="cl-brand">
              <span className="white">Skill</span><span className="blue">Span</span>
            </div>
=======
            <div className="cl-brand" aria-label="SkillSpan brand name">
              <span className="cl-brand-wordmark"><span className="brand-skill">Skill</span><span className="brand-span">Span</span></span>
            </div>
            {onBack && (
              <button className="cl-back-btn" onClick={onBack} type="button">← Back to Home</button>
            )}
>>>>>>> feature/hide-scrollbars

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
<<<<<<< HEAD
            <ShieldIcon />
=======
            <ShieldCheckIcon size={30} />
>>>>>>> feature/hide-scrollbars
            <div>
              <p className="cl-security-title">Your information is secure</p>
              <p className="cl-security-desc">We protect your data and never share it with anyone.</p>
            </div>
          </div>
        </div>

        <div className="cl-form-col">
<<<<<<< HEAD
          <div className="cl-topbar" />

=======
>>>>>>> feature/hide-scrollbars
          <div className="cl-form-inner">
            <h1 className="cl-heading">Log in to your account</h1>
            <p className="cl-subtext">
              New here? <span className="cl-link" onClick={onSwitchToRegister}>Create a new account</span>
            </p>

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
<<<<<<< HEAD
                <input
                  name="password"
                  type="password"
                  className={`cl-input ${errors.password ? 'cl-input-error' : ''}`}
                  placeholder="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
=======
                <div className="cl-pass-wrap">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`cl-input ${errors.password ? 'cl-input-error' : ''}`}
                    placeholder="password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />
                  <span className="cl-pass-toggle" onClick={() => setShowPassword((v) => !v)}>
                    {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                  </span>
                </div>
>>>>>>> feature/hide-scrollbars
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
