import './CompanyRegister.css'
<<<<<<< HEAD
=======
import { ShieldCheckIcon, CheckCircleBigIcon } from './CompanyIcons'
>>>>>>> feature/hide-scrollbars

function CompanyStep5({ onNavigateToLanding, onNavigateToLogin, email }) {
  return (
    <div className="company-step5-container">
      <div className="company-step5-card">
        <div className="company-step5-sidebar">
          <div>
<<<<<<< HEAD
            <div className="company-step5-brand">
              <span className="c-white">Skill</span><span className="c-blue">Span</span>
            </div>

            <div className="company-step5-dropdown-box">
              <button className="company-step5-drop-btn">
                Register Your Company <span>▾</span>
              </button>
=======
            <div className="company-step5-brand" aria-label="SkillSpan brand name">
              <span className="brand-wordmark"><span className="brand-skill">Skill</span><span className="brand-span">Span</span></span>
>>>>>>> feature/hide-scrollbars
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
<<<<<<< HEAD
            <div className="sec-icon">🛡️</div>
=======
            <div className="sec-icon"><ShieldCheckIcon /></div>
>>>>>>> feature/hide-scrollbars
            <div>
              <p className="sec-t">Your information is secure</p>
              <p className="sec-d">We protect your data and never share it with anyone.</p>
            </div>
          </div>
        </div>

        <div className="company-step5-form-sec">
          <div className="company-step5-header">
            <h2>Registration Submitted!</h2>
<<<<<<< HEAD
=======
            <span className="c-step-badge">Step 5</span>
>>>>>>> feature/hide-scrollbars
          </div>

          <div className="company-step5-success">
            <div className="c5-check-badge">
<<<<<<< HEAD
              <span className="c5-confetti c5-confetti-1"></span>
              <span className="c5-confetti c5-confetti-2"></span>
              <span className="c5-confetti c5-confetti-3"></span>
              <span className="c5-confetti c5-confetti-4"></span>
              <div className="c5-check-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="#0b0f19" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
=======
              <CheckCircleBigIcon />
>>>>>>> feature/hide-scrollbars
            </div>

            <h3 className="c5-thank-you">Thank You!</h3>
            <p className="c5-thank-desc">
              Your company registration has been submitted successfully.
            </p>

<<<<<<< HEAD
            <div className="c5-info-box">
              <div className="c5-info-item">
                <img src="/image/icon-mail.png" alt="Check your email" className="c5-info-icon" />
                <div>
                  <p className="c5-info-title">Check your email</p>
                  <p className="c5-info-desc">
                    We have sent a verification code to{' '}
                    <strong>{email || 'info@company.com'}</strong>. Please verify your
                    email address to activate your account.
                  </p>
                </div>
              </div>

              <div className="c5-info-item">
                <img src="/image/icon-clock.png" alt="Review in progress" className="c5-info-icon" />
                <div>
                  <p className="c5-info-title">Review in progress</p>
                  <p className="c5-info-desc">
                    Our team will review your information and documents. This usually
                    takes 1-2 business days.
                  </p>
                </div>
              </div>

              <div className="c5-info-item">
                <img src="/image/icon-bell.png" alt="We'll notify you" className="c5-info-icon" />
                <div>
                  <p className="c5-info-title">We'll notify you</p>
                  <ul className="c5-info-list">
                    <li>You will receive an email once your company account is approved and ready to use.</li>
                  </ul>
                </div>
              </div>
            </div>
=======
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
>>>>>>> feature/hide-scrollbars

            <button onClick={onNavigateToLanding} className="c5-btn-landing">
              Go to Landing Page
            </button>

            <p className="c5-login-text">
<<<<<<< HEAD
<<<<<<< HEAD
              Already Have a company account? <span className="c5-login-link">log in</span>
=======
              Already Have a company account? <span className="c5-login-link" onClick={onNavigateToLogin}>log in</span>
>>>>>>> feature/hide-scrollbars
=======
              Already Have a company account?{' '}
              <span className="c5-login-link" onClick={onNavigateToLogin}>
                log in
              </span>
>>>>>>> 4fe3036680fd3a5fc5b9a3217cfe022635b4142f
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompanyStep5