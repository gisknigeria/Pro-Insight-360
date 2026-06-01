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

      // Store token and redirect to dashboard
      localStorage.setItem('accessToken', data.accessToken);
      window.location.href = '/dashboard';
    } catch {
      setError('Unable to connect. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Pro-Insight 360</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Evaluate. Diagnose. Transform.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-1">
            Sign in to your account
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            Enter your email and password to continue.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Error message */}
            {error && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
              >
                {error}
              </div>
            )}

            {/* Email field */}
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@organisation.com"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                aria-describedby="email-hint"
              />
              <p id="email-hint" className="mt-1 text-xs text-slate-500">
                Use the email address your administrator invited you with.
              </p>
            </div>

            {/* Password field */}
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-busy={loading}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Need access? Contact your GIS Konsult administrator.
        </p>
      </div>
    </main>
  );
}
