import { useState } from 'react';
import './Login.css';
import { loginUser, loginWithGoogle, saveSession } from './api';
import { GOOGLE_LOGIN_ENABLED } from './config';
import { isTermsRequiredError } from './utils/googleAuth';
import { useGoogleSignIn } from './useGoogleSignIn';

// --- Google Sign-In (individual accounts) -----------------------------
//
// Backend contract (google_login_frontend_guide.pdf): POST
// /api/v1/auth/login/google with { credential, terms_accepted, privacy_accepted }.
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

        <div className="form-right">
          {onBack && (
            <button className="back-to-home-btn" onClick={onBack}>← Back to Home</button>
          )}
          
          <h1 className="login-heading">Log in to your account</h1>
          <p className="new-here-text">
            New here? <span onClick={onSwitchToRegister} className="link-action">Create a new account</span>
          </p>

          {GOOGLE_LOGIN_ENABLED && (
            <div ref={googleWrapRef} style={{ position: 'relative', marginBottom: '12px' }}>
              <button type="button" className="btn-google" tabIndex={-1} aria-hidden="true">
                <span>G</span> Google
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
                <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '6px' }}>Signing in...</div>
              )}
              {googleError && (
                <div className="error-text" style={{ marginTop: '6px' }}>{googleError}</div>
              )}
            </div>
          )}

          {errors.general && <div className="error-alert">{errors.general}</div>}

          <form onSubmit={handleLogin} noValidate>
            <div className="input-group">
              <label>Email Address</label>
              <input 
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
              <label>Enter your password</label>
              <input 
                name="password" 
                type="password" 
                className={`login-input ${errors.password ? 'input-error' : ''}`}
                placeholder="password" 
                value={formData.password}
                onChange={handleChange} 
                autoComplete="current-password"
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="forgot-container">
              <span className="link-action" onClick={onForgotPassword}>
                Forgot password? Reset password
              </span>
            </div>

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
