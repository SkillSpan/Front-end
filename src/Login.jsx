import React, { useState } from 'react'
import './Login.css'
import {
  loginUser,
  loginWithGoogle,
  saveSession,
} from './api'

const Login = ({
  onSwitchToRegister,
  onBack,
  onForgotPassword,
  onLoginSuccess,
}) =>  {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)

  // ==========================================
  // تسجيل الدخول باستخدام Google
  // ==========================================
  const handleGoogleLogin = () => {
    if (!window.google?.accounts?.id) {
      setErrors({
        general: 'Google Login is not ready yet. Please try again.',
      })
      return
    }

    setIsGoogleSubmitting(true)
    setErrors({})

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,

      callback: async (response) => {
        try {
          const result = await loginWithGoogle(
            response.credential,
            false,
            false
          )

          const { user, organizations, token } =
            result.data || {}

          // حفظ جلسة المستخدم بعد نجاح Google Login
          saveSession({
            token,
            user,
            organizations,
          })

          setErrors({})
          alert('Google Login Successful!')
        } catch (error) {
          setErrors({
            general:
              error.message ||
              'Unable to login with Google. Please try again.',
          })
        } finally {
          setIsGoogleSubmitting(false)
        }
      },
    })

    window.google.accounts.id.prompt((notification) => {
      if (
        notification.isNotDisplayed() ||
        notification.isSkippedMoment()
      ) {
        setIsGoogleSubmitting(false)
      }
    })
  }

  // ==========================================
  // تحديث قيم حقول تسجيل الدخول
  // ==========================================
  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // إزالة الخطأ أثناء بدء الكتابة
    setErrors((prev) => ({
      ...prev,
      [name]: '',
      general: '',
    }))
  }

  // ==========================================
  // تسجيل الدخول العادي
  // ==========================================
  const handleLogin = async (e) => {
    e.preventDefault()

    const newErrors = {}

    // التحقق من البريد الإلكتروني
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // التحقق من كلمة المرور
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    // إيقاف الطلب إذا كانت البيانات غير صحيحة
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      setIsSubmitting(true)
      setErrors({})

      // إرسال بيانات الدخول للـBackend
      const result = await loginUser(
        formData.email.trim(),
        formData.password
      )

      const { user, token, organizations } =
        result.data || {}

      // حفظ بيانات الجلسة
      saveSession({
        token,
        user,
        organizations,
      })

      if (typeof onLoginSuccess === 'function') {
         onLoginSuccess({ user, organizations })
      }

    } catch (error) {
      // عرض رسالة الخطأ القادمة من الـBackend
      setErrors({
        general:
          error.message ||
          'Invalid email or password. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">

        {/* الشريط الجانبي */}
        <div className="sidebar-left">
          <div className="sidebar-brand">
            <span className="white">Skill</span>
            <span className="blue">Span</span>
          </div>

          <div className="sidebar-content">
            <h2>Start Your Career Journey</h2>

            <p>
              From education to your first opportunity
              in clear, verified steps
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

        {/* نموذج تسجيل الدخول */}
        <div className="form-right">

          {onBack && (
            <button
              type="button"
              className="back-to-home-btn"
              onClick={onBack}
            >
              ← Back to Home
            </button>
          )}

          <h1 className="login-heading">
            Log in to your account
          </h1>

          <p className="new-here-text">
            New here?{' '}
            <span
              onClick={onSwitchToRegister}
              className="link-action"
            >
              Create a new account
            </span>
          </p>

          {/* Google Login */}
          <button
            className="btn-google"
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleSubmitting || isSubmitting}
          >
            <span>G</span>
            {isGoogleSubmitting
              ? 'Connecting...'
              : 'Google'}
          </button>

          {/* الخطأ العام */}
          {errors.general && (
            <div className="error-alert">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleLogin} noValidate>

            {/* البريد الإلكتروني */}
            <div className="input-group">
              <label>Email Address</label>

              <input
                name="email"
                type="email"
                className={`login-input ${
                  errors.email ? 'input-error' : ''
                }`}
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />

              {errors.email && (
                <span className="error-text">
                  {errors.email}
                </span>
              )}
            </div>

            {/* كلمة المرور */}
            <div className="input-group">
              <label>Enter your password</label>

              <input
                name="password"
                type="password"
                className={`login-input ${
                  errors.password ? 'input-error' : ''
                }`}
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
              />

              {errors.password && (
                <span className="error-text">
                  {errors.password}
                </span>
              )}
            </div>

            {/* نسيت كلمة المرور */}
            <div className="forgot-container">
              <span
                className="link-action"
                onClick={onForgotPassword}
              >
                Forgot password? Reset password
              </span>
            </div>

            {/* زر تسجيل الدخول */}
            <button
              type="submit"
              className="btn-login"
              disabled={
                isSubmitting || isGoogleSubmitting
              }
            >
              {isSubmitting
                ? 'Logging in...'
                : 'Log in'}
            </button>

          </form>
        </div>
      </div>
    </div>
  )
}

export default Login