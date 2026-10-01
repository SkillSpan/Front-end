import { useState } from 'react';
import './RegisterStep3.css';
import { registerUser, loginWithGoogle } from '../../api';
import { buildRegisterPayload } from '../../utils/payloadMapping';

// لو الخطأ القادم من الباك إند معناه "الإيميل مستخدم/غلط" بنرجّع رسالته
// عشان تنعرض في Step 1 (حقل الإيميل) مش هون.
const getEmailError = (err) => {
  const fieldMsg = err?.errors?.email;
  if (fieldMsg) return Array.isArray(fieldMsg) ? fieldMsg[0] : fieldMsg;
  if (err?.message && /e-?mail/i.test(err.message) && /(taken|already|exist|registered|in use)/i.test(err.message)) {
    return err.message;
  }
  return '';
};

const RegisterStep3 = ({ onNextSuccess, onBack, onEmailError, registerData, googleCredential }) => {
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // One combined checkbox ("Terms of Service and Privacy Policy") - it sets
  // both flags together so the submit logic / API payload stay unchanged.
  const agreed = agreeTerms && agreePrivacy;

  const handleToggleAgreement = () => {
    const next = !agreed;
    setAgreeTerms(next);
    setAgreePrivacy(next);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agreeTerms || !agreePrivacy) {
      setError('Both agreements are required to continue');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      let res;
      if (googleCredential) {
        // Finalizing a Google sign-up (Login.jsx redirected here because
        // no account existed yet for this Google identity). This single
        // call both creates the account and logs the user in - Google
        // already verified the email, so there's no separate OTP step
        // after this (see RegisterWizard.handleStep3Success).
        res = await loginWithGoogle(googleCredential, agreeTerms, agreePrivacy, {
          academic_status: registerData.academicStatus,
        });
      } else {
        // This is the single point where the whole wizard's data is
        // actually sent to the backend. We only move on to OTP
        // verification after a real success response from Laravel - never
        // on a timeout or a locally simulated success.
        const payload = buildRegisterPayload({
          ...registerData,
          agreeTerms,
          agreePrivacy,
        });
        res = await registerUser(payload);
      }
      setIsSubmitting(false);
      if (typeof onNextSuccess === 'function') {
        onNextSuccess({ agreeTerms, agreePrivacy, response: res });
      }
    } catch (err) {
      setIsSubmitting(false);
      // خطأ الإيميل (مثلاً مستخدم من قبل) بيظهر بخطوة Step 1 عند حقل الإيميل
      const emailError = !googleCredential ? getEmailError(err) : '';
      if (emailError && typeof onEmailError === 'function') {
        onEmailError(emailError);
        return;
      }
      if (err.errors && Object.keys(err.errors).length > 0) {
        const firstField = Object.keys(err.errors)[0];
        const messages = err.errors[firstField];
        setError(Array.isArray(messages) ? messages[0] : messages);
      } else {
        setError(err.message || 'Something went wrong while creating your account.');
      }
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        {/* Sidebar */}
        <div className="sidebar-left">
          <div className="sidebar-brand">SkillSpan</div>
          <div className="sidebar-content">
            <h2>Start Your<br />Career&nbsp;Journey</h2>
            <p className="sidebar-desc">
              From education to your first opportunity in clear, verified steps
            </p>

            <ul className="features-list">
              <li>
                <span className="icon"><img src="/image/icon-readiness.png" alt="Readiness" /></span>
                <span>Assess your real readiness</span>
              </li>
              <li>
                <span className="icon"><img src="/image/icon-roadmap.png" alt="Roadmap" /></span>
                <span>A roadmap built for you</span>
              </li>
              <li>
                <span className="icon"><img src="/image/icon-projects.png" alt="Projects" /></span>
                <span>Real projects from companies</span>
              </li>
              <li>
                <span className="icon"><img src="/image/icon-record.png" alt="Record" /></span>
                <span>A verified professional record</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Form Container */}
        <div className="form-right">
          <div className="step-header">
            <span className="step-title">STEP 3 OF 3</span>
            <span className="step-percent">100%</span>
          </div>

          <div className="progress-bar-steps">
            <div className="step-line filled"></div>
            <div className="step-line filled"></div>
            <div className="step-line filled"></div>
          </div>

          <div className="form-heading">
            <h1>Terms &amp; Privacy</h1>
            <p>Please review and accept our terms to continue.</p>
          </div>

          {/* Terms of Service box */}
          <div className="terms-box">
            <div className="terms-box-header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M8 8h8M8 12h8M8 16h5" />
              </svg>
              <span>SkillSpan Terms of Service</span>
            </div>
            <div className="terms-box-body">
              <section className="terms-section">
                <h4>1. Acceptance of Terms</h4>
                <p>
                  By accessing and using SkillSpan, you agree to be bound by these Terms of
                  Service and all applicable laws and regulations.
                </p>
              </section>
              <section className="terms-section">
                <h4>2. Use of Service</h4>
                <p>
                  SkillSpan grants you a personal, non-transferable license to use the platform
                  for educational and professional development purposes only.
                </p>
              </section>
              <section className="terms-section">
                <h4>3. Privacy Policy</h4>
                <p>
                  Your use of SkillSpan is also governed by our Privacy Policy, which is
                  incorporated into these terms by reference. We collect and process your data to
                  personalize your learning experience.
                </p>
              </section>
              <section className="terms-section">
                <h4>4. User Content</h4>
                <p>
                  You retain ownership of content you submit. By uploading, you grant SkillSpan a
                  license to use, display, and distribute your content within the platform.
                </p>
              </section>
              <section className="terms-section">
                <h4>5. Account Security</h4>
                <p>
                  You are responsible for maintaining the confidentiality of your account
                  credentials and for all activities under your account.
                </p>
              </section>
            </div>
          </div>

          {/* Agreement checkbox + error */}
          <div className="terms-agreement">
            <div
              className={`terms-check ${agreed ? 'checked' : ''}`}
              role="checkbox"
              aria-checked={agreed}
              tabIndex={0}
              onClick={handleToggleAgreement}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  handleToggleAgreement();
                }
              }}
            >
              <span className="terms-check-box">
                {agreed && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                )}
              </span>
              <span className="terms-check-text">
                I have read and agree to SkillSpan&apos;s{' '}
                <span className="terms-link">Terms of Service</span> and{' '}
                <span className="terms-link">Privacy Policy</span>
              </span>
            </div>

            {error && (
              <div className="error-banner">
                <span className="error-icon">ⓘ</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button type="button" className="btn-back" onClick={onBack}>
              <svg className="btn-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12H3M10 5l-7 7 7 7" /></svg>
              Back
            </button>
            <button type="button" className="btn-next-step" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                'Creating account...'
              ) : (
                <>
                  Next
                  <svg className="btn-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12h18M14 5l7 7-7 7" /></svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterStep3;