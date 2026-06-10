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
      setError(
        'Please enter your setup token to continue.',
      );
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
      setError(`Password must meet all requirements listed below.`);
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
      <div className="text-center">
        <span className="text-5xl mb-4 block" aria-hidden="true">✅</span>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Account set up successfully
        </h2>
        <p className="text-slate-500 text-sm">
          Redirecting you to the login page…
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <h2 className="text-xl font-semibold text-slate-900 mb-1">
        Set up your account
      </h2>
      <p className="text-slate-500 text-sm mb-6">
        Create a password to activate your Pro-Insight 360 account.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
          >
            {error}
          </div>
        )}

        {!tokenFromUrl && (
          <div className="mb-4">
            <label
              htmlFor="token"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Setup token
            </label>
            <input
              id="token"
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste the setup token here"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        )}

        <div className="mb-4">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          {/* Password strength checklist */}
          {password.length > 0 && (
            <ul className="mt-2 space-y-1">
              {passwordRules.map((rule) => (
                <li
                  key={rule.label}
                  className={`flex items-center gap-2 text-xs ${rule.met ? 'text-green-600' : 'text-slate-400'}`}
                >
                  <span aria-hidden="true">{rule.met ? '✓' : '○'}</span>
                  {rule.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-6">
          <label
            htmlFor="confirm"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          {confirm.length > 0 && password !== confirm && (
            <p className="mt-1 text-xs text-red-600">
              Passwords do not match.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !activeToken}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {loading ? 'Setting up…' : 'Set up my account'}
        </button>
      </form>
    </div>
  );
}

export default function SetupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.12),_transparent_28%),linear-gradient(180deg,#eff6ff_0,#f8fafc_100%)] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-slate-700 shadow-sm shadow-slate-900/5">
            Set up your account
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-slate-900 sm:text-4xl">
            Create a secure access key.
          </h1>
          <p className="mt-3 text-slate-500 text-sm sm:text-base">
            Complete your account setup so you can access organisational insights.
          </p>
        </div>
        <Suspense fallback={<div className="text-center text-slate-500 text-sm">Loading…</div>}>
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white/95 p-10 shadow-2xl shadow-slate-900/10 backdrop-blur">
            <SetupForm />
          </div>
        </Suspense>
      </div>
    </main>
  );
}
