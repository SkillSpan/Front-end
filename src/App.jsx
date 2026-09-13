import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import './App.css'
import Landing from './Landing'
import Login from './Login'
import CompanyLogin from './CompanyLogin'
import CompanyForgotPassword from './CompanyForgotPassword'
import RegisterWizard from './RegisterWizard'
import ForgotPasswordWizard from './ForgotPasswordWizard'
import CompanyWizard from './CompanyWizard'
import SessionExpired from './SessionExpired'
import Dashboard from './Dashboard'
import SkillMatrix from './skillmatrix/SkillMatrix'
import CareerRoles from './careerroles/CareerRoles'
import { AuthProvider, useAuth } from './AuthContext'

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
        navigate('/dashboard')
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
        navigate('/dashboard')
      }}
    />
  )
}

function CompanyForgotPasswordPage() {
  const navigate = useNavigate()
  return <CompanyForgotPassword onBackToLogin={() => navigate('/company/login')} />
}

// Simple in-app nav map for the dashboard sidebar - most of these targets
// don't have their own screens/APIs yet, so unmapped keys just stay put.
const NAV_ROUTES = {
  dashboard: '/dashboard',
  'skill-matrix': '/skill-matrix',
  roles: '/career-roles',
}

function DashboardPage() {
  const navigate = useNavigate()
  const { authUser, logout } = useAuth()
  return (
    <Dashboard
      user={authUser}
      onLogout={() => {
        logout()
        navigate('/')
      }}
      onNavigate={(key) => {
        if (NAV_ROUTES[key]) navigate(NAV_ROUTES[key])
      }}
    />
  )
}

function SkillMatrixPage() {
  const navigate = useNavigate()
  return <SkillMatrix onNavigate={(key) => { if (NAV_ROUTES[key]) navigate(NAV_ROUTES[key]) }} />
}

function CareerRolesPage() {
  const navigate = useNavigate()
  const { authUser, logout } = useAuth()
  return (
    <CareerRoles
      user={authUser}
      onLogout={() => {
        logout()
        navigate('/')
      }}
      onNavigate={(key) => { if (NAV_ROUTES[key]) navigate(NAV_ROUTES[key]) }}
    />
  )
}

function RequireAuth({ children }) {
  const { authUser } = useAuth()
  if (!authUser) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const navigate = useNavigate()
  const { sessionExpired, dismissSessionExpired } = useAuth()

  // Full-page takeover, not a modal on top of whatever was open - a
  // 401-expired token means nothing else on screen can be trusted/acted on
  // anyway (see api.js `onSessionExpired`).
  if (sessionExpired) {
    return (
      <SessionExpired
        onLoginAgain={() => {
          dismissSessionExpired()
          navigate('/login')
        }}
        onGoToLanding={() => {
          dismissSessionExpired()
          navigate('/')
        }}
      />
    )
  }

  return (
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
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/skill-matrix"
        element={
          <RequireAuth>
            <SkillMatrixPage />
          </RequireAuth>
        }
      />
      <Route
        path="/career-roles"
        element={
          <RequireAuth>
            <CareerRolesPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
