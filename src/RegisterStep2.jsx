import { useState } from 'react';
import './RegisterStep2.css';

const RegisterStep2 = ({ onNextSuccess, onBack, introText }) => {
  // تم ضبط القيمة الافتراضية إلى null لتجنب تحديد خيار الطالب تلقائياً
  const [academicStatus, setAcademicStatus] = useState(null); 
  const [error, setError] = useState('');

  const handleSelect = (status) => {
    setAcademicStatus(status);
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!academicStatus) {
      setError('Please select your academic status before proceeding.');
      return;
    }
    if (onNextSuccess) {
      onNextSuccess({ academicStatus });
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        {/* Left Dark Sidebar */}
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

        {/* Right Form Container */}
        <div className="form-right">
          <div className="step-header">
            <span className="step-title">STEP 2 OF 3</span>
            <span className="step-percent">66%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '66%' }}></div>
          </div>

          <div className="form-heading">
            <span className="sub-tag">ACADEMIC STATUS</span>
            <h1>Where are you right now?</h1>
            <p>This helps us tailor your experience</p>
          </div>

          {introText && (
            <div style={{
              color: '#93c5fd',
              fontSize: '0.85rem',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '8px',
              padding: '8px 12px',
              marginBottom: '14px'
            }}>
              {introText}
            </div>
          )}

          {error && <div className="server-error-banner">{error}</div>}

          <div className="options-container">
            {/* Student Card */}
            <div
              className={`option-card ${academicStatus === 'student' ? 'selected-card' : ''}`}
              onClick={() => handleSelect('student')}
            >
              <div className="option-icon" aria-hidden="true"></div>
              <div className="option-text">
                <h3>Student</h3>
                <p>Currently pursuing my degree</p>
              </div>
            </div>

            {/* Graduate Card */}
            <div
              className={`option-card ${academicStatus === 'graduate' ? 'selected-card' : ''}`}
              onClick={() => handleSelect('graduate')}
            >
              <div className="option-icon" aria-hidden="true"></div>
              <div className="option-text">
                <h3>Graduate</h3>
                <p>Completed my academic studies</p>
              </div>
            </div>

            {/* Professional Card */}
            <div
              className={`option-card ${academicStatus === 'professional' ? 'selected-card' : ''}`}
              onClick={() => handleSelect('professional')}
            >
              <div className="option-icon" aria-hidden="true"></div>
              <div className="option-text">
                <h3>Professional</h3>
                <p>Currently working in a professional role</p>
              </div>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="action-buttons">
            <button type="button" className="btn-back" onClick={onBack}>
              <svg className="btn-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12H3M10 5l-7 7 7 7" /></svg>
              Back
            </button>
            <button type="button" className="btn-next-step" onClick={handleSubmit}>
              Next
              <svg className="btn-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12h18M14 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterStep2;