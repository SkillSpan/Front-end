import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

const navItems = ['Home', 'Features', 'How it Works', 'About Us', 'Contact'];

function Landing() {
  const [activeTab, setActiveTab] = useState('Home');
  const navigate = useNavigate();
  const { authUser, logout } = useAuth();

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="navbar fade-in-down">
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

        <ul className="nav-links">
          {navItems.slice(0, 3).map((item) => (
            <li 
              key={item} 
              className={activeTab === item ? 'active' : ''}
              onClick={() => setActiveTab(item)}
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
                onClick={() => navigate('/register/account')}
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
                onClick={() => navigate('/company/register/account')}
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
                onClick={() => navigate('/company/login')} 
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
              onClick={() => setActiveTab(item)}
            >
              {item}
            </li>
          ))}
        </ul>

        <div className="nav-buttons">
          {authUser ? (
            <>
              <span style={{ color: '#e2e8f0', fontSize: '14px', marginRight: '4px' }}>
                Hi, {authUser.name || authUser.email}
              </span>
              <button className="btn log-in" onClick={logout}>log out</button>
            </>
          ) : (
            <>
              <button className="btn log-in" onClick={() => navigate('/login')}>log in</button>
              <button className="btn get-started" onClick={() => navigate('/register/account')}>
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
            <button className="btn primary-gradient" onClick={() => navigate('/register/account')}>
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

export default Landing;
