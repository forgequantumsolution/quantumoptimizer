import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { authService } from '../services/authService';
import { ToastContainer } from '../components/ui';
import supplyChainBg from '../assets/supply-chain-bg.jpg';
import goldenLogo from '../assets/golden_blue_logo.png';
import './SignInPage.css';

/* Inline Lucide-style icons (16px stroke) */
const Icon = ({ d, size = 14, children }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children || <path d={d} />}
  </svg>
);
const MailIcon = () => (
  <Icon>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </Icon>
);
const LockIcon = () => (
  <Icon>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Icon>
);
const EyeIcon = () => (
  <Icon>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);
const EyeOffIcon = () => (
  <Icon>
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </Icon>
);
const AlertIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </Icon>
);

const PILLS = ['Forecasting', 'Consensus Planning', 'Inventory', 'Scenario Planning', 'Analytics'];

export default function SignInPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const addToast = useToastStore((s) => s.addToast);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      const { accessToken, user } = res.data.data;
      setAuth(user, accessToken);
      addToast(`Welcome back, ${user.firstName}!`, 'success');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ backgroundImage: `url(${supplyChainBg})` }}>
      <div className="login-overlay" />

      <div className="login-brand">
        <div className="login-brand-eyebrow">
          <span className="login-brand-dot" />
          <span className="login-brand-eyebrow-text">Demand Planning Platform</span>
        </div>

        <h1 className="login-brand-headline">
          AI-Driven Forecasting.<br />
          <em>Seamless Supply.</em>
        </h1>

        <p className="login-brand-desc">
          Multi-tenant demand planning and supply chain forecasting for Pharma,
          F&amp;B, and FMCG — forecasting, consensus planning, inventory
          optimisation, scenario planning, and analytics in a single platform.
        </p>

        <div className="login-brand-pills">
          {PILLS.map((p) => (
            <span key={p} className="login-brand-pill">{p}</span>
          ))}
        </div>
      </div>

      <div className="login-card-wrap">
        <div className="login-card">
          <div className="login-card-top">
            <img src={goldenLogo} alt="Quantum Optimizer" className="login-card-logo" />
            <div className="login-card-product">
              Quantum <span>Optimizer</span>
            </div>
          </div>

          <div className="login-card-body">
            <div className="login-card-title-row">
              <h2 className="login-card-title">Sign In</h2>
              <div className="login-status">
                <span className="login-status-dot" />
                System Online
              </div>
            </div>

            {error && (
              <div className="login-error">
                <span style={{ flexShrink: 0, marginTop: 1, display: 'inline-flex' }}><AlertIcon /></span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="login-field">
                <label className="login-field-label">Email address</label>
                <div className="login-field-wrap">
                  <span className="login-field-icon"><MailIcon /></span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@company.com"
                    className="login-input"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-field-label">Password</label>
                <div className="login-field-wrap">
                  <span className="login-field-icon"><LockIcon /></span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="login-input"
                    style={{ paddingRight: 40 }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-pw-toggle"
                    onClick={() => setShowPw(!showPw)}
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="login-submit">
                {loading && <span className="login-spinner" />}
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          </div>

          <div className="login-card-footer">
            Powered by Quantum Optimizer · Forge Quantum Solutions
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
