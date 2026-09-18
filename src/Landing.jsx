import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import LogoutModal from './LogoutModal';
import { logoutUser, logoutAllDevices } from './api';

const navItems = ['Home', 'Features', 'How it Works', 'About Us', 'Contact'];

function Landing() {
  const [activeTab, setActiveTab] = useState('Home');
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSolutionsOpen, setIsSolutionsOpen] = useState(false);
  const solutionsRef = useRef(null);
  const navigate = useNavigate();
  const { authUser, logout } = useAuth();

  // Close the "Solutions" dropdown on outside click/tap, since we no
  // longer rely on CSS :hover / :focus-within (unreliable on touch).
  useEffect(() => {
    if (!isSolutionsOpen) return;
    const handleOutsideClick = (e) => {
      if (solutionsRef.current && !solutionsRef.current.contains(e.target)) {
        setIsSolutionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isSolutionsOpen]);

  const handleConfirmLogout = async () => {
    setLogoutError('');
    try {
      await logoutUser();
    } catch (err) {
      // If the token is already invalid/expired (401) the session is
      // effectively dead anyway - proceed with a local logout instead of
      // blocking the user. For anything else (network, 500...), surface it.
      if (err?.status && err.status !== 401) {
        setLogoutError(err.message || 'Something went wrong while logging out. Please try again.');
        return;
      }
    }
    logout();
    setIsLogoutOpen(false);
  };

  const handleConfirmLogoutAllDevices = async () => {
    setLogoutError('');
    try {
      await logoutAllDevices();
    } catch (err) {
      if (err?.status && err.status !== 401) {
        setLogoutError(err.message || 'Something went wrong while logging out. Please try again.');
        return;
      }
    }
    logout();
    setIsLogoutOpen(false);
  };

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
            className={`nav-burger ${isMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMenuOpen((open) => { if (open) setIsSolutionsOpen(false); return !open; })}
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        <ul className={`nav-links ${isMenuOpen ? 'nav-links-open' : ''}`}>
          {navItems.slice(0, 3).map((item) => (
            <li 
              key={item} 
              className={activeTab === item ? 'active' : ''}
              onClick={() => { setActiveTab(item); setIsMenuOpen(false); }}
            >
              {item}
            </li>
          ))}

          {/* Solutions Dropdown */}
          <li
            className={`dropdown ${isSolutionsOpen ? 'dropdown-open' : ''}`}
            style={{ position: 'relative' }}
            ref={solutionsRef}
          >
            <span
              style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); setIsSolutionsOpen((open) => !open); }}
            >
              Solutions <span className="arrow">▾</span>
            </span>
            <ul className={`dropdown-menu ${isSolutionsOpen ? 'dropdown-menu-open' : ''}`}>
              <li 
                onClick={() => { navigate('/register/account'); setIsMenuOpen(false); setIsSolutionsOpen(false); }} 
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
                onClick={() => { navigate('/company/register/account'); setIsMenuOpen(false); setIsSolutionsOpen(false); }} 
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
                onClick={() => { navigate('/company/login'); setIsMenuOpen(false); setIsSolutionsOpen(false); }} 
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
                  setIsMenuOpen(false)
                  setIsSolutionsOpen(false)
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
              onClick={() => { setActiveTab(item); setIsMenuOpen(false); }}
            >
              {item}
            </li>
          ))}
        </ul>

        <div className={`nav-buttons ${isMenuOpen ? 'nav-buttons-open' : ''}`}>
          {authUser ? (
            <>
              <span style={{ color: '#e2e8f0', fontSize: '14px', marginRight: '4px' }}>
                Hi, {authUser.name || authUser.email}
              </span>
              <button className="btn log-in" onClick={() => { setIsLogoutOpen(true); setIsMenuOpen(false); }}>log out</button>
            </>
          ) : (
            <>
              <button className="btn log-in" onClick={() => { navigate('/login'); setIsMenuOpen(false); }}>log in</button>
              <button className="btn get-started" onClick={() => { navigate('/register/account'); setIsMenuOpen(false); }}>
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

      <LogoutModal
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onConfirm={handleConfirmLogout}
        onConfirmAllDevices={handleConfirmLogoutAllDevices}
        error={logoutError}
      />
    </div>
  )
}

export default Landing;
