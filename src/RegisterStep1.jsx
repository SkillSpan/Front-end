import { useState } from 'react';
import './RegisterStep1.css';

const RegisterStep1 = ({ onNextSuccess, onNavigateToLogin, initialData }) => {
  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || '',
    email: initialData?.email || '',
    password: initialData?.password || '',
    confirmPassword: initialData?.confirmPassword || '',
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // دالة لتوليد كلمة مرور قوية
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let generated = '';
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({
      ...prev,
      password: generated,
      confirmPassword: generated,
    }));
    if (errors.password || errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, password: '', confirmPassword: '' }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  // Client-side validation only. This step never talks to the backend by
  // itself - the actual POST /api/v1/auth/register call happens once at the
  // end of the wizard (RegisterStep3), after terms/privacy are accepted,
  // using the full accumulated payload. That's the only point at which we
  // find out whether the email is already registered etc. (via Laravel's
  // 422 response), so we deliberately don't try to guess that here.
  const validateClientSide = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required.';
    if (!formData.email.trim()) {
      newErrors.email = 'Email Address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const clientErrors = validateClientSide();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }
    if (onNextSuccess) onNextSuccess(formData);
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        {/* Left Dark Sidebar */}
        <div className="sidebar-left">
          <div className="sidebar-brand">SkillSpan</div>
          <div className="sidebar-content">
            <h2>Start Your<br />Career Journey</h2>
            <p className="sidebar-desc">
              From education to your first opportunity in clear, verified steps
            </p>

        <ul className="features-list">
  <li>
    <span className="icon">
      <img src="/image/2.png" alt="Readiness" />
    </span>
    <span>Assess your real readiness</span>
  </li>
  <li>
    <span className="icon">
      <img src="/image/3.png" alt="Roadmap" />
    </span>
    <span>A roadmap built for you</span>
  </li>
  <li>
    <span className="icon">
      <img src="/image/4.png" alt="Projects" />
    </span>
    <span>Real projects from companies</span>
  </li>
  <li>
    <span className="icon">
      <img src="/image/5.png" alt="Record" />
    </span>
    <span>A verified professional record</span>
  </li>
</ul>
          </div>
        </div>

        {/* Right Form Container */}
        <div className="form-right">
          <div className="step-header">
            <span className="step-title">STEP 1 OF 3</span>
            <span className="step-percent">33%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '33%' }}></div>
          </div>

          <div className="form-heading">
            <span className="sub-tag">CREATE ACCOUNT</span>
            <h1>Let's Start With the basics</h1>
            <p>This helps us set up your account correctly</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="input-group">
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                className={errors.fullName ? 'input-error' : ''}
              />
              {errors.fullName && <span className="error-text">{errors.fullName}</span>}
            </div>

            <div className="input-group">
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'input-error' : ''}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            {/* Password Input with Generate Option */}
            <div className="input-group">
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'input-error' : ''}
                />
                <button
                  type="button"
                  className="toggle-show-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="password-helper">
                <button
                  type="button"
                  className="generate-btn"
                  onClick={generatePassword}
                >
                  ✨ Auto-generate strong password
                </button>
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? 'input-error' : ''}
              />
              {errors.confirmPassword && (
                <span className="error-text">{errors.confirmPassword}</span>
              )}
            </div>

            <button type="submit" className="btn-next">
              Next →
            </button>
          </form>

          <p className="login-prompt">
            Already have an account?{' '}
            <span className="login-link" onClick={onNavigateToLogin}>
              log in
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterStep1;
