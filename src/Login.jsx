import { useEffect, useRef, useState } from 'react';
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
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const { wrapRef: googleWrapRef, overlayRef: googleOverlayRef, error: googleError, setError: setGoogleError, setCredentialRef } =
    useGoogleSignIn(null, GOOGLE_LOGIN_ENABLED);

  // The Google handler closes over the latest setGoogleError /
  // setIsGoogleSubmitting. We re-create it on every render and keep a ref
  // to the latest version so the hook's GIS callback always invokes the
  // current closure (see useGoogleSignIn.js).
  const handleGoogleCredentialRef = useRef(null);
  useEffect(() => {
    handleGoogleCredentialRef.current = async (credential) => {
      setGoogleError('');
      setIsGoogleSubmitting(true);

      try {
        const res = await loginWithGoogle(credential, false, false);
        const { user, organizations, token } = res.data || res;

        saveSession({ token, user, organizations });

        if (onLoginSuccess) {
          onLoginSuccess({ user, organizations, token });
        }
      } catch (err) {
        // Backend indicates that this Google identity does not have
        // an account yet and needs to continue through registration.
        if (isTermsRequiredError(err)) {
          if (onNewGoogleUser) {
            onNewGoogleUser(credential);
          }
          return;
        }

        // Any other error is a real Google/login failure.
        setGoogleError(
          err.message || 'Google sign-in failed. Please try again.'
        );
      } finally {
        setIsGoogleSubmitting(false);
      }
    };
    setCredentialRef(handleGoogleCredentialRef);
  }, [setCredentialRef, onLoginSuccess, onNewGoogleUser, setGoogleError]);

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
      // Backend may also signal specific account states (e.g.
      // EMAIL_NOT_VERIFIED / ACCOUNT_SUSPENDED) via err.code or err.errors.code
      // - surface those as a dedicated, actionable message instead of the
      // generic "Invalid email or password" line.
      const codeError =
        err.errors?.code?.[0] ||
        (typeof err.code === 'string' ? err.code : null);

      if (err.errors && Object.keys(err.errors).length > 0) {
        const fieldErrors = {};
        Object.entries(err.errors).forEach(([field, messages]) => {
          if (field === 'code') return;
          fieldErrors[field] = Array.isArray(messages) ? messages[0] : messages;
        });
        if (codeError === 'EMAIL_NOT_VERIFIED') {
          fieldErrors.general =
            'Your email address has not been verified yet. Please check your inbox for the verification code, or sign up again to receive a new code.';
        } else if (codeError === 'ACCOUNT_SUSPENDED') {
          fieldErrors.general =
            'This account has been suspended. Please contact support for help.';
        } else if (Object.keys(fieldErrors).length === 0) {
          fieldErrors.general =
            err.message || 'Invalid email or password. Please try again.';
        }
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
