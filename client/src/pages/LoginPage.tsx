import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

const REMEMBER_EMAIL_KEY = 'fitflow_remember_email';
const REMEMBER_FLAG_KEY = 'fitflow_remember_me';

function EyeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function EyeSlashIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );
}

function FeatureRow({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <div>
        <p className="font-medium text-white text-sm">{title}</p>
        <p className="text-white/75 text-xs mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      if (localStorage.getItem(REMEMBER_FLAG_KEY) === '1') {
        const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
        if (saved) {
          setEmail(saved);
          setRememberMe(true);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, email);
          localStorage.setItem(REMEMBER_FLAG_KEY, '1');
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
          localStorage.removeItem(REMEMBER_FLAG_KEY);
        }
      } catch {
        /* ignore */
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(249,115,22,0.35),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_50%,rgba(16,185,129,0.12),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_80%,rgba(59,130,246,0.1),transparent_45%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/80"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12 sm:px-6">
        <div className="mb-8 text-center">
          <p className="font-display text-3xl font-bold tracking-tight text-white">FitFlow</p>
          <p className="mt-1 text-sm text-white/70">Train smarter. Stay consistent.</p>
        </div>

        <Card className="w-full border-slate-200/80 bg-white/95 shadow-xl shadow-slate-900/20 backdrop-blur-sm">
          <div className="-m-5 mb-0 border-b border-slate-100 bg-gradient-to-r from-primary-50/80 to-emerald-50/50 px-5 py-4">
            <h2 className="font-display text-lg font-semibold text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-600 mt-0.5">Sign in to continue your fitness journey.</p>
          </div>
          <div className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
                >
                  <p className="font-medium text-red-900">Unable to sign in</p>
                  <p className="mt-0.5 text-red-700">{error}</p>
                </div>
              )}

              <Input
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />

              <div className="w-full">
                <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 pr-11 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="remember-me" className="text-sm text-slate-700 select-none cursor-pointer">
                  Remember me
                </label>
              </div>

              <Button type="submit" fullWidth loading={loading}>
                Sign in
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-600">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700 hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </Card>

        <div className="mt-10 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-white/50">Why FitFlow</p>
          <div className="space-y-4">
            <FeatureRow
              title="AI Personalized Fitness Planning"
              description="Plans that adapt to your goals, schedule, and progress over time."
            />
            <FeatureRow
              title="Smart Meal & Workout Scheduling"
              description="Keep nutrition and training aligned in one clear calendar."
            />
            <FeatureRow
              title="Squad Motivation System"
              description="Stay accountable with friends and shared momentum."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
