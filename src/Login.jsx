import React, { useState } from 'react';
import './Login.css';
import { loginWithGoogle, saveSession } from './api';

const Login = ({ onSwitchToRegister, onBack, onForgotPassword }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

const handleGoogleLogin = () => {
  if (!window.google?.accounts?.id) {
    setErrors({
      general: 'Google Login is not ready yet. Please try again.',
    });
    return;
  }

  setIsGoogleSubmitting(true);
  setErrors({});

  window.google.accounts.id.initialize({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    callback: async (response) => {
      try {
        const result = await loginWithGoogle(
          response.credential,
          false,
          false
        );

        const { user, organizations, token } = result.data || {};

        saveSession({
          token,
          user,
          organizations,
        });

        setErrors({});
        alert('Google Login Successful!');
      } catch (err) {
        setErrors({
          general:
            err.message || 'Unable to login with Google. Please try again.',
        });
      } finally {
        setIsGoogleSubmitting(false);
      }
    },
  });

  window.google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      setIsGoogleSubmitting(false);
    }
  });
};
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // إزالة رسالة الخطأ فور بدء الكتابة
    setErrors({ ...errors, [e.target.name]: '', general: '' });
  };
  

  const handleLogin = (e) => {
    e.preventDefault();
    let newErrors = {};

    // التحقق من البريد الإلكتروني
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // التحقق من كلمة المرور
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // محاكاة التحقق من بيانات الدخول (مثال تجريبي)
    if (formData.password !== '123456' && formData.password !== 'password') {
      setErrors({ general: 'Invalid email or password. Please try again.' });
      return;
    }

    console.log("Login data:", formData);
    alert('Login Successful!');
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

          <button
            className="btn-google"
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleSubmitting}
          >
            <span>G</span>
            {isGoogleSubmitting ? 'Connecting...' : 'Google'}
          </button>
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
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="forgot-container">
              <span className="link-action" onClick={onForgotPassword}>
                Forgot password? Reset password
              </span>
            </div>

            <button type="submit" className="btn-login">Log in</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;