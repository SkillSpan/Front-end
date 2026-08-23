import React, { useState } from 'react';
import './RegisterStep2.css';

const RegisterStep2 = ({ onNextSuccess, onBack }) => {
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
            <h2>Start Your<br />Career Journey</h2>
            <p className="sidebar-desc">
              From education to your first opportunity in clear, verified steps
            </p>

            <ul className="features-list">
              <li>
                <span className="icon">
                  <img src="/image/2.png" alt="Readiness" />
                </span>
                <span>Assess your real readiness</span>
              </li>
              <li>
                <span className="icon">
                  <img src="/image/3.png" alt="Roadmap" />
                </span>
                <span>A roadmap built for you</span>
              </li>
              <li>
                <span className="icon">
                  <img src="/image/4.png" alt="Projects" />
                </span>
                <span>Real projects from companies</span>
              </li>
              <li>
                <span className="icon">
                  <img src="/image/5.png" alt="Record" />
                </span>
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

          {error && <div className="server-error-banner">{error}</div>}

          <div className="options-container">
            {/* Student Card */}
            <div
              className={`option-card ${academicStatus === 'student' ? 'selected-card' : ''}`}
              onClick={() => handleSelect('student')}
            >
              <div className="option-icon">🎓</div>
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
              <div className="option-icon">📜</div>
              <div className="option-text">
                <h3>Graduate</h3>
                <p>Completed my academic studies</p>
              </div>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="action-buttons">
            <button type="button" className="btn-back" onClick={onBack}>
              Back
            </button>
            <button type="button" className="btn-next-step" onClick={handleSubmit}>
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterStep2;