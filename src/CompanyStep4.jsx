import { useState } from 'react'
import './CompanyRegister.css'
import { ShieldCheckIcon, InfoIcon, FileDocIcon } from './CompanyIcons'
import { registerOrganization } from './api'
import { buildOrganizationFormData } from './utils/payloadMapping'

function CompanyStep4({ onNextSuccess, onBack, onNavigateToLogin, companyData }) {
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!agreeTerms || !agreePrivacy || isSubmitting) {
      if (!agreeTerms || !agreePrivacy) setError('Both agreements are required to continue.')
      return
    }
    setError('')
    setIsSubmitting(true)
    try {
      const formData = buildOrganizationFormData({
        ...companyData,
        agreedTerms: true,
        agreedPrivacy: true,
      })
      const res = await registerOrganization(formData)
      onNextSuccess?.({ termsAccepted: true, privacyAccepted: true, response: res })
    } catch (err) {
      if (err.errors && Object.keys(err.errors).length > 0) {
        const firstField = Object.keys(err.errors)[0]
        const messages = err.errors[firstField]
        setError(Array.isArray(messages) ? messages[0] : messages)
      } else {
        setError(err.message || 'Something went wrong while submitting your registration.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="company-step4-container">
      <div className="company-step4-card">
        <div className="company-step4-sidebar">
          <div>
            <div className="company-step4-brand"><span className="c-white">Skill</span><span className="c-blue">Span</span></div>
            <ul className="company-step4-steps">
              <li className="company-step4-step-item completed"><span className="c-indicator">✓</span> 1. Account Details</li>
              <li className="company-step4-step-item completed"><span className="c-indicator">✓</span> 2. Company Information</li>
              <li className="company-step4-step-item completed"><span className="c-indicator">✓</span> 3. Verification & Documents</li>
              <li className="company-step4-step-item active"><span className="c-indicator"></span> 4. Terms & Agreement</li>
              <li className="company-step4-step-item"><span className="c-indicator"></span> 5. Confirmation Screen</li>
            </ul>
          </div>
          <div className="company-step4-sec-badge"><div className="sec-icon"><ShieldCheckIcon /></div><div><p className="sec-t">Your information is secure</p><p className="sec-d">We protect your data and never share it with anyone.</p></div></div>
        </div>
        <div className="company-step4-form-sec">
          <div className="company-step4-header"><h2>Terms & Agreement</h2><span className="c-step-badge">Step 4</span></div>
          <div className="company-step4-scroll">
            <p className="c-terms-lead">Please review and accept the following</p>
            <p className="c-terms-sub">Read our terms carefully. By proceeding, you agree to our policies and terms of service.</p>

            <div className="c-terms-service-card">
              <span className="c-terms-service-icon"><FileDocIcon size={28} /></span>
              <div className="c-terms-service-text">
                <div className="c-terms-service-title">Terms of Service</div>
                <div className="c-terms-service-copy">These terms outline the rules and guidelines for using SkillSpan platform and services.</div>
              </div>
            </div>

            <div className="c-privacy-policy-card">
              <span className="c-privacy-policy-icon"><ShieldCheckIcon size={28} /></span>
              <div className="c-privacy-policy-text">
                <div className="c-privacy-policy-title">Privacy Policy</div>
                <div className="c-privacy-policy-copy">Learn how we collect, use, and protect your company's<br />data and information.</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="company-step1-form">
              <div className="c-agreement-heading">Agreement</div>
              <div className={`c-checkbox-card ${agreeTerms ? 'checked' : ''}`} onClick={() => { setAgreeTerms(v=>!v); setError('') }}><div className="custom-checkbox">{agreeTerms && <span className="checkmark">✓</span>}</div><span className="checkbox-text">I have read, understood, and agree to the <span className="highlight-text">Terms of Service</span>.</span></div>
              <div className={`c-checkbox-card ${agreePrivacy ? 'checked' : ''}`} onClick={() => { setAgreePrivacy(v=>!v); setError('') }}><div className="custom-checkbox">{agreePrivacy && <span className="checkmark">✓</span>}</div><span className="checkbox-text">I have read, understood, and agree to the <span className="highlight-text">Privacy Policy</span>.</span></div>
              <div className="c-notice-box">
                <span className="c-notice-icon"><InfoIcon size={16} /></span>
                <p>You must accept all terms and policies to continue with your company registration.</p>
              </div>
              {error && <div className="c-form-error c-form-error-icon"><InfoIcon size={16} /> {error}</div>}
              <div className="c-actions">
                <button type="button" className="c-btn-back" onClick={onBack} disabled={isSubmitting}>← Back</button>
                <button type="submit" className="c-btn-next" disabled={isSubmitting || !agreeTerms || !agreePrivacy}>{isSubmitting ? 'Creating account...' : 'Next →'}</button>
              </div>
              <div className="c-login-text">Already Have a company account? <span onClick={onNavigateToLogin} className="c-login-link">log in</span></div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompanyStep4
