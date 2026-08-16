import React, { useState } from 'react'
import './CompanyRegister.css'

function CompanyStep3({ onNextSuccess, onBack, onNavigateToLogin }) {
  // جعل القيمة الابتدائية فارغة (null) لكي لا يظهر الملف الوهمي عند فتح الصفحة
  const [uploadedFile, setUploadedFile] = useState(null)
  const [optionalFile, setOptionalFile] = useState(null)

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setUploadedFile(e.target.files[0].name)
    }
  }

  const handleOptionalFileChange = (e) => {
    if (e.target.files[0]) {
      setOptionalFile(e.target.files[0].name)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // التحقق من وجود الملف الإلزامي قبل الإرسال والانتقال للخطوة التالية
    if (uploadedFile && onNextSuccess) {
      onNextSuccess({ 
        businessRegistrationDoc: uploadedFile,
        additionalDoc: optionalFile 
      })
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
              <li className="company-step3-step-item active">
                <span className="c-indicator"></span> 3. Verification & Documents
              </li>
              <li className="company-step3-step-item">
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
            <h2>Start Your Corporate Journey</h2>
            <span className="c-step-badge">Step 3</span>
          </div>

          <form onSubmit={handleSubmit} className="company-step1-form">
            <div className="c-input-group">
              <label style={{ fontSize: '1rem', fontWeight: 'bold', color: '#ffffff' }}>Verify Your Company</label>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 10px 0' }}>
                Please upload the required documents to verify your company.
              </p>
              
              <label style={{ color: '#cbd5e1', marginTop: '10px' }}>
                Business Registration Document <span style={{ color: '#ef4444' }}>(Required)</span>
              </label>

              {/* منطقة رفع الملف الأول */}
              <div style={{
                border: uploadedFile ? '1px solid #3b82f6' : '1px dashed rgba(59, 130, 246, 0.5)',
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                position: 'relative',
                cursor: 'pointer',
                marginTop: '5px'
              }}>
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'flex-start' }}>
                  <div style={{ fontSize: '24px', background: 'rgba(59, 130, 246, 0.2)', padding: '10px', borderRadius: '10px' }}>📄</div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ color: '#ffffff', fontWeight: '600', fontSize: '0.9rem' }}>
                      Upload Company Registration or Trade License
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>PDF, PNG, JPG (Max 10MB)</div>
                  </div>
                </div>

                {/* سيظهر هذا الصندوق فقط بعد أن يختار المستخدم ملفاً */}
                {uploadedFile && (
                  <div style={{
                    marginTop: '15px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '10px 15px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>📎 {uploadedFile}</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Selected</span>
                  </div>
                )}
              </div>
            </div>

            {/* البند الاختياري Additional Document */}
            <div className="c-input-group" style={{ marginTop: '10px' }}>
              <label style={{ color: '#cbd5e1' }}>
                Additional Document <span style={{ color: '#94a3b8' }}>(Optional)</span>
              </label>
              
              <div style={{
                border: optionalFile ? '1px solid #3b82f6' : '1px dashed rgba(255, 255, 255, 0.15)',
                background: 'rgba(15, 23, 42, 0.4)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                position: 'relative',
                cursor: 'pointer'
              }}>
                <input 
                  type="file" 
                  onChange={handleOptionalFileChange}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'flex-start' }}>
                  <div style={{ fontSize: '24px', background: 'rgba(255, 255, 255, 0.05)', padding: '10px', borderRadius: '10px' }}>📄</div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ color: '#ffffff', fontWeight: '600', fontSize: '0.9rem' }}>
                      Upload Company Registration or Trade License
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>PDF, PNG, JPG (Max 10MB)</div>
                  </div>
                </div>

                {/* صندوق عرض الملف الاختياري عند اختياره */}
                {optionalFile && (
                  <div style={{
                    marginTop: '15px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '10px 15px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>📎 {optionalFile}</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Selected</span>
                  </div>
                )}
              </div>
            </div>

            <div className="c-actions">
              <button type="button" className="c-btn-back" onClick={onBack}>
                ← Back
              </button>
              
              {/* زر Next أصبح مرتبطاً بوجود الملف الإلزامي uploadedFile */}
              <button 
                type="submit" 
                className="c-btn-next"
                disabled={!uploadedFile}
                style={{ 
                  opacity: uploadedFile ? 1 : 0.5, 
                  cursor: uploadedFile ? 'pointer' : 'not-allowed',
                  backgroundColor: uploadedFile ? '#3b82f6' : '#475569'
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

export default CompanyStep3