import React from 'react'
import './CompanyRegister.css'

function CompanyStep5({ onNavigateToLanding, onNavigateToLogin }) {
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
              <li className="company-step3-step-item completed">
                <span className="c-indicator">✓</span> 4. Terms & Agreement
              </li>
              <li className="company-step3-step-item active">
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

        {/* القسم الرئيسي لشاشة التأكيد */}
        <div className="company-step3-form-sec" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          
          <div>
            {/* الهيدر العلوي */}
            <div className="company-step3-header" style={{ justifyContent: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '15px' }}>
              <h2 style={{ color: '#38bdf8', fontSize: '1.4rem' }}>Registration Submitted!</h2>
            </div>

            {/* أيقونة الصح الكبرى */}
            <div style={{ margin: '20px 0', display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: '70px',
                height: '70px',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '2px solid #3b82f6',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
              }}>
                ✅
              </div>
            </div>

            <h3 style={{ color: '#ffffff', fontSize: '1.2rem', marginBottom: '5px' }}>Thank You!</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
              Your company registration has been submitted successfully.
            </p>

            {/* صندوق التفاصيل والإشعارات */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '15px 20px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              marginBottom: '20px'
            }}>
              {/* عنصر 1: البريد الإلكتروني */}
              <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '20px' }}>✉️</span>
                <div>
                  <div style={{ color: '#ffffff', fontWeight: '600', fontSize: '0.9rem' }}>Check your email</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: '1.4' }}>
                    We have sent a verification link to info@company.com.<br />
                    Please verify your email address to activate your account.
                  </div>
                </div>
              </div>

              {/* عنصر 2: المراجعة */}
              <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '20px' }}>⏰</span>
                <div>
                  <div style={{ color: '#ffffff', fontWeight: '600', fontSize: '0.9rem' }}>Review in progress</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: '1.4' }}>
                    Our team will review your information and documents.<br />
                    This usually takes 1-2 business days.
                  </div>
                </div>
              </div>

              {/* عنصر 3: الإشعارات */}
              <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '20px' }}>🔔</span>
                <div>
                  <div style={{ color: '#ffffff', fontWeight: '600', fontSize: '0.9rem' }}>We'll notify you</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: '1.4' }}>
                    • You will receive an email once your company account is approved and ready to use.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            {/* زر الانتقال للصفحة الرئيسية */}
            <button 
              type="button" 
              onClick={onNavigateToLanding}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                marginBottom: '15px',
                transition: 'opacity 0.2s'
              }}
            >
              Go to Landing Page
            </button>

            {/* رابط تسجيل الدخول السفلي */}
            <div className="c-login-text" style={{ fontSize: '0.85rem' }}>
              Already Have a company account? <span onClick={onNavigateToLogin} style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: '600' }}>log in</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

export default CompanyStep5