import React, { useEffect, useRef, useState } from 'react'
import './VerifyCode.css'
import {
  resendForgotPassword,
  verifyForgotPasswordOtp,
} from './api'

const VerifyCode = ({ email, onBack, onSuccess }) => {
  // خانات كود استعادة كلمة المرور
  const [code, setCode] = useState(['', '', '', '', '', ''])

  // عداد انتهاء الكود
  const [timeLeft, setTimeLeft] = useState(600)

  // عداد إعادة إرسال الكود
  const [resendTimer, setResendTimer] = useState(60)

  // هل تم طلب إرسال كود جديد؟
  const [isResendState, setIsResendState] = useState(false)

  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const inputRefs = useRef([])

  // ==========================================
  // عداد انتهاء الكود وإعادة الإرسال
  // ==========================================
  // ==========================================
// عداد انتهاء الكود + عداد إعادة الإرسال
// ==========================================
useEffect(() => {
  const timer = setInterval(() => {
    // عداد صلاحية كود الاستعادة
    setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))

    // عداد السماح بإعادة إرسال الكود
    setResendTimer((prev) => (prev > 0 ? prev - 1 : 0))
  }, 1000)

  return () => clearInterval(timer)
}, [])

  // ==========================================
  // تحويل الثواني إلى MM:SS
  // ==========================================
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`
  }

  // ==========================================
  // إدخال رقم من الكود
  // ==========================================
  const handleChange = (value, index) => {
    const digit = value.replace(/\D/g, '').slice(-1)

    const nextCode = [...code]
    nextCode[index] = digit

    setCode(nextCode)
    setError('')

    // الانتقال تلقائيًا للخانة التالية
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // ==========================================
  // التعامل مع Backspace
  // ==========================================
  const handleKeyDown = (event, index) => {
    if (event.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // ==========================================
  // لصق الكود كاملًا
  // ==========================================
  const handlePaste = (event) => {
    const pastedCode = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6)

    if (!pastedCode) return

    event.preventDefault()

    const nextCode = pastedCode.split('')

    while (nextCode.length < 6) {
      nextCode.push('')
    }

    setCode(nextCode)
    setError('')

    inputRefs.current[
      Math.min(pastedCode.length, 6) - 1
    ]?.focus()
  }

  // ==========================================
  // التحقق الحقيقي من كود استعادة كلمة المرور
  // ==========================================
  const handleSubmit = async (event) => {
    event.preventDefault()

    const enteredCode = code.join('')

    if (enteredCode.length !== 6) {
      setError('Please enter the complete 6-digit code.')
      return
    }

    if (!email) {
      setError('Email address is missing. Please start again.')
      return
    }

    if (timeLeft <= 0) {
      setError(
        'This verification code has expired. Please request a new one.'
      )
      return
    }

    try {
      setIsVerifying(true)
      setError('')

      // التحقق من الكود عبر الـBackend
      await verifyForgotPasswordOtp(email, enteredCode)

      // الانتقال إلى صفحة تغيير كلمة المرور فقط بعد نجاح التحقق
      if (typeof onSuccess === 'function') {
        onSuccess(enteredCode)
      }
    } catch (error) {
      setError(
        error.message ||
          'The verification code is invalid or has expired.'
      )
    } finally {
      setIsVerifying(false)
    }
  }

  // ==========================================
  // إعادة إرسال كود استعادة كلمة المرور
  // ==========================================
  // ==========================================
// إعادة إرسال كود استعادة كلمة المرور
// ==========================================
const handleResend = async () => {
  if (!email || isResending || resendTimer > 0) {
    return
  }

  try {
    setIsResending(true)
    setError('')

    console.log('Resend OTP request:', email)

    const result = await resendForgotPassword(email)

    console.log('Resend OTP response:', result)

    // تصفير الكود وإعادة تشغيل العدادات
    setCode(['', '', '', '', '', ''])
    setTimeLeft(600)
    setResendTimer(60)
    setIsResendState(true)

    inputRefs.current[0]?.focus()
  } catch (error) {
    console.error('Resend OTP failed:', error)

    setError(
      error.message ||
        'Unable to resend the verification code. Please try again.'
    )
  } finally {
    setIsResending(false)
  }
}

  return (
    <div className="verify-wrapper">
      <div className="verify-card">

        {/* ==========================================
            الشريط الجانبي
        ========================================== */}
        <div className="sidebar-left">
          <div className="sidebar-brand">
            <span className="white">Skill</span>
            <span className="blue">Span</span>
          </div>

          <div className="sidebar-content">
            <h2>
              Start Your
              <br />
              Career Journey
            </h2>

            <p>
              From education to your first opportunity in
              clear, verified steps
            </p>

            <ul className="features-list">
              <li>
                <span className="icon">
                  <img
                    src="/image/2.png"
                    alt="Readiness"
                  />
                </span>
                <span>Assess your real readiness</span>
              </li>

              <li>
                <span className="icon">
                  <img
                    src="/image/3.png"
                    alt="Roadmap"
                  />
                </span>
                <span>A roadmap built for you</span>
              </li>

              <li>
                <span className="icon">
                  <img
                    src="/image/4.png"
                    alt="Projects"
                  />
                </span>
                <span>Real projects from companies</span>
              </li>

              <li>
                <span className="icon">
                  <img
                    src="/image/5.png"
                    alt="Record"
                  />
                </span>
                <span>A verified professional record</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ==========================================
            صفحة التحقق من كود إعادة تعيين كلمة المرور
        ========================================== */}
        <div className="form-right-verify">
          <div className="verify-content-box">

            {/* أيقونة البريد */}
            <div className="verify-mail-icon-box">
              <img
                src="/image/7.png"
                alt="Password reset code"
                className="verify-mail-img"
              />
            </div>

            {/* عنوان الصفحة */}
            <h1 className="verify-heading">
              Verify Your Identity
            </h1>

            {/* وصف خاص باستعادة كلمة المرور */}
            <p className="verify-subtitle reset-verify-subtitle">
              We've sent a 6-digit verification code to
              <br />
              <strong>{email}</strong>.
              <br />
              Please enter it below to proceed.
            </p>

            {/* رسالة الخطأ */}
            {error && (
              <div className="verify-error-banner">
                <span>ⓘ</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* خانات OTP */}
              <div
                className="otp-inputs-container"
                onPaste={handlePaste}
              >
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      inputRefs.current[index] = element
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(event) =>
                      handleChange(event.target.value, index)
                    }
                    onKeyDown={(event) =>
                      handleKeyDown(event, index)
                    }
                    className={`otp-input-box ${
                      error ? 'input-error' : ''
                    }`}
                    aria-label={`Verification code digit ${
                      index + 1
                    }`}
                  />
                ))}
              </div>

              {/* زر التحقق */}
              <button
                type="submit"
                className="btn-verify-code"
                disabled={isVerifying || timeLeft <= 0}
              >
                {isVerifying
                  ? 'Verifying...'
                  : 'Verify code'}
              </button>
            </form>

            {/* ==========================================
                قسم إعادة الإرسال
            ========================================== */}
            {/* ==========================================
    إعادة إرسال كود استعادة كلمة المرور
========================================== */}
          {resendTimer > 0 ? (
            <div className="verify-resend-section">
              <span>Didn't receive the code?</span>

              <span className="resend-disabled-text">
                Resend in {formatTime(resendTimer)}
              </span>
            </div>
          ) : (
            <div className="verify-resend-section">
              <span>Didn't receive the code?</span>

              <button
                type="button"
                className="verify-resend-btn"
                onClick={handleResend}
                disabled={isResending}
              >
                {isResending ? 'Sending...' : 'Resend Code'}
              </button>
            </div>
          )}
            {/* الرجوع إلى طلب إعادة التعيين */}
            <button
              type="button"
              className="landing-link-btn reset-back-btn"
              onClick={onBack}
            >
              ← Back to reset request
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyCode