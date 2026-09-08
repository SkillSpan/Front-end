import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import './App.css'
import Landing from './Landing'
import Login from './Login'
import CompanyLogin from './CompanyLogin'
import CompanyForgotPassword from './CompanyForgotPassword'
import RegisterWizard from './RegisterWizard'
import ForgotPasswordWizard from './ForgotPasswordWizard'
import CompanyWizard from './CompanyWizard'
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
        navigate('/')
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
