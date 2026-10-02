import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer-extended">
      <div className="container">
        <div className="footer-extended__grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span className="navbar__brand-badge" style={{ width: '24px', height: '24px', fontSize: '0.8125rem' }}>Q</span>
              <strong style={{ fontSize: '1rem', letterSpacing: '-0.015em' }}>AI Quiz Builder</strong>
            </div>
            <p className="footer-extended__brand-desc">
              Practice interactive quizzes on any subject with instant scoring and detailed answer explanations.
            </p>
            <div className="footer-extended__status">
              <span className="footer-extended__status-dot" />
              <span>All Systems Operational</span>
            </div>
          </div>

          <div>
            <div className="footer-col__title">Explore</div>
            <ul className="footer-col__list">
              <li><Link to="/generate">Make a Quiz</Link></li>
              <li><a href="/#playground">Try a Question</a></li>
              <li><a href="/#categories">Popular Topics</a></li>
              <li><a href="/#workflow">How It Works</a></li>
              <li><a href="/#faq">FAQ</a></li>
            </ul>
          </div>

          <div>
            <div className="footer-col__title">Information</div>
            <ul className="footer-col__list">
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><a href="/#faq">Help &amp; Answers</a></li>
            </ul>
          </div>

          <div>
            <div className="footer-col__title">Built With</div>
            <ul className="footer-col__list">
              <li><span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>React &amp; Vite</span></li>
              <li><span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Node.js &amp; Express</span></li>
              <li><span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>MongoDB</span></li>
              <li><span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Google Gemini &amp; OpenAI</span></li>
            </ul>
          </div>
        </div>

        <div className="footer-extended__bottom">
          <p>&copy; {year} AI Quiz Builder. All rights reserved.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-primary)' }}>
              <Sparkles size={14} />
              <span>Instant feedback &amp; explanations</span>
            </span>
            <Link to="/privacy" style={{ color: 'var(--color-text-muted)' }}>Privacy</Link>
            <Link to="/terms" style={{ color: 'var(--color-text-muted)' }}>Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
