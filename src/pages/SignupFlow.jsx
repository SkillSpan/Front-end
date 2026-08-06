import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import ProgressSteps from '../components/auth/ProgressSteps'
import StepHeader from '../components/auth/StepHeader'
import StepNavButtons from '../components/auth/StepNavButtons'
import FormInput from '../components/auth/FormInput'
import OptionCard from '../components/auth/OptionCard'
import { CheckIcon, InfoIcon } from '../components/auth/icons'
import graduationCapIcon from '../assets/icons/icon-graduation-cap.png'
import certificateIcon from '../assets/icons/icon-certificate.png'

const TOTAL_STEPS = 3

export default function SignupFlow() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  const [account, setAccount] = useState({ fullName: '', email: '', password: '', confirmPassword: '' })
  const [academicStatus, setAcademicStatus] = useState('student')
  const [agreements, setAgreements] = useState({ terms: true, privacy: false })
  
  // 1. إضافة حالة حفظ الأخطاء
  const [errors, setErrors] = useState({})

  const bothAgreed = agreements.terms && agreements.privacy

  // 2. دالة التحقق الخاصة بالخطوة الأولى
  const validateStep1 = () => {
    const newErrors = {}

    if (!account.fullName.trim()) {
      newErrors.fullName = 'Full Name is required'
    }

    if (!account.email.trim()) {
      newErrors.email = 'Email address is required'
    } else if (!/\S+@\S+\.\S+/.test(account.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!account.password) {
      newErrors.password = 'Password is required'
    } else if (account.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!account.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (account.confirmPassword !== account.password) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const goNext = () => {
    // إيقاف التقدم إذا كانت بيانات الخطوة الأولى بها خطأ
    if (step === 1) {
      if (!validateStep1()) return
    }

    if (step < TOTAL_STEPS) {
      setStep(step + 1)
    } else {
      console.log('Sign up submitted', { account, academicStatus, agreements })
    }
  }

  const goBack = () => {
    if (step > 1) setStep(step - 1)
  }

  // دالة لتحديث قيم الحقول ومسح الخطأ بمجرد كتابة المستخدم
  const handleInputChange = (field, value) => {
    setAccount({ ...account, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  return (
    <AuthLayout>
      <ProgressSteps step={step} total={TOTAL_STEPS} />

      {step === 1 && (
        <>
          <StepHeader
            eyebrow="CREATE ACCOUNT"
            title="Let's Start With the basics"
            subtitle="This helps us set up your account correctly"
          />
          <div className="flex flex-col gap-5">
            <FormInput
              label="Full Name"
              name="fullName"
              autoComplete="name"
              value={account.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              error={errors.fullName}
            />
            <FormInput
              label="Email Address"
              type="email"
              name="email"
              autoComplete="email"
              value={account.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={errors.email}
            />
            <FormInput
              label="Password"
              type="password"
              name="password"
              autoComplete="new-password"
              value={account.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              error={errors.password}
            />
            <FormInput
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              value={account.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
            />
          </div>

          <button
            type="button"
            onClick={goNext}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-navy-950 py-4 text-lg font-extrabold text-white hover:opacity-90"
          >
            Next →
          </button>
          <p className="mt-5 text-center text-gray-500">
            Already have an account?{' '}
            <button type="button" onClick={() => navigate('/login')} className="font-bold text-sky">
              log in
            </button>
          </p>
        </>
      )}

      {step === 2 && (
        <>
          <StepHeader
            eyebrow="ACADEMIC STATUS"
            title="where are you right now?"
            subtitle="This helps us tailor your experience"
          />
          <div className="flex flex-col gap-6">
            <OptionCard
              icon={<img src={graduationCapIcon} alt="" className="h-8 w-8" />}
              title="Student"
              subtitle="Currently pursuing my degree"
              selected={academicStatus === 'student'}
              onClick={() => setAcademicStatus('student')}
            />
            <OptionCard
              icon={<img src={certificateIcon} alt="" className="h-8 w-8" />}
              title="Graduate"
              subtitle="Completed my academic studies"
              selected={academicStatus === 'graduate'}
              onClick={() => setAcademicStatus('graduate')}
            />
          </div>
          <StepNavButtons onBack={goBack} onNext={goNext} />
        </>
      )}

      {step === 3 && (
        <>
          <StepHeader eyebrow="TERMS & PRIVACY" title="One last step" />
          <div className="flex flex-col gap-5">
            <label className="flex cursor-pointer items-center gap-4 rounded-2xl bg-navy-800 px-6 py-5 font-bold text-white">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-white ${
                  agreements.terms ? 'bg-white text-navy-950' : 'bg-transparent'
                }`}
              >
                {agreements.terms && <CheckIcon className="h-4 w-4" />}
              </span>
              <input
                type="checkbox"
                className="sr-only"
                checked={agreements.terms}
                onChange={(e) => setAgreements({ ...agreements, terms: e.target.checked })}
              />
              I agree to the <span className="text-amber">Terms of Use</span>
            </label>

            <label className="flex cursor-pointer items-center gap-4 rounded-2xl bg-navy-800 px-6 py-5 font-bold text-white">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-white ${
                  agreements.privacy ? 'bg-white text-navy-950' : 'bg-transparent'
                }`}
              >
                {agreements.privacy && <CheckIcon className="h-4 w-4" />}
              </span>
              <input
                type="checkbox"
                className="sr-only"
                checked={agreements.privacy}
                onChange={(e) => setAgreements({ ...agreements, privacy: e.target.checked })}
              />
              I agree to the <span className="text-amber">Privacy Policy</span>
            </label>

            {!bothAgreed && (
              <div className="flex items-center gap-3 rounded-2xl bg-amber-soft px-6 py-4 font-bold text-navy-950">
                <InfoIcon className="h-5 w-5 shrink-0" />
                Both agreements are required to continue
              </div>
            )}
          </div>
          <StepNavButtons onBack={goBack} onNext={goNext} nextDisabled={!bothAgreed} />
        </>
      )}
    </AuthLayout>
  )
}