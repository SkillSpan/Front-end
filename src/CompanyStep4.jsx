import { useState } from 'react'
import './CompanyRegister.css'
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
            <div className="company-step4-dropdown-box"><button type="button" className="company-step4-drop-btn">Register Your Company <span>▾</span></button></div>
            <ul className="company-step4-steps">
              <li className="company-step4-step-item completed"><span className="c-indicator">✓</span> 1. Account Details</li>
              <li className="company-step4-step-item completed"><span className="c-indicator">✓</span> 2. Company Information</li>
              <li className="company-step4-step-item completed"><span className="c-indicator">✓</span> 3. Verification & Documents</li>
              <li className="company-step4-step-item active"><span className="c-indicator"></span> 4. Terms & Agreement</li>
              <li className="company-step4-step-item"><span className="c-indicator"></span> 5. Confirmation Screen</li>
            </ul>
          </div>
          <div className="company-step4-sec-badge"><div className="sec-icon">🛡️</div><div><p className="sec-t">Your information is secure</p><p className="sec-d">We protect your data and never share it with anyone.</p></div></div>
        </div>
        <div className="company-step4-form-sec">
          <div className="company-step4-header"><h2>Terms & Agreement</h2><span className="c-step-badge">Step 4</span></div>
          <form onSubmit={handleSubmit} className="company-step1-form">
            <div className="c-input-group"><label style={{fontSize:'1rem',fontWeight:'bold',color:'#ffffff'}}>Agree to Our Policies</label><p style={{fontSize:'0.85rem',color:'#94a3b8',margin:'0 0 10px 0'}}>Please review and agree to our terms before proceeding.</p></div>
            <div className={`c-checkbox-card ${agreeTerms ? 'checked' : ''}`} onClick={() => { setAgreeTerms(v=>!v); setError('') }}><div className="custom-checkbox">{agreeTerms && <span className="checkmark">✓</span>}</div><span className="checkbox-text">I agree to the <span className="highlight-text">Terms of Use</span></span></div>
            <div className={`c-checkbox-card ${agreePrivacy ? 'checked' : ''}`} onClick={() => { setAgreePrivacy(v=>!v); setError('') }}><div className="custom-checkbox">{agreePrivacy && <span className="checkmark">✓</span>}</div><span className="checkbox-text">I agree to the <span className="highlight-text">Privacy Policy</span></span></div>
            {error && <div className="error-banner" style={{color:'#ef4444',marginTop:'10px',fontSize:'0.85rem'}}><span>ⓘ</span> {error}</div>}
            <div className="c-actions">
              <button type="button" className="c-btn-back" onClick={onBack} disabled={isSubmitting}>← Back</button>
              <button type="submit" className="c-btn-next" disabled={isSubmitting || !agreeTerms || !agreePrivacy}>{isSubmitting ? 'Creating account...' : 'Create Account →'}</button>
            </div>
            <div className="c-login-text">Already Have a company account? <span onClick={onNavigateToLogin} style={{color:'#3b82f6',cursor:'pointer',fontWeight:'600'}}>log in</span></div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CompanyStep4
