import React from 'react';
import './EmailVerified.css';

const EmailVerified = ({ onContinue, onBackToLanding }) => {
  return (
    <div className="register-wrapper">
      <div className="register-card">
        {/* Left Sidebar (ثابت كما هو في كل الصفحات) */}
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

        {/* Right Success Container */}
        <div className="form-right verified-container">
          {/* Success Check Icon */}
          <div className="success-icon-box">
            <svg className="success-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="verified-heading">Email verified!</h1>
          <p className="verified-desc">
            Your email has been successfully verified.<br />
            You can now access your account.
          </p>

          {/* Continue Button */}
          <button type="button" className="btn-continue" onClick={onContinue}>
            Continue to login
          </button>

          {/* Back to landing page */}
          <div className="verified-footer-link">
            <button type="button" className="landing-link-btn" onClick={onBackToLanding}>
              Back to landing page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerified;