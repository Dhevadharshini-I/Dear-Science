import { Sparkles, Eye, EyeOff, AtSign, Lock, User, ArrowRight, ArrowLeft, Check, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';

interface SignupPageProps {
  onNavigate: (page: 'login') => void;
}

interface PasswordChecks {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
}

function checkPassword(password: string): PasswordChecks {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password),
  };
}

function getStrengthLabel(checks: PasswordChecks): {
  label: string;
  color: string;
  barColor: string;
  width: string;
} {
  const satisfied = Object.values(checks).filter(Boolean).length;
  if (satisfied <= 1) return { label: 'Weak', color: 'text-red-500', barColor: 'bg-red-400', width: '25%' };
  if (satisfied <= 3) return { label: 'Medium', color: 'text-amber-500', barColor: 'bg-amber-400', width: '60%' };
  return { label: 'Strong', color: 'text-green-500', barColor: 'bg-green-400', width: '100%' };
}

const REQUIREMENTS: { key: keyof PasswordChecks; label: string }[] = [
  { key: 'length', label: 'At least 8 characters' },
  { key: 'uppercase', label: 'At least one uppercase letter (A-Z)' },
  { key: 'lowercase', label: 'At least one lowercase letter (a-z)' },
  { key: 'number', label: 'At least one number (0-9)' },
  { key: 'special', label: 'At least one special character (!@#$)' },
];

export default function SignupPage({ onNavigate }: SignupPageProps) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
    form?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordChecks = useMemo(() => checkPassword(password), [password]);
  const passwordValid = Object.values(passwordChecks).every(Boolean);
  const strength = getStrengthLabel(passwordChecks);

  const nameValid = fullName.trim().length >= 2;
  const usernameValid =
    username.trim().length >= 3 && /^[a-zA-Z0-9_.]+$/.test(username.trim());
  const confirmValid = confirmPassword.length > 0 && password === confirmPassword;
  const formValid = nameValid && usernameValid && passwordValid && confirmValid;

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_.]+$/.test(username.trim())) {
      newErrors.username = 'Username can only contain letters, numbers, dots, and underscores';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!passwordValid) {
      newErrors.password = 'Please meet all password requirements below';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    const { error } = await signUp(username.trim(), password, fullName.trim());

    if (error) {
      setErrors({ form: error });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50/30 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg shadow-purple-200">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Dear Science</h1>
          <p className="mt-1 text-sm text-purple-400">Create your study companion account</p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-purple-100 bg-white/90 p-8 shadow-sm backdrop-blur-md">
          <h2 className="mb-6 text-xl font-semibold text-gray-800">Sign up</h2>

          {errors.form && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-gray-700">
                Full name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                  }}
                  placeholder="Jane Doe"
                  className={`w-full rounded-xl border bg-white px-10 py-3 text-sm text-gray-800 placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 ${
                    errors.fullName
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-purple-200 focus:border-purple-400 focus:ring-purple-100'
                  }`}
                  autoComplete="name"
                />
              </div>
              {errors.fullName && <p className="mt-1.5 text-xs text-red-500">{errors.fullName}</p>}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="relative">
                <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) setErrors({ ...errors, username: undefined });
                  }}
                  placeholder="jane_doe"
                  className={`w-full rounded-xl border bg-white px-10 py-3 text-sm text-gray-800 placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 ${
                    errors.username
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-purple-200 focus:border-purple-400 focus:ring-purple-100'
                  }`}
                  autoComplete="username"
                />
              </div>
              {errors.username && <p className="mt-1.5 text-xs text-red-500">{errors.username}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  placeholder="Create a strong password"
                  className={`w-full rounded-xl border bg-white px-10 py-3 text-sm text-gray-800 placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 ${
                    errors.password
                      ? 'border-red-300 focus:ring-red-200'
                      : passwordValid
                        ? 'border-green-300 focus:border-green-400 focus:ring-green-100'
                        : 'border-purple-200 focus:border-purple-400 focus:ring-purple-100'
                  }`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password strength indicator + checklist */}
              {password.length > 0 && (
                <div className="mt-2.5 space-y-2.5">
                  {/* Strength bar */}
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strength.barColor}`}
                        style={{ width: strength.width }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${strength.color}`}>{strength.label}</span>
                  </div>

                  {/* Requirements checklist */}
                  <ul className="space-y-1">
                    {REQUIREMENTS.map((req) => {
                      const met = passwordChecks[req.key];
                      return (
                        <li
                          key={req.key}
                          className={`flex items-center gap-1.5 text-xs transition-colors ${
                            met ? 'text-green-500' : 'text-gray-400'
                          }`}
                        >
                          {met ? (
                            <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />
                          ) : (
                            <X className="h-3.5 w-3.5 shrink-0 text-gray-300" />
                          )}
                          <span>{req.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                  }}
                  placeholder="Re-enter your password"
                  className={`w-full rounded-xl border bg-white px-10 py-3 text-sm text-gray-800 placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 ${
                    errors.confirmPassword
                      ? 'border-red-300 focus:ring-red-200'
                      : confirmValid
                        ? 'border-green-300 focus:border-green-400 focus:ring-green-100'
                        : 'border-purple-200 focus:border-purple-400 focus:ring-purple-100'
                  }`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || !formValid}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:from-purple-600 hover:to-purple-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
              {!isSubmitting && formValid && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="inline-flex items-center gap-1 font-semibold text-purple-600 hover:text-purple-700 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
