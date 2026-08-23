import React, { useState } from 'react'
import './CompanyRegister.css'

function CompanyStep4({ onNextSuccess, onBack, onNavigateToLogin }) {
  // 1. نبدأ بـ false لكي لا تكون محددة مسبقاً بشكل خاطئ
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [agreedPrivacy, setAgreedPrivacy] = useState(false)

  // التحقق من أن المستخدم وافق على الشروط والسياسة معاً
  const isFormValid = agreedTerms && agreedPrivacy

  const handleSubmit = (e) => {
    e.preventDefault()
    // 2. منع الانتقال إلا إذا تم التحديد الفعلي
    if (isFormValid && onNextSuccess) {
      onNextSuccess({ termsAccepted: true, privacyAccepted: true })
    }
  }

  return (
    <div className="company-step3-container">
      <div className="company-step3-card">
        
        {/* الشريط الجانبي (Sidebar) */}
        <div className="company-step3-sidebar">
          <div>
            <div className="company-step3-brand">
              <span className="c-white">Skill</span><span className="c-blue">Span</span>
            </div>

            <div className="company-step3-dropdown-box">
              <button className="company-step3-drop-btn">
                Register Your Company <span>▾</span>
              </button>
            </div>

            <ul className="company-step3-steps">
              <li className="company-step3-step-item completed">
                <span className="c-indicator">✓</span> 1. Account Details
              </li>
              <li className="company-step3-step-item completed">
                <span className="c-indicator">✓</span> 2. Company Information
              </li>
              <li className="company-step3-step-item completed">
                <span className="c-indicator">✓</span> 3. Verification & Documents
              </li>
              <li className="company-step3-step-item active">
                <span className="c-indicator"></span> 4. Terms & Agreement
              </li>
              <li className="company-step3-step-item">
                <span className="c-indicator"></span> 5. Confirmation Screen
              </li>
            </ul>
          </div>

          <div className="company-step3-sec-badge">
            <div className="sec-icon">🛡️</div>
            <div>
              <p className="sec-t">Your information is secure</p>
              <p className="sec-d">We protect your data and never share it with anyone.</p>
            </div>
          </div>
        </div>

        {/* القسم الرئيسي (Form Section) */}
        <div className="company-step3-form-sec">
          <div className="company-step3-header">
            <h2>Terms & Agreement</h2>
            <span className="c-step-badge">Step 4</span>
          </div>

          <form onSubmit={handleSubmit} className="company-step1-form">
            <div className="c-input-group">
              <label style={{ fontSize: '1rem', fontWeight: 'bold', color: '#ffffff' }}>Please review and accept the following</label>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 15px 0' }}>
                Read our terms carefully. By proceeding, you agree to our policies and terms of service.
              </p>
              
              {/* صندوق شروط الخدمة */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '15px',
                display: 'flex',
                gap: '15px',
                alignItems: 'flex-start',
                marginBottom: '10px'
              }}>
                <div style={{ fontSize: '20px', background: 'rgba(59, 130, 246, 0.2)', padding: '8px', borderRadius: '8px' }}>📄</div>
                <div>
                  <div style={{ color: '#ffffff', fontWeight: '600', fontSize: '0.9rem', marginBottom: '4px' }}>Terms of Service</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.4' }}>
                    These terms outline the rules and guidelines for using SkillSpan platform and services.
                  </div>
                </div>
              </div>

              {/* صندوق سياسة الخصوصية */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid #3b82f6',
                borderRadius: '12px',
                padding: '15px',
                display: 'flex',
                gap: '15px',
                alignItems: 'flex-start',
                marginBottom: '20px',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.15)'
              }}>
                <div style={{ fontSize: '20px', background: 'rgba(59, 130, 246, 0.3)', padding: '8px', borderRadius: '8px' }}>🛡️</div>
                <div>
                  <div style={{ color: '#ffffff', fontWeight: '600', fontSize: '0.9rem', marginBottom: '4px' }}>Privacy Policy</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.4' }}>
                    Learn how we collect, use, and protect your company’s data and information.
                  </div>
                </div>
              </div>

              {/* خيارات الموافقة (Checkboxes) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={agreedTerms} 
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#3b82f6', cursor: 'pointer' }}
                  />
                  I have read, understood, and agree to the <span style={{ color: '#38bdf8' }}>Terms of Service</span>.
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={agreedPrivacy} 
                    onChange={(e) => setAgreedPrivacy(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#3b82f6', cursor: 'pointer' }}
                  />
                  I have read, understood, and agree to the <span style={{ color: '#38bdf8' }}>Privacy Policy</span>.
                </label>
              </div>

              {/* تنبيه القبول */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                fontSize: '0.8rem',
                color: '#93c5fd',
                marginBottom: '10px'
              }}>
                <span>ℹ️</span>
                <span>You must accept all terms and policies to continue with your company registration.</span>
              </div>
            </div>

            <div className="c-actions">
              <button type="button" className="c-btn-back" onClick={onBack}>
                ← Back
              </button>
              
              {/* 3. تعطيل الزر بصرياً ووظيفياً إذا لم يتم التحديد */}
              <button 
                type="submit" 
                className="c-btn-next"
                disabled={!isFormValid}
                style={{
                  opacity: isFormValid ? 1 : 0.5,
                  cursor: isFormValid ? 'pointer' : 'not-allowed'
                }}
              >
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
  )
}

export default CompanyStep4