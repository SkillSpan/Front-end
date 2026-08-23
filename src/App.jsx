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
import CompanyStep5 from './CompanyStep5'
import CompanyLogin from './CompanyLogin'
import CompanyForgotPassword from './CompanyForgotPassword'
import './responsive.css'
import {
  clearSession,
  getStoredUser,
  isAuthenticated,
  registerUser,
  registerOrganization,
  resendOtp,
  loginOrganization,
  loginUser,
  saveSession,
} from './api'

// ─── URL map ──────────────────────────────────────────────────────────────────
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

const getInitialPage = () =>
  pathPages[window.location.pathname] || 'landing'

// ─── Main App (needs router context) ─────────────────────────────────────────
function App() {
  const location = useLocation()
  const navigate  = useNavigate()

  const [currentPage, setCurrentPageState] = useState(getInitialPage)
  const [activeTab, setActiveTab] = useState('Home')
  const [registerData, setRegisterData] = useState({})
  const [isSubmittingRegister, setIsSubmittingRegister] = useState(false)
  const [registerSubmitError, setRegisterSubmitError] = useState('')
  const [companyData, setCompanyData] = useState({})
  const [isSubmittingCompany, setIsSubmittingCompany] = useState(false)
  const [companySubmitError, setCompanySubmitError] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [resetOtp, setResetOtp] = useState('')
  const [authUser, setAuthUser] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = ['Home', 'Features', 'How it Works', 'About Us', 'Contact']

  // Keep state in sync when user presses Back/Forward
  useEffect(() => {
    const page = pathPages[location.pathname] || 'landing'
    setCurrentPageState(page)
  }, [location.pathname])

  // Restore session from cookie on load
  useEffect(() => {
    if (isAuthenticated()) setAuthUser(getStoredUser())
  }, [])

  // Wrapper: update state + push URL
  const setCurrentPage = (page) => {
    setCurrentPageState(page)
    navigate(pagePaths[page] || '/')
  }

  // ─── Navigation helpers ──────────────────────────────────────────────────
  const handleOpenRegister              = () => setCurrentPage('registerStep1')
  const handleOpenCompanyRegister       = () => setCurrentPage('companyStep1')
  const handleNavigateToLogin           = () => setCurrentPage('login')
  const handleNavigateToCompanyLogin    = () => setCurrentPage('companyLogin')
  const handleNavigateToForgotPassword  = () => setCurrentPage('forgotPassword')
  const handleNavigateToCompanyForgotPassword = () => setCurrentPage('companyForgotPassword')

  const handleLoginSuccess = ({ user }) => {
    setAuthUser(user)
    setCurrentPage('landing')
  }

  const handleCompanyLoginSuccess = ({ user }) => {
    setAuthUser(user)
    setCurrentPage('landing')
  }

  const handleLogout = () => {
    clearSession()
    setAuthUser(null)
    setCurrentPage('landing')
  }

  // ─── Student registration flow ───────────────────────────────────────────
  const handleStep1Success = (step1Data) => {
    setRegisterData((prev) => ({ ...prev, ...step1Data }))
    setCurrentPage('registerStep2')
  }

  const handleStep2Success = (step2Data) => {
    setRegisterData((prev) => ({ ...prev, ...step2Data }))
    setCurrentPage('registerStep3')
  }

  const handleStep3Success = async (step3Data) => {
    const finalData = { ...registerData, ...step3Data }
    setRegisterData(finalData)
    setRegisterSubmitError('')
    setIsSubmittingRegister(true)
    try {
      await registerUser({
        name: finalData.fullName,
        email: finalData.email,
        password: finalData.password,
        password_confirmation: finalData.confirmPassword,
        academic_status: finalData.academicStatus,
        terms_accepted: finalData.agreeTerms ? '1' : '0',
        privacy_accepted: finalData.agreePrivacy ? '1' : '0',
      })
      setCurrentPage('emailVerification')
    } catch (err) {
      setRegisterSubmitError(err.message || 'Unable to create account. Please try again.')
    } finally {
      setIsSubmittingRegister(false)
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

  // ─── Company registration flow ───────────────────────────────────────────
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
        onNextSuccess={async (step4Data) => {
          const finalData = { ...companyData, ...step4Data }
          setCompanyData(finalData)
          setCompanySubmitError('')
          setIsSubmittingCompany(true)
          try {
            await registerOrganization({
              name: finalData.name,
              email: finalData.email,
              phone: finalData.phone,
              password: finalData.password,
              password_confirmation: finalData.confirmPassword,
              organization_name: finalData.companyName,
              organization_type: 'company',
              organization_contact_email: finalData.email,
              organization_contact_phone: finalData.phone,
              organization_website: finalData.website || undefined,
              organization_description: finalData.companyDescription,
              organization_industry: finalData.industry,
              organization_company_size: finalData.companySize,
              organization_country: finalData.country,
              organization_city: finalData.city,
              organization_address: finalData.address,
              organization_postal_code: finalData.postalCode,
              proofFile: finalData.proofFile,
            })
            setCurrentPage('companyStep5')
          } catch (err) {
            setCompanySubmitError(err.message || 'Unable to submit registration. Please try again.')
          } finally {
            setIsSubmittingCompany(false)
          }
        }}
        onBack={() => setCurrentPage('companyStep3')}
        isSubmitting={isSubmittingCompany}
        submitError={companySubmitError}
      />
    )
  }

  if (currentPage === 'companyStep5') {
    return (
      <CompanyStep5
        email={companyData.email}
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

  // ─── Student registration flow ────────────────────────────────────────────
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
        onBack={() => setCurrentPage('registerStep2')}
        isSubmitting={isSubmittingRegister}
        submitError={registerSubmitError}
      />
    )
  }

  if (currentPage === 'emailVerification') {
    return (
      <EmailVerification
        userEmail={registerData.email}
        onContinueToSetup={handleContinueToSetup}
        onResendEmail={() => resendOtp(registerData.email)}
      />
    )
  }

  if (currentPage === 'otpVerification') {
    return (
      <OtpVerification
        email={registerData.email}
        onVerifySuccess={handleVerifySuccess}
        onBack={() => setCurrentPage('emailVerification')}
      />
    )
  }

  // ─── Student login & forgot-password ─────────────────────────────────────
  if (currentPage === 'login') {
    return (
      <Login
        onSwitchToRegister={handleOpenRegister}
        onBack={() => setCurrentPage('landing')}
        onForgotPassword={handleNavigateToForgotPassword}
        onLoginSuccess={handleLoginSuccess}
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
          setResetOtp(code)
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

  // ─── Landing page ─────────────────────────────────────────────────────────
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

          {/* Solutions Dropdown — fixed: CSS hover handles everything */}
          <li className="dropdown">
            <span className="dropdown-trigger">
              Solutions <span className="arrow">▾</span>
            </span>
            <ul className="dropdown-menu">
              <li
                className="dropdown-item"
                onClick={() => { handleOpenRegister(); setMobileMenuOpen(false) }}
              >
                Students &amp; Graduates
              </li>
              <li
                className="dropdown-item"
                onClick={() => { handleOpenCompanyRegister(); setMobileMenuOpen(false) }}
              >
                Companies
              </li>
              <li
                className="dropdown-item dropdown-item--sub"
                onClick={() => { handleNavigateToCompanyLogin(); setMobileMenuOpen(false) }}
              >
                ↳ Company log in
              </li>
              <li
                className="dropdown-item"
                onClick={() => { console.log('Educational Institutions clicked'); setMobileMenuOpen(false) }}
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

// ─── Wrap with BrowserRouter ──────────────────────────────────────────────────
function AppWithRouter() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
}

export default AppWithRouter
