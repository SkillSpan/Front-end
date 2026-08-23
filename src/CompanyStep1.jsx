import React, { useState } from 'react';
import './CompanyRegister.css'; // ملف تنسيق خاص ومستقل للشركات

const CompanyStep1 = ({ onNextSuccess, onNavigateToLogin, onBack }) => {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = (e) => {
    e.preventDefault();

    // 1. التحقق من الحقول الفارغة
    if (!formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    // 2. شروط كلمة المرور (8 خانات على الأقل)
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    // 3. التحقق من تطابق كلمة المرور
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    onNextSuccess(formData);
  };

  return (
    <div className="company-step1-container">
      <div className="company-step1-card">
        
        {/* Sidebar */}
        <div className="company-step1-sidebar">
          <div className="company-step1-brand">
            <span className="c-white">Skill</span><span className="c-blue">Span</span>
          </div>

          <div className="company-step1-dropdown-box">
            <button className="company-step1-drop-btn">
              Register Your Company <span className="arrow">▾</span>
            </button>
          </div>

          <ul className="company-step1-steps">
            <li className="company-step1-step-item active">
              <span className="c-indicator"></span>
              <span>1. Account Details</span>
            </li>
            <li className="company-step1-step-item">
              <span className="c-indicator"></span>
              <span>2. Company Information</span>
            </li>
            <li className="company-step1-step-item">
              <span className="c-indicator"></span>
              <span>3. Verification & Documents</span>
            </li>
            <li className="company-step1-step-item">
              <span className="c-indicator"></span>
              <span>4. Terms & Agreement</span>
            </li>
            <li className="company-step1-step-item">
              <span className="c-indicator"></span>
              <span>5. Confirmation Screen</span>
            </li>
          </ul>

          <div className="company-step1-sec-badge">
            <span>🛡️</span>
            <div>
              <p className="sec-t">Your information is secure</p>
              <p className="sec-d">We protect your data and never share it with anyone.</p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="company-step1-form-sec">
          <div className="company-step1-header">
            <h2>Welcome to Registration</h2>
            <span className="c-step-badge">Step 1</span>
          </div>

          {error && <div style={{ color: '#ef4444', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}

          <form onSubmit={handleNext} className="company-step1-form" lang="en">
            <div className="c-input-group">
              <label>Email Address</label>
              <input 
                type="email" 
                name="email" 
                placeholder="e.g., alex.smith@example.com" 
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="c-input-group">
              <label>Phone Number</label>
              <input 
                type="text" 
                name="phone" 
                placeholder="e.g., +1-555-0199" 
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="c-input-group">
              <label>Password</label>
              <div className="c-pass-wrap">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  placeholder="********" 
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <span onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer', position: 'absolute', right: '14px' }}>
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </span>
              </div>
            </div>

            <div className="c-input-group">
              <label>Confirm Password</label>
              <div className="c-pass-wrap">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  name="confirmPassword" 
                  placeholder="********" 
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ cursor: 'pointer', position: 'absolute', right: '14px' }}>
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </span>
              </div>
            </div>

            <div className="c-notice-box">
              <span>🔒</span>
              <p>You'll be able to add more team members later.<br />This account will be the primary admin for your company.</p>
            </div>

            <div className="c-actions">
              <button 
                type="button" 
                className="c-btn-back" 
                onClick={onBack}
              >
                ← Back
              </button>
              <button type="submit" className="c-btn-next">
                Next →
              </button>
            </div>

            <div className="c-login-text">
              Already Have a company account? <span onClick={onNavigateToLogin} style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: '600' }}>log in</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompanyStep1;