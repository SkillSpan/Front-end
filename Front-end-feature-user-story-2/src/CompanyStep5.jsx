import React from 'react'
import './CompanyRegister.css'
import { ShieldCheckIcon, CheckCircleBigIcon } from './CompanyIcons'

function CompanyStep5({ onNavigateToLogin, email }) {
  return (
    <div className="company-step5-container">
      <div className="company-step5-card">
        <div className="company-step5-sidebar">
          <div>
            <div className="company-step5-brand" aria-label="SkillSpan brand name">
              <span className="brand-wordmark"><span className="brand-skill">Skill</span><span className="brand-span">Span</span></span>
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
            <div className="sec-icon"><ShieldCheckIcon /></div>
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

          <div className="company-step5-success">
            <div className="c5-check-badge">
              <CheckCircleBigIcon />
            </div>

            <h3 className="c5-thank-you">Thank You!</h3>
            <p className="c5-thank-desc">
              Your company registration has been submitted successfully.
            </p>

            <ul className="c5-info-list-plain">
              <li>
                <p className="c5-info-title">Check your email</p>
                <p className="c5-info-desc">
                  We have sent a verification link to <strong>{email || 'info@company.com'}</strong>. Please verify your
                  email address to activate your account.
                </p>
              </li>

              <li>
                <p className="c5-info-title">Review in progress</p>
                <p className="c5-info-desc">
                  Our team will review your information and documents.
                  This usually takes 1-2 business days.
                </p>
              </li>

              <li>
                <p className="c5-info-title">We'll notify you</p>
                <ul className="c5-info-sublist">
                  <li>You will receive an email once your company account is approved and ready to use.</li>
                </ul>
              </li>
            </ul>

            <button onClick={onNavigateToLogin} className="c5-btn-landing">
              Go to Landing Page
            </button>

            <p className="c5-login-text">
              Already Have a company account? <span className="c5-login-link" onClick={onNavigateToLogin}>log in</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompanyStep5