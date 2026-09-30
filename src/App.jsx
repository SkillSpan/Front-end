import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import './App.css'
import Landing from './Landing'
import Login from './Login'
import CompanyLogin from './CompanyLogin'
import CompanyForgotPassword from './CompanyForgotPassword'
import RegisterWizard from './RegisterWizard'
import ForgotPasswordWizard from './ForgotPasswordWizard'
import CompanyWizard from './CompanyWizard'
import Dashboard from './Dashboard'
import LogoutModal from './LogoutModal'
import { AuthProvider, useAuth } from './AuthContext'
import { logoutUser, logoutAllDevices } from './api'

// الصفحة اللي بيروح لها المستخدم بعد تسجيل الدخول
const DASHBOARD_PATH = '/dashboard'

// مفاتيح القائمة الجانبية (AppLayout) -> المسارات. أي صفحة لسا ما إلها route
// ما بتعمل شي لما تنضغط. لما تنضاف صفحة (مثلاً Career Roles) ضيف route إلها هون.
const NAV_ROUTES = {
  dashboard: DASHBOARD_PATH,
}

// بيحمي صفحات التطبيق: إذا ما في مستخدم مسجّل دخول بيرجعه على /login
function ProtectedRoute({ children }) {
  const { authUser } = useAuth()
  if (!authUser) return <Navigate to="/login" replace />
  return children
}

// بيلفّ صفحات التطبيق ويوفّر لها user + onNavigate + onLogout (مع نافذة التأكيد)
function AppPage({ render }) {
  const navigate = useNavigate()
  const { authUser, logout } = useAuth()
  const [isLogoutOpen, setIsLogoutOpen] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  const onNavigate = (key) => {
    if (NAV_ROUTES[key]) navigate(NAV_ROUTES[key])
  }

  const finishLogout = () => {
    logout()
    setIsLogoutOpen(false)
    navigate('/login', { replace: true })
  }

  // نفس منطق Landing.jsx: إذا التوكن منتهي (401) منكمّل logout محلي
  const confirm = (call) => async () => {
    setLogoutError('')
    try {
      await call()
    } catch (err) {
      if (err?.status && err.status !== 401) {
        setLogoutError(err.message || 'Something went wrong while logging out. Please try again.')
        return
      }
    }
    finishLogout()
  }

  return (
    <>
      {render({ user: authUser, onNavigate, onLogout: () => setIsLogoutOpen(true) })}
      <LogoutModal
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onConfirm={confirm(logoutUser)}
        onConfirmAllDevices={confirm(logoutAllDevices)}
        error={logoutError}
      />
    </>
  )
}

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  return (
    <Login
      onSwitchToRegister={() => navigate('/register')}
      onBack={() => navigate('/')}
      onForgotPassword={() => navigate('/forgot-password')}
      onLoginSuccess={({ user }) => {
        login(user)
        navigate(DASHBOARD_PATH, { replace: true })
      }}
      onNewGoogleUser={(credential) =>
        navigate('/register/status', { state: { googleCredential: credential } })
      }
    />
  )
}

function CompanyLoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  return (
    <CompanyLogin
      onBack={() => navigate('/')}
      onSwitchToRegister={() => navigate('/company/register')}
      onSwitchToStudentLogin={() => navigate('/login')}
      onForgotPassword={() => navigate('/company/forgot-password')}
      onLoginSuccess={({ user }) => {
        login(user)
        navigate('/')
      }}
    />
  )
}

function CompanyForgotPasswordPage() {
  const navigate = useNavigate()
  return <CompanyForgotPassword onBackToLogin={() => navigate('/company/login')} />
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register/*" element={<RegisterWizard />} />
        <Route path="/forgot-password/*" element={<ForgotPasswordWizard />} />
        <Route path="/company/login" element={<CompanyLoginPage />} />
        <Route path="/company/register/*" element={<CompanyWizard />} />
        <Route path="/company/forgot-password" element={<CompanyForgotPasswordPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppPage render={(p) => <Dashboard {...p} />} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App