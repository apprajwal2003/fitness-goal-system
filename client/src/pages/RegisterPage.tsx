import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

type PasswordStrength = 'empty' | 'weak' | 'medium' | 'strong';

function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return 'empty';
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
}

const strengthConfig: Record<
  Exclude<PasswordStrength, 'empty'>,
  { label: string; width: string; barClass: string; textClass: string }
> = {
  weak: {
    label: 'Weak',
    width: 'w-1/3',
    barClass: 'bg-red-500',
    textClass: 'text-red-600',
  },
  medium: {
    label: 'Medium',
    width: 'w-2/3',
    barClass: 'bg-amber-500',
    textClass: 'text-amber-600',
  },
  strong: {
    label: 'Strong',
    width: 'w-full',
    barClass: 'bg-green-600',
    textClass: 'text-green-700',
  },
};

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const emailValid = useMemo(() => isValidEmail(email), [email]);
  const showEmailHint = email.length > 0;
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const nextField: typeof fieldErrors = {};

    if (!isValidEmail(email)) {
      nextField.email = 'Please enter a valid email address.';
    }
    if (password !== confirmPassword) {
      nextField.confirmPassword = 'Passwords do not match.';
    }
    if (!termsAccepted) {
      nextField.terms = 'You must agree to the Terms & Conditions to continue.';
    }

    setFieldErrors(nextField);
    if (Object.keys(nextField).length > 0) return;

    setLoading(true);
    try {
      await register(email.trim(), password, name.trim());
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  const strength =
    passwordStrength !== 'empty' ? strengthConfig[passwordStrength] : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-slate-100 px-4 py-10">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-slate-900">FitFlow</h1>
          <p className="text-slate-600 mt-1">Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Full name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Johnson"
            autoComplete="name"
            required
          />

          <div>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
              }}
              placeholder="you@example.com"
              autoComplete="email"
              error={fieldErrors.email}
              aria-invalid={showEmailHint ? !emailValid : undefined}
              aria-describedby={showEmailHint ? 'register-email-hint' : undefined}
            />
            {showEmailHint && (
              <p
                id="register-email-hint"
                className={`mt-1.5 text-sm font-medium ${emailValid ? 'text-green-700' : 'text-red-600'}`}
                role="status"
              >
                {emailValid ? 'Valid email format' : 'Invalid email format'}
              </p>
            )}
          </div>

          <div>
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              autoComplete="new-password"
              required
            />
            {password.length > 0 && (
              <div className="mt-2 space-y-1.5" aria-live="polite">
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strength?.barClass ?? ''} ${strength?.width ?? 'w-0'}`}
                  />
                </div>
                {strength && (
                  <p className={`text-xs font-medium ${strength.textClass}`}>
                    Password strength: {strength.label}
                  </p>
                )}
              </div>
            )}
          </div>

          <Input
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword) setFieldErrors((f) => ({ ...f, confirmPassword: undefined }));
            }}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            error={
              fieldErrors.confirmPassword ??
              (confirmPassword.length > 0 && !passwordsMatch ? 'Passwords do not match.' : undefined)
            }
            required
          />

          <div>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked);
                  if (fieldErrors.terms) setFieldErrors((f) => ({ ...f, terms: undefined }));
                }}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-slate-700 leading-snug">
                I agree to the{' '}
                <span className="text-primary-600 font-medium">Terms & Conditions</span>
              </span>
            </label>
            {fieldErrors.terms && <p className="mt-1.5 text-sm text-red-600">{fieldErrors.terms}</p>}
          </div>

          {error && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          )}

          <Button type="submit" fullWidth loading={loading}>
            Create account
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
