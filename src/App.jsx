import { useEffect, useState } from 'react'
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import RegisterStep1 from './RegisterStep1'
import RegisterStep2 from './RegisterStep2'
import RegisterStep3 from './RegisterStep3'
import EmailVerification from './EmailVerification'
import OtpVerification from './OtpVerification'
import Login from './Login'
import ForgotPassword from './ForgotPassword'
import VerifyCode from './VerifyCode'
import ResetPassword from './ResetPassword'
import ResetSuccess from './ResetSuccess'
import CompanyStep1 from './CompanyStep1'
import CompanyStep2 from './CompanyStep2'
import CompanyStep3 from './CompanyStep3'
import CompanyStep4 from './CompanyStep4'
import CompanyStep5 from './CompanyStep5' // استيراد الخطوة الخامسة والأخيرة للشركات
import CompanyLogin from './CompanyLogin'
import CompanyForgotPassword from './CompanyForgotPassword'
import './responsive.css'
import {
  clearSession,
  getStoredUser,
  isAuthenticated,
  registerUser,
  resendOtp,
} from './api'

function App() {
    const location = useLocation()
  const navigate = useNavigate()


  const [activeTab, setActiveTab] = useState('Home')
  const [registerData, setRegisterData] = useState({})
  const [registrationError, setRegistrationError] = useState('')
  const [companyData, setCompanyData] = useState({}) // لتخزين بيانات الشركات
  const [resetEmail, setResetEmail] = useState('')
  const [resetOtp, setResetOtp] = useState('')
  const [authUser, setAuthUser] = useState(null) // logged-in organization user (from cookie session)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
const getInitialPage = () => {
  const pages = {
    '/': 'landing',
    '/login': 'login',
    '/register': 'registerStep1',
    '/register/step-2': 'registerStep2',
    '/register/step-3': 'registerStep3',
    '/verify-email': 'emailVerification',
    '/verify-otp': 'otpVerification',
    '/forgot-password': 'forgotPassword',
    '/verify-code': 'verifyCode',
    '/reset-password': 'resetPassword',
    '/reset-success': 'resetSuccess',
    '/company/register': 'companyStep1',
    '/company/register/step-2': 'companyStep2',
    '/company/register/step-3': 'companyStep3',
    '/company/register/step-4': 'companyStep4',
    '/company/register/step-5': 'companyStep5',
    '/company/login': 'companyLogin',
    '/company/forgot-password': 'companyForgotPassword',
  }

  return pages[window.location.pathname] || 'landing'
}

const [currentPage, setCurrentPageState] = useState(getInitialPage)
  const navItems = ['Home', 'Features', 'How it Works', 'About Us', 'Contact']
const pagePaths = {
  landing: '/',
  login: '/login',
  registerStep1: '/register',
  registerStep2: '/register/step-2',
  registerStep3: '/register/step-3',
  emailVerification: '/verify-email',
  otpVerification: '/verify-otp',
  forgotPassword: '/forgot-password',
  verifyCode: '/verify-code',
  resetPassword: '/reset-password',
  resetSuccess: '/reset-success',
  companyStep1: '/company/register',
  companyStep2: '/company/register/step-2',
  companyStep3: '/company/register/step-3',
  companyStep4: '/company/register/step-4',
  companyStep5: '/company/register/step-5',
  companyLogin: '/company/login',
  companyForgotPassword: '/company/forgot-password',
}

const pathPages = Object.fromEntries(
  Object.entries(pagePaths).map(([page, path]) => [path, page])
)

const setCurrentPage = (page) => {
  setCurrentPageState(page)
  navigate(pagePaths[page] || '/')
}


useEffect(() => {
  const page = pathPages[location.pathname] || 'landing'
  setCurrentPageState(page)
}, [location.pathname])


  // Restore session from the secure cookie on load (see api.js / utils/cookies.js)
  useEffect(() => {
    if (isAuthenticated()) {
      setAuthUser(getStoredUser())
    }
  }, [])

  const handleOpenRegister = () => setCurrentPage('registerStep1')
  const handleOpenCompanyRegister = () => setCurrentPage('companyStep1')
  const handleNavigateToLogin = () => setCurrentPage('login')
  const handleNavigateToCompanyLogin = () => setCurrentPage('companyLogin')
  const handleNavigateToForgotPassword = () => setCurrentPage('forgotPassword')
  const handleNavigateToCompanyForgotPassword = () => setCurrentPage('companyForgotPassword')

  const handleCompanyLoginSuccess = ({ user }) => {
    setAuthUser(user)
    setCurrentPage('landing')
  }

  const handleStudentLoginSuccess = ({ user }) => {
    setAuthUser(user)
    setCurrentPage('landing')
  }

  const handleLogout = () => {
    clearSession()
    setAuthUser(null)
    setCurrentPage('landing')
  }

  const handleStep1Success = (step1Data) => {
  setRegistrationError('')
  setRegisterData((prev) => ({ ...prev, ...step1Data }))
  setCurrentPage('registerStep2')
}

  const handleStep2Success = (step2Data) => {
  setRegistrationError('')
  setRegisterData((prev) => ({ ...prev, ...step2Data }))
  setCurrentPage('registerStep3')
}

  const handleStep3Success = async (step3Data) => {
  const finalData = {
    ...registerData,
    ...step3Data,
  }

  setRegisterData(finalData)
  setRegistrationError('')

  try {
    const payload = {
      name: finalData.fullName.trim(),
      email: finalData.email.trim(),
      password: finalData.password,
      password_confirmation: finalData.confirmPassword,
      terms_accepted: finalData.agreeTerms,
      privacy_accepted: finalData.agreePrivacy,
      academic_status: finalData.academicStatus,
    }

    await registerUser(payload)

    setCurrentPage('emailVerification')
  } catch (error) {
    console.error('Registration failed:', error)

    setRegistrationError(
      error.message || 'Registration failed. Please try again.'
    )

    setCurrentPage('registerStep3')
  }
}


  const handleContinueToSetup = () => setCurrentPage('otpVerification')

  const handleVerifySuccess = (otpCode) => {
    console.log('OTP Verified Successfully:', otpCode)
    setCurrentPage('login')
  }

  const handleContinueToVerify = (email) => {
    setResetEmail(email)
    setCurrentPage('verifyCode')
  }

  // مسار تسجيل الشركات
  if (currentPage === 'companyStep1') {
    return (
      <CompanyStep1 
        onNextSuccess={(step1Data) => {
          setCompanyData((prev) => ({ ...prev, ...step1Data }))
          setCurrentPage('companyStep2')
        }}
        onNavigateToLogin={handleNavigateToCompanyLogin}
        onBack={() => setCurrentPage('landing')}
      />
    )
  }

  if (currentPage === 'companyStep2') {
    return (
      <CompanyStep2 
        onNextSuccess={(step2Data) => {
          setCompanyData((prev) => ({ ...prev, ...step2Data }))
          setCurrentPage('companyStep3')
        }}
        onBack={() => setCurrentPage('companyStep1')}
        onNavigateToLogin={handleNavigateToCompanyLogin}
      />
    )
  }

  if (currentPage === 'companyStep3') {
    return (
      <CompanyStep3 
        onNextSuccess={(step3Data) => {
          setCompanyData((prev) => ({ ...prev, ...step3Data }))
          setCurrentPage('companyStep4')
        }}
        onBack={() => setCurrentPage('companyStep2')}
        onNavigateToLogin={handleNavigateToCompanyLogin}
      />
    )
  }

  if (currentPage === 'companyStep4') {
    return (
      <CompanyStep4 
        onNextSuccess={(step4Data) => {
          setCompanyData((prev) => ({ ...prev, ...step4Data }))
          setCurrentPage('companyStep5') // الانتقال للخطوة الخامسة والأخيرة
        }}
        onBack={() => setCurrentPage('companyStep3')}
        onNavigateToLogin={handleNavigateToCompanyLogin}
      />
    )
  }

  if (currentPage === 'companyStep5') {
    return (
      <CompanyStep5 
        onNavigateToLanding={() => {
          console.log('Final Complete Company Data Submitted:', companyData)
          setCurrentPage('landing') // العودة للصفحة الرئيسية عند الانتهاء
        }}
        onNavigateToLogin={handleNavigateToCompanyLogin}
      />
    )
  }

  if (currentPage === 'companyLogin') {
    return (
      <CompanyLogin
        onBack={() => setCurrentPage('landing')}
        onSwitchToRegister={handleOpenCompanyRegister}
        onSwitchToStudentLogin={handleNavigateToLogin}
        onForgotPassword={handleNavigateToCompanyForgotPassword}
        onLoginSuccess={handleCompanyLoginSuccess}
      />
    )
  }

  if (currentPage === 'companyForgotPassword') {
    return (
      <CompanyForgotPassword
        onBackToLogin={handleNavigateToCompanyLogin}
      />
    )
  }

  // مسار تسجيل الطلاب والمستخدمين
  if (currentPage === 'registerStep1') {
    return (
      <RegisterStep1 
        onNextSuccess={handleStep1Success}
        onNavigateToLogin={handleNavigateToLogin}
      />
    )
  }

  if (currentPage === 'registerStep2') {
    return (
      <RegisterStep2 
        onNextSuccess={handleStep2Success}
        onBack={() => setCurrentPage('registerStep1')}
      />
    )
  }

  if (currentPage === 'registerStep3') {
    return (
      <RegisterStep3 
        onNextSuccess={handleStep3Success}
        serverError={registrationError}
        onBack={() => setCurrentPage('registerStep2')}
      />
    )
  }

  if (currentPage === 'emailVerification') {
    return (
      <EmailVerification 
        userEmail={registerData.email}
        onContinueToSetup={handleContinueToSetup}
        onResendEmail={async () => {
        try {
          await resendOtp(registerData.email)
          alert('A new verification code has been sent to your email.')
        } catch (error) {
          alert(error.message || 'Unable to resend the verification code.')
        }
       }}
     />
  )
}

  if (currentPage === 'otpVerification') {
  return (
    <OtpVerification 
      userEmail={registerData.email}
      onVerifySuccess={handleVerifySuccess}
      onBack={() => setCurrentPage('emailVerification')}
      onContinueToLogin={handleNavigateToLogin}
    />
  )
}

  if (currentPage === 'login') {
    return (
      <Login 
        onSwitchToRegister={handleOpenRegister}
        onBack={() => setCurrentPage('landing')}
        onForgotPassword={handleNavigateToForgotPassword}
        onLoginSuccess={handleStudentLoginSuccess}
      />
    )
  }

  if (currentPage === 'forgotPassword') {
    return (
      <ForgotPassword 
        onBackToLogin={handleNavigateToLogin}
        onContinueToVerify={handleContinueToVerify}
      />
    )
  }

  if (currentPage === 'verifyCode') {
  return (
    <VerifyCode
      email={resetEmail}
      onBack={() => setCurrentPage('forgotPassword')}
      onSuccess={(code) => {
        // حفظ رمز الاستعادة مؤقتًا للمرحلة التالية
        setResetOtp(code)

        // الانتقال إلى صفحة تغيير كلمة المرور
        setCurrentPage('resetPassword')
      }}
    />
  )
}
  if (currentPage === 'resetPassword') {
  return (
    <ResetPassword
      email={resetEmail}
      otp={resetOtp}
      onBackToVerify={() => setCurrentPage('verifyCode')}
      onSuccess={() => setCurrentPage('resetSuccess')}
    />
  )
}

  if (currentPage === 'resetSuccess') {
    return (
      <ResetSuccess 
        onGoToLogin={handleNavigateToLogin}
      />
    )
  }

  // الصفحة الرئيسية (Landing Page)
  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="navbar fade-in-down">
        <div className="navbar-top-row">
          <div className="logo-text">
            <img 
              src="/image/1.png" 
              alt="SkillSpan Logo" 
              className="logo-img" 
            />
            <span className="brand">
              <span className="white">Skill</span><span className="blue">Span</span>
            </span>
          </div>

          <button
            type="button"
            className={`nav-burger ${mobileMenuOpen ? 'open' : ''}`}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <ul className={`nav-links ${mobileMenuOpen ? 'nav-links-open' : ''}`}>
          {navItems.slice(0, 3).map((item) => (
            <li 
              key={item} 
              className={activeTab === item ? 'active' : ''}
              onClick={() => { setActiveTab(item); setMobileMenuOpen(false) }}
            >
              {item}
            </li>
          ))}

          {/* Solutions Dropdown */}
          <li className="dropdown" style={{ position: 'relative', cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              Solutions <span className="arrow">▾</span>
            </span>
            <ul className="dropdown-menu" style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '8px 0',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
              listStyle: 'none',
              minWidth: '220px',
              zIndex: 1000
            }}>
              <li 
                onClick={handleOpenRegister} 
                style={{
                  padding: '10px 16px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(59, 130, 246, 0.15)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                Students & Graduates
              </li>
              <li 
                onClick={handleOpenCompanyRegister} 
                style={{
                  padding: '10px 16px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(59, 130, 246, 0.15)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                Companies
              </li>
              <li 
                onClick={handleNavigateToCompanyLogin} 
                style={{
                  padding: '10px 16px',
                  color: '#93c5fd',
                  fontSize: '13px',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(59, 130, 246, 0.15)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                ↳ Company log in
              </li>
              <li 
                onClick={() => {
                  console.log('Educational Institutions clicked')
                }} 
                style={{
                  padding: '10px 16px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(59, 130, 246, 0.15)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                Educational Institutions
              </li>
            </ul>
          </li>

          {navItems.slice(3).map((item) => (
            <li 
              key={item} 
              className={activeTab === item ? 'active' : ''}
              onClick={() => { setActiveTab(item); setMobileMenuOpen(false) }}
            >
              {item}
            </li>
          ))}
        </ul>

        <div className={`nav-buttons ${mobileMenuOpen ? 'nav-buttons-open' : ''}`}>
          {authUser ? (
            <>
              <span style={{ color: '#e2e8f0', fontSize: '14px', marginRight: '4px' }}>
                Hi, {authUser.name || authUser.email}
              </span>
              <button className="btn log-in" onClick={() => { handleLogout(); setMobileMenuOpen(false) }}>log out</button>
            </>
          ) : (
            <>
              <button className="btn log-in" onClick={() => { handleNavigateToLogin(); setMobileMenuOpen(false) }}>log in</button>
              <button className="btn get-started" onClick={() => { handleOpenRegister(); setMobileMenuOpen(false) }}>
                Get Started →
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-text fade-in-left">
          <div className="highlight">EMPOWERING FUTURES</div>
          <h1>
            Bridge Your Skills<br />
            to <span className="blue-text">Real Careers</span>
          </h1>
          <p>
            SkillSpan helps students and graduates unlock their
            potential, build real-world projects, and get discovered
            by companies looking for top talent
          </p>
          <div className="hero-buttons">
            <button className="btn primary-gradient" onClick={handleOpenRegister}>
              Start Your Journey →
            </button>
            <button className="btn outline-glow">
              Explore Platform <span className="play-icon">▶</span>
            </button>
          </div>
        </div>

        {/* Illustration */}
        <div className="hero-illustration fade-in-right">
          <img src="/image/12.jpg" alt="SkillSpan Illustration" className="floating-img" />
        </div>
      </section>
    </div>
  )
}
function AppWithRouter() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
}
export default AppWithRouter