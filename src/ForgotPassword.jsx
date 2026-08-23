import React, { useState } from 'react';
import './ForgotPassword.css';

const ForgotPassword = ({ onBackToLogin, onContinueToVerify }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email address is required');
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setIsSubmitted(true);
    console.log('Password reset link sent to:', email);
  };

  return (
    <div className="forgot-wrapper">
      <div className="forgot-card">
        {/* الشريط الجانبي المطابق تماماً */}
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

        {/* القسم الأيمن لإدخال الإيميل مع الصورة الخلفية */}
        <div className="form-right-forgot">
          <div className="forgot-content-box">

            {isSubmitted ? (
              /* واجهة تأكيد الإرسال مع صورتك المخصصة 7.png */
              <div className="email-sent-container">
                <div className="email-icon-wrapper">
                  <img src="/image/7.png" alt="Check email" className="custom-mail-img" />
                </div>
                
                <h1 className="forgot-heading">Check your email</h1>
                <p className="forgot-subtitle">
                  A reset link has been sent to your email address <strong>{email}</strong>. 
                  Please check your inbox (and spam folder) to reset your password. The link will expire in 15 minutes.
                </p>

                <button 
                  type="button"
                  className="btn-send-link" 
                  onClick={() => onContinueToVerify && onContinueToVerify(email)}
                >
                  Continue to Verify
                </button>
              </div>
            ) : (
              /* واجهة إدخال البريد الإلكتروني العادية */
              <>
                <h1 className="forgot-heading">Reset Your Password</h1>
                <p className="forgot-subtitle">
                  Please enter the email address associated with your account, and we will send you a password reset link.
                </p>

                <form onSubmit={handleSubmit} noValidate>
                  <div className="input-group">
                    <input 
                      type="email"
                      className={`forgot-input ${error ? 'input-error' : ''}`}
                      placeholder="Email Address" 
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }} 
                    />
                    {error && <span className="error-text">{error}</span>}
                  </div>

                  <button type="submit" className="btn-send-link">Send Reset Link</button>
                </form>

                <div className="back-link-container">
                  <span onClick={onBackToLogin} className="link-action">← Back to Log in</span>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;