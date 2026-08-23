import React from 'react'
import './CompanyRegister.css'

function CompanyStep5({ onNavigateToLogin, email }) {
  return (
    <div className="company-step5-container">
      <div className="company-step5-card">
        <div className="company-step5-sidebar">
          <div>
            <div className="company-step5-brand">
              <span className="c-white">Skill</span><span className="c-blue">Span</span>
            </div>

            <div className="company-step5-dropdown-box">
              <button className="company-step5-drop-btn">
                Register Your Company <span>▾</span>
              </button>
            </div>

            <ul className="company-step5-steps">
              <li className="company-step5-step-item completed">
                <span className="c-indicator">✓</span> 1. Account Details
              </li>
              <li className="company-step5-step-item completed">
                <span className="c-indicator">✓</span> 2. Company Information
              </li>
              <li className="company-step5-step-item completed">
                <span className="c-indicator">✓</span> 3. Verification & Documents
              </li>
              <li className="company-step5-step-item completed">
                <span className="c-indicator">✓</span> 4. Terms & Agreement
              </li>
              <li className="company-step5-step-item active">
                <span className="c-indicator"></span> 5. Confirmation Screen
              </li>
            </ul>
          </div>

          <div className="company-step5-sec-badge">
            <div className="sec-icon">🛡️</div>
            <div>
              <p className="sec-t">Your information is secure</p>
              <p className="sec-d">We protect your data and never share it with anyone.</p>
            </div>
          </div>
        </div>

        <div className="company-step5-form-sec">
          <div className="company-step5-header">
            <h2>Registration Submitted!</h2>
            <span className="c-step-badge">Step 5</span>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px'
          }}>
            <div style={{
              fontSize: '60px',
              marginBottom: '15px'
            }}>🎉</div>

            <p style={{
              color: '#cbd5e1',
              fontSize: '1rem',
              textAlign: 'center',
              lineHeight: '1.6',
              maxWidth: '400px'
            }}>
              Your company registration has been submitted successfully.<br />
              Your account is now <strong>pending admin approval</strong>.<br />
              Once approved, you will be able to log in.
            </p>

            <button
              onClick={onNavigateToLogin}
              className="c-btn-next"
              style={{
                marginTop: '25px',
                width: '260px',
                padding: '12px 24px'
              }}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompanyStep5