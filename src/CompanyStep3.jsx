import { useState } from 'react'
import './CompanyRegister.css'
import { ShieldCheckIcon, FileDocIcon, InfoIcon } from './CompanyIcons'

function CompanyStep3({ onNextSuccess, onBack, onNavigateToLogin, initialData }) {
  const [uploadedFile, setUploadedFile] = useState(initialData?.proofFile || null)
  const [optionalFile, setOptionalFile] = useState(initialData?.additionalFile || initialData?.additionalDoc || null)
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
        additionalFile: optionalFile
      })
    }
  }

  return (
    <div className="company-step3-container">
      <div className="company-step3-card">
        <div className="company-step3-sidebar">
          <div>
            <div className="company-step3-brand" aria-label="SkillSpan brand name">
              <span className="brand-wordmark"><span className="brand-skill">Skill</span><span className="brand-span">Span</span></span>
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
            <div className="sec-icon"><ShieldCheckIcon /></div>
            <div>
              <p className="sec-t">Your information is secure</p>
              <p className="sec-d">We protect your data and never share it with anyone.</p>
            </div>
          </div>
        </div>

        <div className="company-step3-form-sec">
          <div className="c-center-col">
            <div className="company-step3-header">
              <h2>Start Your Corporate Journey</h2>
              <span className="c-step-badge">Step 3</span>
            </div>

            <div className="company-step1-scroll">
            <form onSubmit={handleSubmit} className="company-step1-form">
              <div className="c-input-group">
                <label className="c-verify-title">Verify Your Company</label>
                <p className="c-verify-sub">
                  Please upload the required documents to verify your company.
                </p>

                <label className="c-upload-label">
                  Business Registration Document <span className="c-required">(Required)</span>
                </label>

                <div className={`c-upload-box ${uploadedFile ? 'has-file' : ''}`}>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="c-upload-input"
                  />
                  <div className="c-upload-row">
                    <div className="c-upload-icon"><FileDocIcon /></div>
                    <div className="c-upload-copy">
                      <div className="c-upload-title">Upload Company Registration or Trade License</div>
                      <div className="c-upload-hint">PDF, PNG, JPG (Max 5MB)</div>
                    </div>
                  </div>

                  {uploadedFile && (
                    <div className="c-upload-selected">
                      <span>{uploadedFile.name}</span>
                      <span className="c-upload-selected-tag">Selected</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="c-input-group c-input-group-spaced">
                <label className="c-upload-label">
                  Additional Document <span className="c-optional">(Optional)</span>
                </label>

                <div className={`c-upload-box ${optionalFile ? 'has-file' : ''}`}>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleOptionalFileChange}
                    className="c-upload-input"
                  />
                  <div className="c-upload-row">
                    <div className="c-upload-icon"><FileDocIcon /></div>
                    <div className="c-upload-copy">
                      <div className="c-upload-title">Upload Company Registration or Trade License</div>
                      <div className="c-upload-hint">PDF, PNG, JPG (Max 5MB)</div>
                    </div>
                  </div>

                  {optionalFile && (
                    <div className="c-upload-selected">
                      <span>{optionalFile.name}</span>
                      <span className="c-upload-selected-tag">Selected</span>
                    </div>
                  )}
                </div>
              </div>

              {fileError && (
                <div className="c-form-error c-form-error-icon">
                  <InfoIcon size={16} /> {fileError}
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
                >
                  Next →
                </button>
              </div>

              <div className="c-login-text">
                Already Have a company account? <span onClick={onNavigateToLogin} className="c-login-link">log in</span>
              </div>
            </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompanyStep3;
