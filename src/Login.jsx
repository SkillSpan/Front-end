import React, { useState } from 'react';
import './Login.css';
import { loginUser, saveSession } from './api';

const Login = ({ onSwitchToRegister, onBack, onForgotPassword, onLoginSuccess }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '', general: '' });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    let newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginUser(formData.email.trim(), formData.password);
      if (res?.data?.token) {
        saveSession({ token: res.data.token, user: res.data.user });
      }
      setLoginSuccess(true);
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess({ user: res?.data?.user });
      }
    } catch (err) {
      setErrors({ general: err.message || 'Invalid email or password. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
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

          <button className="btn-google" onClick={() => alert('Google Login Clicked')}>
            <span>G</span> Google
          </button>

          {errors.general && <div className="error-alert">{errors.general}</div>}
          {loginSuccess && (
            <div className="error-alert" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.4)' }}>
              Logged in successfully!
            </div>
          )}

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