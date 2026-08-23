import React, { useState } from 'react';
import './CompanyRegister.css'; // نفس ملف التنسيق الخاص بالشركات

const CompanyStep2 = ({ onNextSuccess, onBack, onNavigateToLogin }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    companyType: 'Technology',
    industry: 'Software & IT Services',
    companySize: '11 - 50 employees',
    website: '',
    companyDescription: '',
    country: '',
    city: '',
    address: '',
    postalCode: ''
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!formData.companyName || !formData.country || !formData.city || !formData.address) {
      setError('Please fill in all required fields.');
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
            <li className="company-step1-step-item completed">
              <span className="c-indicator">✓</span>
              <span>1. Account Details</span>
            </li>
            <li className="company-step1-step-item active">
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
            <h2>Start Your Corporate Journey</h2>
            <span className="c-step-badge">Step 2</span>
          </div>

          {error && <div style={{ color: '#ef4444', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}

          <form onSubmit={handleNext} className="company-step1-form" lang="en">
            <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '15px' }}>Company information</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="c-input-group">
                <label>Company Name</label>
                <input 
                  type="text" 
                  name="companyName" 
                  placeholder="TechNova Solutions" 
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="c-input-group">
                <label>Company Type</label>
                <select name="companyType" value={formData.companyType} onChange={handleChange} style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}>
                  <option value="Technology">Technology</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="c-input-group">
                <label>Industry (Required)</label>
                <select name="industry" value={formData.industry} onChange={handleChange} style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}>
                  <option value="Software & IT Services">Software & IT Services</option>
                  <option value="Digital Marketing">Digital Marketing</option>
                  <option value="E-commerce">E-commerce</option>
                </select>
              </div>

              <div className="c-input-group">
                <label>Company Size</label>
                <select name="companySize" value={formData.companySize} onChange={handleChange} style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}>
                  <option value="1 - 10 employees">1 - 10 employees</option>
                  <option value="11 - 50 employees">11 - 50 employees</option>
                  <option value="51 - 200 employees">51 - 200 employees</option>
                  <option value="200+ employees">200+ employees</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="c-input-group">
                <label>Website (URL)</label>
                <input 
                  type="text" 
                  name="website" 
                  placeholder="https://technova.com" 
                  value={formData.website}
                  onChange={handleChange}
                />
              </div>

              <div className="c-input-group">
                <label>Company Description</label>
                <textarea 
                  name="companyDescription" 
                  placeholder="We build innovative software solutions that..." 
                  value={formData.companyDescription}
                  onChange={handleChange}
                  rows="2"
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', resize: 'none' }}
                />
              </div>
            </div>

            <h3 style={{ color: '#fff', fontSize: '16px', margin: '15px 0 10px 0' }}>Company Address</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="c-input-group">
                <label>Country</label>
                <input 
                  type="text" 
                  name="country" 
                  placeholder="Saudi Arabia" 
                  value={formData.country}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="c-input-group">
                <label>City</label>
                <input 
                  type="text" 
                  name="city" 
                  placeholder="Riyadh" 
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="c-input-group">
                <label>Address</label>
                <input 
                  type="text" 
                  name="address" 
                  placeholder="King Fahd Road, Al Olaya" 
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="c-input-group">
                <label>Postal Code</label>
                <input 
                  type="text" 
                  name="postalCode" 
                  placeholder="12211" 
                  value={formData.postalCode}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="c-actions" style={{ marginTop: '20px' }}>
              <button type="button" className="c-btn-back" onClick={onBack}>
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

export default CompanyStep2;