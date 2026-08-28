import { useState } from 'react';
import './RegisterStep3.css';
import { registerUser, loginWithGoogle } from './api';
import { buildRegisterPayload } from './utils/payloadMapping';

const RegisterStep3 = ({ onNextSuccess, onBack, registerData, googleCredential }) => {
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleTerms = () => {
    setAgreeTerms((prev) => !prev);
    if (error) setError('');
  };

  const handleTogglePrivacy = () => {
    setAgreePrivacy((prev) => !prev);
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
        res = await loginWithGoogle(
          googleCredential,
          agreeTerms,
          agreePrivacy
        );
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
            <h2>Start Your<br />Career Journey</h2>
            <p className="sidebar-desc">
              From education to your first opportunity in clear, verified steps
            </p>

            <ul className="features-list">
              <li>
                <span className="icon"><img src="/image/2.png" alt="Readiness" /></span>
                <span>Assess your real readiness</span>
              </li>
              <li>
                <span className="icon"><img src="/image/3.png" alt="Roadmap" /></span>
                <span>A roadmap built for you</span>
              </li>
              <li>
                <span className="icon"><img src="/image/4.png" alt="Projects" /></span>
                <span>Real projects from companies</span>
              </li>
              <li>
                <span className="icon"><img src="/image/5.png" alt="Record" /></span>
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
            <span className="sub-tag">TERMS & PRIVACY</span>
            <h1>One last step</h1>
          </div>

          <div className="agreements-container">
            {/* Terms of Use Box */}
            <div 
              className={`checkbox-card ${agreeTerms ? 'checked' : ''}`}
              onClick={handleToggleTerms}
            >
              <div className="custom-checkbox">
                {agreeTerms && <span className="checkmark">✓</span>}
              </div>
              <span className="checkbox-text">
                I agree to the <span className="highlight-text">Terms of Use</span>
              </span>
            </div>

            {/* Privacy Policy Box */}
            <div 
              className={`checkbox-card ${agreePrivacy ? 'checked' : ''}`}
              onClick={handleTogglePrivacy}
            >
              <div className="custom-checkbox">
                {agreePrivacy && <span className="checkmark">✓</span>}
              </div>
              <span className="checkbox-text">
                I agree to the <span className="highlight-text">Privacy Policy</span>
              </span>
            </div>

            {/* Error Banner */}
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
              Back
            </button>
            <button type="button" className="btn-next-step" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterStep3;
