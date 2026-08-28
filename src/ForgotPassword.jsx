import { useEffect, useState } from 'react';
import './ForgotPassword.css';
import { forgotPassword } from './api';

const ForgotPassword = ({ onBackToLogin, onContinueToVerify }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendAvailableAt, setResendAvailableAt] = useState(null);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);

  useEffect(() => {
    if (!resendAvailableAt) return undefined;
    const target = new Date(resendAvailableAt).getTime();
    const tick = () => {
      setResendSecondsLeft((prev) => {
        const diff = Math.ceil((target - Date.now()) / 1000);
        const next = diff > 0 ? diff : 0;
        return prev === next ? prev : next;
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [resendAvailableAt]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Email address is required');
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
    const response = await forgotPassword(email.trim());
    setResendAvailableAt(
      response?.data?.resend_available_at || null
    );

    setIsSubmitted(true);
} catch (err) {
      setError(err.message || 'Unable to send the reset code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
const getResendSecondsLeft = () => resendSecondsLeft;

const handleResend = async () => {
  if (isSubmitting || resendSecondsLeft > 0) return;
  setIsSubmitting(true);
  setError('');
  try {
    const response = await forgotPassword(email.trim());
    setResendAvailableAt(
      response?.data?.resend_available_at || null
    );
  } catch (err) {
    setError(err.message || 'Unable to resend the reset code. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
  return (
    <div className="forgot-wrapper">
      <div className="forgot-card">
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

        <div className="form-right-forgot">
          <div className="forgot-content-box">

            {isSubmitted ? (
              <div className="email-sent-container">
                <div className="email-icon-wrapper">
                  <img src="/image/7.png" alt="Check email" className="custom-mail-img" />
                </div>
                
                <h1 className="forgot-heading">Check your email</h1>
                <p className="forgot-subtitle">
                  A 6-digit reset code has been sent to your email address{' '}
                  <strong>{email}</strong>. Please check your inbox (and spam folder)
                  and enter the code on the next screen. The code is valid for 10 minutes.
                </p>

                <button
                  type="button"
                  className="btn-send-link"
                  onClick={() => onContinueToVerify && onContinueToVerify(email)}
                >
                  Continue to Verify
                </button>

                <div className="back-link-container" style={{ marginTop: '12px' }}>
                  Didn't get an email?{' '}
                  <span
                    className="link-action"
                    onClick={getResendSecondsLeft() > 0 || isSubmitting ? undefined : handleResend}
                    style={{
                      cursor: getResendSecondsLeft() > 0 || isSubmitting ? 'default' : 'pointer',
                      opacity: getResendSecondsLeft() > 0 || isSubmitting ? 0.5 : 1,
                    }}
                  >
                    {getResendSecondsLeft() > 0
                      ? `Resend in ${getResendSecondsLeft()}s`
                      : 'Resend code'}
                  </span>
                </div>
              </div>
            ) : (
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

                  <button type="submit" className="btn-send-link" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                  </button>
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