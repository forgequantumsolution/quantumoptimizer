import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { authService } from '../services/authService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { ToastContainer } from '../components/ui';

export default function SignInPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const addToast = useToastStore((s) => s.addToast);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.login(form.email, form.password);
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
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-10">
          <Link to="/" className="font-ui text-[18px] font-medium text-dark tracking-[0.01em]">
            Forge <span className="text-gold">Quantum</span> Solution
          </Link>
          <p className="font-body text-base text-mid mt-2">Sign in to Quantum Optimizer</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-dark/10 rounded-[12px] p-10 shadow-sm">
          {error && (
            <div className="bg-danger-light border border-danger/20 rounded-[6px] px-4 py-3 mb-6 font-ui text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@company.com"
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />

            <div className="flex items-center justify-end">
              <button type="button" className="font-ui text-[11px] text-muted hover:text-gold transition-colors">
                Forgot Password?
              </button>
            </div>

            <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-dark/10 text-center">
            <p className="font-ui text-xs text-muted mb-3">Don't have an account?</p>
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              Request a Demo
            </Button>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
