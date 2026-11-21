import { useState } from 'react';
import './Login.css';
import './LoginRoles.css';
import { loginUser, loginOrganization, loginWithGoogle, saveSession } from '../../api';
import { GOOGLE_LOGIN_ENABLED } from '../../config';
import { isTermsRequiredError } from '../../utils/googleAuth';
import { useGoogleSignIn } from './useGoogleSignIn';

// One screen, two accounts.
//
// A student and a company log in with different endpoints
// (/auth/login vs /auth/login/organization) and land on different dashboards,
// so the role is part of the form rather than a separate page. /login opens on
// "student" and /company/login opens on "company" - both render this component,
// so old links and bookmarks keep working.
//
// Google sign-in is individual-only (there is no company Google flow on the
// backend), so that block is hidden in the company role.

const ROLES = {
  student: {
    id: 'student',
    label: 'Student',
    heading: <>Start Your<br />Career&nbsp;Journey</>,
    desc: 'From education to your first opportunity in clear, verified steps',
    features: [
      { icon: '/image/icon-readiness.png', text: 'Assess your real readiness' },
      { icon: '/image/icon-roadmap.png', text: 'A roadmap built for you' },
      { icon: '/image/icon-projects.png', text: 'Real projects from companies' },
      { icon: '/image/icon-record.png', text: 'A verified professional record' },
    ],
  },
  company: {
    id: 'company',
    label: 'Company',
    heading: <>Hire Verified<br />Talent</>,
    desc: 'Post real projects and follow every application in one place',
    features: [
      { icon: '/image/icon-readiness.png', text: 'Access top talent' },
      { icon: '/image/icon-projects.png', text: 'Post real projects' },
      { icon: '/image/icon-roadmap.png', text: 'Track progress as it happens' },
      { icon: '/image/icon-record.png', text: 'Decide on real evidence' },
    ],
  },
};

const Login = ({
  initialRole = 'student',
  onSwitchToRegister,
  onBack,
  onForgotPassword,
  onLoginSuccess,
  onNewGoogleUser,
}) => {
  const [role, setRole] = useState(ROLES[initialRole] ? initialRole : 'student');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Google Sign-In state
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const copy = ROLES[role];

  const handleRoleChange = (next) => {
    if (next === role) return;
    setRole(next);
    // "Invalid credentials" belongs to the account type that was selected.
    setErrors({});
  };

  const handleGoogleCredential = async (credential) => {
    setGoogleError('');
    setIsGoogleSubmitting(true);
    try {
      const res = await loginWithGoogle(credential, false, false);
      const { user, organizations, token } = res.data || res;
      saveSession({ token, user, organizations });
      setIsGoogleSubmitting(false);
      if (onLoginSuccess) onLoginSuccess({ user, organizations, token, role: 'student' });
    } catch (err) {
      setIsGoogleSubmitting(false);
      if (isTermsRequiredError(err)) {
        // No account yet for this Google identity - hand off to the
        // registration wizard instead of showing an error.
        if (onNewGoogleUser) onNewGoogleUser(credential);
        return;
      }
      setGoogleError(err.message || 'Google sign-in failed. Please try again.');
    }
  };

  const { wrapRef: googleWrapRef, overlayRef: googleOverlayRef, error: googleError, setError: setGoogleError } =
    useGoogleSignIn(handleGoogleCredential, GOOGLE_LOGIN_ENABLED);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear the error message as soon as the user starts typing
    setErrors({ ...errors, [e.target.name]: '', general: '' });
  };

  const validate = () => {
    const newErrors = {};

    // Validate the email address
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate the password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    return newErrors;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    try {
      // Company accounts go through the organization endpoint: it answers with
      // its own message for a pending or rejected organization, so its errors
      // must be surfaced as-is rather than replaced by a generic one.
      const res = role === 'company'
        ? await loginOrganization(formData.email.trim(), formData.password)
        : await loginUser(formData.email.trim(), formData.password);
      const { user, organizations, token } = res.data || res;

      saveSession({ token, user, organizations });

      setIsSubmitting(false);
      if (onLoginSuccess) onLoginSuccess({ user, organizations, token, role });
    } catch (err) {
      setIsSubmitting(false);
      // Surface Laravel's field-level validation errors (422) when present,
      // otherwise fall back to the general message (401/invalid creds/etc).
      if (err.errors && Object.keys(err.errors).length > 0) {
        const fieldErrors = {};
        Object.entries(err.errors).forEach(([field, messages]) => {
          fieldErrors[field] = Array.isArray(messages) ? messages[0] : messages;
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: err.message || 'Invalid email or password. Please try again.' });
      }
    }
  };

  return (
    <div className="login-wrapper" data-role={role}>
      <div className="login-card" data-role={role}>
        {/* Shared sidebar - copy and accent follow the selected role */}
        <div className="sidebar-left">
          <div className="sidebar-brand">
            <span className="brand-logo" aria-hidden="true">
              <img src="/image/logo.png" alt="" />
            </span>
            <span>SkillSpan</span>
          </div>
          <div className="sidebar-content">
            <h2>{copy.heading}</h2>
            <p className="sidebar-desc">{copy.desc}</p>

            <ul className="features-list">
              {copy.features.map((feature) => (
                <li key={feature.text}>
                  <span className="icon"><img src={feature.icon} alt="" /></span>
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="form-right">
          {onBack && (
            <button className="back-to-home-btn" onClick={onBack}>← Back to Home</button>
          )}

          <div className="login-icon-box" aria-hidden="true" />

          <div className="role-switch" role="tablist" aria-label="Account type">
            {Object.values(ROLES).map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={role === option.id}
                className={`role-switch-btn${role === option.id ? ' is-active' : ''}`}
                onClick={() => handleRoleChange(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <h1 className="login-heading">Log in to your account</h1>
          <p className="new-here-text">
            New here? <span onClick={onSwitchToRegister} className="link-action">Create a new account</span>
          </p>

          <form className="login-form" onSubmit={handleLogin} noValidate>
            {errors.general && <div className="error-alert">{errors.general}</div>}

            <div className="input-group">
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                name="email"
                type="email"
                className={`login-input ${errors.email ? 'input-error' : ''}`}
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="login-password">Enter your password</label>
              <div className="password-field">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`login-input ${errors.password ? 'input-error' : ''}`}
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-password-btn"
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
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="forgot-container">
              Forgot password?{' '}
              <span
                className="link-action reset-link"
                onClick={() => onForgotPassword && onForgotPassword(role)}
              >
                Reset password
              </span>
            </div>

            {role === 'student' && GOOGLE_LOGIN_ENABLED && (
              <div ref={googleWrapRef} className="google-wrap">
                <button type="button" className="btn-google" tabIndex={-1} aria-hidden="true">
                  <svg className="google-logo" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  Continue with Google
                </button>
                <div
                  ref={googleOverlayRef}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    overflow: 'hidden',
                    pointerEvents: isGoogleSubmitting ? 'none' : 'auto',
                  }}
                />
                {isGoogleSubmitting && (
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '6px', textAlign: 'center' }}>Signing in...</div>
                )}
                {googleError && (
                  <div className="error-text" style={{ marginTop: '6px', textAlign: 'center' }}>{googleError}</div>
                )}
              </div>
            )}

            <button type="submit" className="btn-login" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Log in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
