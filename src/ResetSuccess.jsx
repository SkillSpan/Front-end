import React from 'react';
import './VerifyCode.css';

const ResetSuccess = ({ onGoToLogin }) => {
  return (
    <div className="verify-wrapper">
      <div className="verify-card">
        {/* الشريط الجانبي الثابت */}
        <div className="sidebar-left">
          <div className="sidebar-brand">
            <span className="white">Skill</span><span className="blue">Span</span>
          </div>

          <div className="sidebar-content">
            <h2>Start Your Career Journey</h2>
            <p>From education to your first opportunity in clear, verified steps</p>

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

        {/* القسم الأيمن لنجاح العملية */}
        <div className="form-right-verify" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '30px' }}>
          <div className="verify-content-box" style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            
            {/* أيقونة الصح الخضراء بضبط دقيق للحاوية */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <img 
                src="/image/6.png" 
                alt="Success Icon" 
                style={{ width: '210px', height: '210px', objectFit: 'contain', display: 'block' }} 
              />
            </div>

            <h1 className="verify-heading" style={{ fontSize: '24px', fontWeight: '700', marginBottom: '10px', width: '100%' }}>
              Password Reset Successful!
            </h1>
            
            <p className="verify-subtitle" style={{ marginBottom: '24px', color: '#64748b', fontSize: '14px', lineHeight: '1.5', width: '100%' }}>
              Your password has been updated successfully.<br />
              You can now login with your new password.
            </p>

            <button 
              type="button" 
              className="btn-verify-code" 
              onClick={onGoToLogin}
              style={{ width: '100%', padding: '12px', fontSize: '15px' }}
            >
              Go to log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetSuccess;