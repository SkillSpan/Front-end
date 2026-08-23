import React, { useState } from 'react'
import './CompanyRegister.css'

function CompanyStep4({ onNextSuccess, onBack, isSubmitting, submitError }) {
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [error, setError] = useState('')

  const handleToggleTerms = () => {
    setAgreeTerms((prev) => !prev)
    if (error) setError('')
  }

  const handleTogglePrivacy = () => {
    setAgreePrivacy((prev) => !prev)
    if (error) setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isSubmitting) return

    if (!agreeTerms || !agreePrivacy) {
      setError('Both agreements are required to continue.')
      return
    }

    if (onNextSuccess) {
      onNextSuccess({ agreeTerms, agreePrivacy })
    }
  }

  return (
    <div className="company-step4-container">
      <div className="company-step4-card">
        <div className="company-step4-sidebar">
          <div>
            <div className="company-step4-brand">
              <span className="c-white">Skill</span><span className="c-blue">Span</span>
            </div>

            <div className="company-step4-dropdown-box">
              <button className="company-step4-drop-btn">
                Register Your Company <span>▾</span>
              </button>
            </div>

            <ul className="company-step4-steps">
              <li className="company-step4-step-item completed">
                <span className="c-indicator">✓</span> 1. Account Details
              </li>
              <li className="company-step4-step-item completed">
                <span className="c-indicator">✓</span> 2. Company Information
              </li>
              <li className="company-step4-step-item completed">
                <span className="c-indicator">✓</span> 3. Verification & Documents
              </li>
              <li className="company-step4-step-item active">
                <span className="c-indicator"></span> 4. Terms & Agreement
              </li>
              <li className="company-step4-step-item">
                <span className="c-indicator"></span> 5. Confirmation Screen
              </li>
            </ul>
          </div>

          <div className="company-step4-sec-badge">
            <div className="sec-icon">🛡️</div>
            <div>
              <p className="sec-t">Your information is secure</p>
              <p className="sec-d">We protect your data and never share it with anyone.</p>
            </div>
          </div>
        </div>

        <div className="company-step4-form-sec">
          <div className="company-step4-header">
            <h2>Terms & Agreement</h2>
            <span className="c-step-badge">Step 4</span>
          </div>

          <form onSubmit={handleSubmit} className="company-step1-form">
            <div className="c-input-group">
              <label style={{ fontSize: '1rem', fontWeight: 'bold', color: '#ffffff' }}>Agree to Our Policies</label>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 10px 0' }}>
                Please review and agree to our terms before proceeding.
              </p>
            </div>

            <div
              className={`c-checkbox-card ${agreeTerms ? 'checked' : ''}`}
              onClick={handleToggleTerms}
            >
              <div className="custom-checkbox">
                {agreeTerms && <span className="checkmark">✓</span>}
              </div>
              <span className="checkbox-text">
                I agree to the <span className="highlight-text">Terms of Use</span>
              </span>
            </div>

            <div
              className={`c-checkbox-card ${agreePrivacy ? 'checked' : ''}`}
              onClick={handleTogglePrivacy}
            >
              <div className="custom-checkbox">
                {agreePrivacy && <span className="checkmark">✓</span>}
              </div>
              <span className="checkbox-text">
                I agree to the <span className="highlight-text">Privacy Policy</span>
              </span>
            </div>

            {error && (
              <div className="error-banner" style={{ color: '#ef4444', marginTop: '10px', fontSize: '0.85rem' }}>
                <span>ⓘ</span> {error}
              </div>
            )}

            {submitError && (
              <div className="error-banner" style={{ color: '#ef4444', marginTop: '10px', fontSize: '0.85rem' }}>
                <span>ⓘ</span> {submitError}
              </div>
            )}

            <div className="c-actions">
              <button type="button" className="c-btn-back" onClick={onBack} disabled={isSubmitting}>
                ← Back
              </button>
              <button type="submit" className="c-btn-next" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Create Account →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CompanyStep4