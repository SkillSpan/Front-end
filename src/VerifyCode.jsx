import React, { useState, useRef } from 'react';
import './VerifyCode.css';

const VerifyCode = ({ email, onBack, onSuccess }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef([]);

  const handleChange = (value, index) => {
    if (isNaN(value)) return; // السماح بالأرقام فقط

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // الانتقال تلقائياً للمربع التالي
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // الرجوع للمربع السابق عند الضغط على Backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      if (inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    
    if (fullCode.length < 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    console.log('Verifying code:', fullCode);
    if (onSuccess) onSuccess(fullCode);
  };

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

        {/* القسم الأيمن لإدخال الكود */}
        <div className="form-right-verify">
          <div className="verify-top-bar">
            <span className="resend-text">Resend in {timer}s</span>
          </div>

          <div className="verify-content-box">
            {/* أيقونة الرسالة العلوية */}
            <div className="verify-mail-icon-box">
              <img src="/image/7.png" alt="Email icon" className="verify-mail-img" />
            </div>

            <h1 className="verify-heading">Verify Your Identity</h1>
            <p className="verify-subtitle">
              We've sent a 6-digit verification code to <strong>{email || 'your email'}</strong>. Please enter it below to proceed.
            </p>

            <form onSubmit={handleVerify}>
              {/* مربعات إدخال الـ 6 أرقام */}
              <div className="otp-inputs-container">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    value={digit}
                    ref={(el) => (inputRefs.current[index] = el)}
                    onChange={(e) => handleChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="otp-input-box"
                  />
                ))}
              </div>

              {error && <span className="error-text">{error}</span>}

              <button type="submit" className="btn-verify-code">
                Verify code
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyCode;