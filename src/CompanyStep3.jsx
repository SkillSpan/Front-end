import React, { useState } from 'react'
import './CompanyRegister.css'

function CompanyStep3({ onNextSuccess, onBack, onNavigateToLogin }) {
  const [uploadedFile, setUploadedFile] = useState(null)
  const [optionalFile, setOptionalFile] = useState(null)
  const [fileError, setFileError] = useState('')

  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
  const MAX_SIZE = 5 * 1024 * 1024 // 5MB

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only PDF, PNG, JPG, and JPEG files are allowed.'
    }
    if (file.size > MAX_SIZE) {
      return 'File size must be 5MB or less.'
    }
    return ''
  }

  const handleFileChange = (e) => {
    setFileError('')
    if (e.target.files[0]) {
      const err = validateFile(e.target.files[0])
      if (err) {
        setFileError(err)
        setUploadedFile(null)
        e.target.value = ''
        return
      }
      setUploadedFile(e.target.files[0])
    }
  }

  const handleOptionalFileChange = (e) => {
    setFileError('')
    if (e.target.files[0]) {
      const err = validateFile(e.target.files[0])
      if (err) {
        setFileError(err)
        setOptionalFile(null)
        e.target.value = ''
        return
      }
      setOptionalFile(e.target.files[0])
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (uploadedFile && onNextSuccess) {
      onNextSuccess({
        proofFile: uploadedFile,
        additionalDoc: optionalFile
      })
    }
  }

  return (
    <div className="company-step3-container">
      <div className="company-step3-card">
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
                  accept=".pdf,.png,.jpg,.jpeg"
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
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>PDF, PNG, JPG (Max 5MB)</div>
                  </div>
                </div>

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
                    <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>📎 {uploadedFile.name}</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Selected</span>
                  </div>
                )}
              </div>
            </div>

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
                  accept=".pdf,.png,.jpg,.jpeg"
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
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>PDF, PNG, JPG (Max 5MB)</div>
                  </div>
                </div>

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
                    <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>📎 {optionalFile.name}</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Selected</span>
                  </div>
                )}
              </div>
            </div>

            {fileError && (
              <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '10px', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                ⓘ {fileError}
              </div>
            )}

            <div className="c-actions">
              <button type="button" className="c-btn-back" onClick={onBack}>
                ← Back
              </button>
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