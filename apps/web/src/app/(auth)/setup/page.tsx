'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function SetupForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tokenFromUrl = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const activeToken = tokenFromUrl ?? tokenInput;

  useEffect(() => {
    if (tokenFromUrl) {
      setTokenInput(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  useEffect(() => {
    if (!activeToken) {
      setError('Please enter your setup token to continue.');
    } else {
      setError('');
    }
  }, [activeToken]);

  const passwordRules = [
    { label: 'At least 12 characters', met: password.length >= 12 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /\d/.test(password) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(password) },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!activeToken) {
      setError('Please enter your setup token.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match. Please check and try again.');
      return;
    }

    const unmet = passwordRules.filter((r) => !r.met);
    if (unmet.length > 0) {
      setError('Password must meet all requirements listed below.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/setup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: activeToken, password }),
        },
      );

      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Something went wrong. Please try again.');
        return;
      }

      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch {
      setError('Unable to connect. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center animate-scale-in">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-success/10">
          ✅
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Account set up successfully
        </h2>
        <p className="text-muted text-sm">
          Redirecting you to the login page…
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface/95 p-8 sm:p-10 shadow-xl shadow-slate-900/5 backdrop-blur-2xl">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Set up your account</h2>
        <span className="inline-flex w-2 h-2 rounded-full bg-accent" />
      </div>
      <p className="text-muted text-sm mb-6">
        Create a password to activate your Pro-Insight 360 account.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200/50 bg-gradient-to-r from-red-50 to-red-100/50 px-4 py-3 text-sm text-red-700 shadow-sm animate-scale-in"
          >
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {!tokenFromUrl && (
          <div className="mb-5 group">
            <label
              htmlFor="token"
              className="block text-sm font-semibold text-foreground mb-2"
            >
              Setup token
            </label>
            <div className="relative">
              <input
                id="token"
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste the setup token here"
                className="w-full rounded-xl border border-border bg-surface-muted px-4 py-3 pl-11 text-sm text-foreground placeholder-muted shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-base">🔑</span>
            </div>
          </div>
        )}

        <div className="mb-5 group">
          <label
            htmlFor="password"
            className="block text-sm font-semibold text-foreground mb-2"
          >
            New password
          </label>
          <div className="relative">
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-muted px-4 py-3 pl-11 text-sm text-foreground placeholder-muted shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-base">🔒</span>
          </div>
          {/* Password strength checklist */}
          {password.length > 0 && (
            <ul className="mt-3 space-y-1.5 animate-slide-in-right">
              {passwordRules.map((rule) => (
                <li
                  key={rule.label}
                  className={`flex items-center gap-2 text-xs font-medium ${
                    rule.met ? 'text-success' : 'text-muted'
                  }`}
                >
                  <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                    rule.met ? 'bg-success/10' : 'bg-border'
                  }`}>
                    <span aria-hidden="true" className="text-[10px]">
                      {rule.met ? '✓' : '○'}
                    </span>
                  </span>
                  {rule.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-6 group">
          <label
            htmlFor="confirm"
            className="block text-sm font-semibold text-foreground mb-2"
          >
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-muted px-4 py-3 pl-11 text-sm text-foreground placeholder-muted shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-base">🔒</span>
          </div>
          {confirm.length > 0 && password !== confirm && (
            <p className="mt-1.5 text-xs font-medium text-danger flex items-center gap-1">
              <span>⚠</span>
              Passwords do not match.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !activeToken}
          className="group relative w-full rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 overflow-hidden"
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <span className="relative">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Setting up…
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                Set up my account
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </span>
            )}
          </span>
        </button>
      </form>
    </div>
  );
}

export default function SetupPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* ── Animated background orbs ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-accent/20 to-primary/10 blur-3xl animate-float" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-success/10 to-primary/15 blur-3xl animate-float" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-accent/5 to-primary/5 blur-3xl animate-float" style={{ animationDuration: '12s', animationDelay: '4s' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* ── Brand header ── */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-2.5 rounded-full glass px-5 py-2 text-xs font-bold uppercase tracking-[0.28em] text-foreground shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            Pro-Insight 360
          </div>
          <h1 className="mt-6 text-4xl font-bold text-foreground tracking-tight sm:text-5xl">
            Create a secure access key.
          </h1>
          <p className="mt-3 text-muted text-sm sm:text-base max-w-sm mx-auto">
            Complete your account setup so you can access organisational insights.
          </p>
        </div>

        {/* ── Setup card ── */}
        <div className="relative animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
          <div className="absolute -inset-[1px] rounded-[2rem] bg-gradient-to-b from-accent/30 via-primary/20 to-transparent opacity-20 blur-[2px]" />
          <Suspense fallback={
            <div className="rounded-2xl border border-border bg-surface/95 p-10 shadow-xl">
              <div className="text-center text-muted text-sm animate-pulse">Loading…</div>
            </div>
          }>
            <SetupForm />
          </Suspense>
        </div>

        {/* ── Footer ── */}
        <p className="text-center text-xs text-muted mt-8 animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
          Already have an account?{' '}
          <a href="/login" className="text-primary hover:text-primary-light font-semibold transition-colors">Sign in</a>
        </p>
      </div>
    </main>
  );
}