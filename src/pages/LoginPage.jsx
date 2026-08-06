import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import { GoogleIcon } from '../components/auth/icons'
import brandMark from '../assets/icons/icon-career-growth.png'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}

    // Validation للبريد الإلكتروني
    if (!email.trim()) {
      newErrors.email = 'Email address is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Validation لكلمة المرور
    if (!password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      console.log('Log in submitted', { email, password })
      // wire this up to your auth API
    }
  }

  return (
    <AuthLayout contentClassName="items-center">
      <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col items-center text-center">
        <img src={brandMark} alt="SkillSpan" className="h-24 w-24 object-contain" />
        <h1 className="mt-4 text-3xl font-semibold text-navy-950">Log in to your account</h1>

        <button
          type="button"
          className="mt-9 flex w-full items-center justify-center gap-3 rounded-2xl bg-navy-800 py-4 text-lg font-semibold text-white hover:opacity-90"
        >
          <GoogleIcon className="h-6 w-6" />
          Google
        </button>

        <div className="mt-8 w-full text-left">
          <label htmlFor="login-email" className="text-sm font-semibold text-navy-950">
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors({ ...errors, email: '' })
            }}
            className={`mt-2 w-full rounded-2xl border-2 bg-ice px-5 py-4 text-navy-800/70 placeholder:text-navy-800/50 focus:outline-none focus:ring-2 focus:ring-cyan ${
              errors.email ? 'border-red-500' : 'border-sky'
            }`}
          />
          {errors.email && <p className="mt-1 text-xs font-semibold text-red-500">{errors.email}</p>}
        </div>

        <div className="mt-5 w-full text-left">
          <label htmlFor="login-password" className="text-sm font-semibold text-navy-950">
            Enter your password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) setErrors({ ...errors, password: '' })
            }}
            className={`mt-2 w-full rounded-2xl border-2 bg-ice px-5 py-4 text-navy-800/70 placeholder:text-navy-800/50 focus:outline-none focus:ring-2 focus:ring-cyan ${
              errors.password ? 'border-red-500' : 'border-sky'
            }`}
          />
          {errors.password && <p className="mt-1 text-xs font-semibold text-red-500">{errors.password}</p>}
        </div>

        <button
          type="submit"
          className="mt-9 w-full rounded-2xl bg-navy-950 py-4 text-lg font-semibold text-white hover:opacity-90"
        >
          Log in
        </button>

        <p className="mt-6 text-gray-500">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-bold text-sky">
            Sign up
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}