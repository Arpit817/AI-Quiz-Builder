import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, ArrowRight, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  }

  function handleSectionClick(sectionId) {
    setMobileMenuOpen(false);
    if (location.pathname === '/') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    navigate(`/#${sectionId}`);
  }

  return (
    <nav className="navbar">
      <div className="container navbar__inner">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/" className="navbar__brand" onClick={() => setMobileMenuOpen(false)}>
            <span className="navbar__brand-badge">Q</span>
            <span className="navbar__brand-text">
              AI Quiz Builder
            </span>
          </Link>

          <div className="navbar__nav">
            <Link to="/generate" className="navbar__link">Generate</Link>
            <button
              type="button"
              className="navbar__link"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => handleSectionClick('playground')}
            >
              Playground
            </button>
            <button
              type="button"
              className="navbar__link"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => handleSectionClick('categories')}
            >
              Topics
            </button>
            <button
              type="button"
              className="navbar__link"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => handleSectionClick('workflow')}
            >
              How it works
            </button>
            <button
              type="button"
              className="navbar__link"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => handleSectionClick('faq')}
            >
              FAQ
            </button>
          </div>
        </div>

        <div className="navbar__right">
          <button
            className="btn btn--icon"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {user ? (
            <>
              <span className="navbar__user">
                {user.username}
              </span>
              <button className="btn btn--ghost btn--sm" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn--ghost btn--sm">Log in</Link>
              <Link to="/register" className="btn btn--primary btn--sm">
                <span>Sign up</span>
                <ArrowRight size={13} />
              </Link>
            </>
          )}

          <button
            type="button"
            className="btn btn--icon navbar__menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav" role="menu">
          <Link
            to="/generate"
            className="mobile-nav__link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Generate Quiz
          </Link>
          <a
            className="mobile-nav__link"
            onClick={() => handleSectionClick('playground')}
          >
            Interactive Playground
          </a>
          <a
            className="mobile-nav__link"
            onClick={() => handleSectionClick('categories')}
          >
            Browse Topics
          </a>
          <a
            className="mobile-nav__link"
            onClick={() => handleSectionClick('workflow')}
          >
            How It Works
          </a>
          <a
            className="mobile-nav__link"
            onClick={() => handleSectionClick('faq')}
          >
            Frequently Asked Questions
          </a>
        </div>
      )}
    </nav>
  );
}
