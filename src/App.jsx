import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import LoginPage from './pages/LoginPage'
import SignupFlow from './pages/SignupFlow'
import './App.css'

function Home() {
  return (
    <div className="min-h-screen bg-navy-950">
      <Navbar />
      <Hero />
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupFlow />} />
    </Routes>
  )
}

export default App