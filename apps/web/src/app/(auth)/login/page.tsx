'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? 'Something went wrong. Please try again.');
        return;
      }

      localStorage.setItem('accessToken', data.accessToken);
      window.location.href = '/dashboard';
    } catch {
      setError('Unable to connect. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* ── Animated background orbs ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/20 to-accent/10 blur-3xl animate-float" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-success/10 to-primary/15 blur-3xl animate-float" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-accent/5 to-primary/5 blur-3xl animate-float" style={{ animationDuration: '12s', animationDelay: '4s' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* ── Brand header ── */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-2.5 rounded-full glass px-5 py-2 text-xs font-bold uppercase tracking-[0.28em] text-foreground shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Pro-Insight 360
          </div>
          <h1 className="mt-6 text-4xl font-bold text-foreground tracking-tight sm:text-5xl">
            Welcome back.
          </h1>
          <p className="mt-3 text-muted text-sm sm:text-base max-w-sm mx-auto">
            Sign in to continue managing your organisation's evaluation and insights.
          </p>
        </div>

        {/* ── Login card ── */}
        <div className="relative animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
          {/* Decorative gradient border */}
          <div className="absolute -inset-[1px] rounded-[2rem] bg-gradient-to-b from-primary/30 via-accent/20 to-transparent opacity-20 blur-[2px]" />

          <div className="relative rounded-[2rem] border border-border bg-surface/95 p-8 sm:p-10 shadow-xl shadow-slate-900/5 backdrop-blur-2xl">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">Sign in</h2>
              <span className="inline-flex w-2 h-2 rounded-full bg-success" />
            </div>
            <p className="text-muted text-sm mb-7">
              Enter your email and password to continue.
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

              <div className="space-y-5">
                <div className="group">
                  <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@organisation.com"
                      className="w-full rounded-xl border border-border bg-surface-muted px-4 py-3 pl-11 text-sm text-foreground placeholder-muted shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface"
                    />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-base">✉️</span>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    Use the email address your administrator invited you with.
                  </p>
                </div>

                <div className="group">
                  <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-border bg-surface-muted px-4 py-3 pl-11 text-sm text-foreground placeholder-muted shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface"
                    />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-base">🔒</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative mt-8 w-full rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 overflow-hidden"
                aria-busy={loading}
              >
                {/* Shimmer overlay on hover */}
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative">
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in…
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Sign in
                      <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                    </span>
                  )}
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* ── Footer ── */}
        <p className="text-center text-xs text-muted mt-8 animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
          Need access? Contact your GIS Konsult administrator.
        </p>
      </div>
    </main>
  );
}
</write_to_file>
<task_progress>
- [x] Analyze codebase structure and existing design patterns
- [x] Redesign globals.css with modern design system, animations, and utilities
- [x] Redesign root layout with better font loading and meta tags
- [x] Redesign dashboard layout with premium sidebar and animations
- [x] Redesign sidebar navigation component
- [x] Redesign dashboard page with beautiful cards and micro-interactions
- [x] Redesign login page with modern animated UI
- [ ] Redesign AI diagnosis page with modern card layouts
- [ ] Check and update other remaining pages for consistency
</task_progress>
</write_to_file>