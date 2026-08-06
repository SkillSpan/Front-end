import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import LoginPage from './pages/LoginPage'
import SignupFlow from './pages/SignupFlow'

function Home() {
  return (
    <div className="min-h-screen bg-navy-950">
      <Navbar />
      <Hero />
      {/* Additional sections (About, Features, How it Works, Pricing...)
          can be added here once their designs are ready. */}
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupFlow />} />
    </Routes>
  )
}
