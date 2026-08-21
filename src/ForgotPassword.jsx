import React, { useState } from 'react'
import './ForgotPassword.css'
import { forgotPassword } from './api'

const ForgotPassword = ({ onBackToLogin, onContinueToVerify }) => {
  // الإيميل الذي سيدخل المستخدم
  const [email, setEmail] = useState('')

  // رسائل الخطأ
  const [error, setError] = useState('')

  // حالة الإرسال
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    const normalizedEmail = email.trim()

    // التحقق المحلي من الإيميل
    if (!normalizedEmail) {
      setError('Email address is required')
      return
    }

    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      setError('Please enter a valid email address')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      // طلب إرسال OTP من الـBackend
      await forgotPassword(normalizedEmail)

      // الانتقال إلى صفحة إدخال الكود بعد نجاح الطلب
      if (typeof onContinueToVerify === 'function') {
        onContinueToVerify(normalizedEmail)
      }
    } catch (error) {
      console.error('Forgot password failed:', error)

      // عرض رسالة الـBackend داخل الصفحة
      setError(
        error.message ||
          'Unable to send the password reset code. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="forgot-wrapper">
      <div className="forgot-card">

        {/* الشريط الجانبي */}
        <div className="sidebar-left">
          <div className="sidebar-brand">
            <span className="white">Skill</span>
            <span className="blue">Span</span>
          </div>

          <div className="sidebar-content">
            <h2>Start Your Career Journey</h2>

            <p>
              From education to your first opportunity in clear,
              verified steps
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

        {/* نموذج إدخال الإيميل */}
        <div className="form-right-forgot">
          <div className="forgot-content-box">

            <h1 className="forgot-heading">
              Reset Your Password
            </h1>

            <p className="forgot-subtitle">
              Enter the email address associated with your account,
              and we will send you a verification code.
            </p>

            {error && (
              <div className="forgot-error-banner">
                <span className="forgot-error-icon">!</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="input-group">
                <input
                  type="email"
                  className={`forgot-input ${
                    error ? 'input-error' : ''
                  }`}
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                className="btn-send-link"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Sending...'
                  : 'Send Verification Code'}
              </button>
            </form>

            <div className="back-link-container">
              <span
                onClick={onBackToLogin}
                className="link-action"
              >
                ← Back to Log in
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

export default ForgotPassword