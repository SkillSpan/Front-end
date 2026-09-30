import { useState } from 'react';
import './Login.css';
import { loginUser, loginWithGoogle, saveSession } from './api';
import { GOOGLE_LOGIN_ENABLED } from './config';
import { isTermsRequiredError } from './utils/googleAuth';
import { useGoogleSignIn } from './useGoogleSignIn';

// --- Google Sign-In (individual accounts) -----------------------------
//
// Backend contract (google_login_frontend_guide.pdf): POST
// /api/auth/login/google with { credential, terms_accepted, privacy_accepted }.
//
// Flow: click Google -> get credential -> try loginWithGoogle(credential).
//   - Existing account: succeeds immediately -> normal login -> landing page.
//   - No account yet: fails in a way that looks like "new account" (see
//     utils/googleAuth.js) -> we hand the credential off to
//     onNewGoogleUser, which sends the user into the registration wizard
//     starting at the academic-status step (RegisterStep2). They finish
//     that + the existing Terms/Privacy step (RegisterStep3 already has
//     it - no need to collect it again here), and THAT is what actually
//     creates the account (see RegisterStep3.jsx).

const Login = ({ onSwitchToRegister, onBack, onForgotPassword, onLoginSuccess, onNewGoogleUser }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Google Sign-In state
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const handleGoogleCredential = async (credential) => {
    setGoogleError('');
    setIsGoogleSubmitting(true);
    try {
      const res = await loginWithGoogle(credential, false, false);
      const { user, organizations, token } = res.data || res;
      saveSession({ token, user, organizations });
      setIsGoogleSubmitting(false);
      if (onLoginSuccess) onLoginSuccess({ user, organizations, token });
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
    // إزالة رسالة الخطأ فور بدء الكتابة
    setErrors({ ...errors, [e.target.name]: '', general: '' });
  };

  const validate = () => {
    const newErrors = {};

    // التحقق من البريد الإلكتروني
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // التحقق من كلمة المرور
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
      const res = await loginUser(formData.email.trim(), formData.password);
      const { user, organizations, token } = res.data || res;

      saveSession({ token, user, organizations });

      setIsSubmitting(false);
      if (onLoginSuccess) onLoginSuccess({ user, organizations, token });
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
    <div className="login-wrapper">
      <div className="login-card">
        {/* الشريط الجانبي الموحد */}
        <div className="sidebar-left">
          <div className="sidebar-brand">SkillSpan</div>
          <div className="sidebar-content">
            <h2>Start Your<br />Career&nbsp;Journey</h2>
            <p className="sidebar-desc">
              From education to your first opportunity in clear, verified steps
            </p>

            <ul className="features-list">
              <li>
                <span className="icon"><img src="/image/icon-readiness.png" alt="Readiness" /></span>
                <span>Assess your real readiness</span>
              </li>
              <li>
                <span className="icon"><img src="/image/icon-roadmap.png" alt="Roadmap" /></span>
                <span>A roadmap built for you</span>
              </li>
              <li>
                <span className="icon"><img src="/image/icon-projects.png" alt="Projects" /></span>
                <span>Real projects from companies</span>
              </li>
              <li>
                <span className="icon"><img src="/image/icon-record.png" alt="Record" /></span>
                <span>A verified professional record</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="form-right">
          {onBack && (
            <button className="back-to-home-btn" onClick={onBack}>← Back to Home</button>
          )}

          <div className="login-icon-box" aria-hidden="true" />

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
              <span className="link-action reset-link" onClick={onForgotPassword}>
                Reset password
              </span>
            </div>

            {GOOGLE_LOGIN_ENABLED && (
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