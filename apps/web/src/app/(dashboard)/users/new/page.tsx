'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const roles = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'CONSULTANT', label: 'Consultant' },
  { value: 'CLIENT_ADMIN', label: 'CEO / Client Admin' },
  { value: 'HOD', label: 'Department Manager / MD' },
  { value: 'RESPONDENT', label: 'Staff Respondent' },
];

export default function NewUserPage() {
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [values, setValues] = useState({
    name: '',
    email: '',
    role: 'CONSULTANT',
    organisationId: '',
    department: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{
    setupToken: string;
    temporaryPassword: string;
    email: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/organisations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setOrgs)
      .catch(() => setOrgs([]));
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (!values.name.trim() || !values.email.trim()) {
      setError('Name and email are required.');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          role: values.role,
          organisationId: values.organisationId || undefined,
          department: values.department.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Unable to create user.');
        return;
      }

      setResult({
        setupToken: data.setupToken,
        temporaryPassword: data.temporaryPassword || '',
        email: data.email,
        role: data.role,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function copyToClipboard(value: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(value);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create a new user</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Invite a new team member and share their setup credentials.
        </p>
      </div>

      {result ? (
        <div className="rounded-3xl border border-green-200 bg-green-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">User created successfully</h2>
          <p className="text-slate-700 mt-2">
            Share the details below with the new user so they can finish setup and log in.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-4 border border-slate-200">
              <p className="text-xs uppercase tracking-wide text-slate-400">Email</p>
              <p className="mt-2 text-sm font-medium text-slate-900">{result.email}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 border border-slate-200">
              <p className="text-xs uppercase tracking-wide text-slate-400">Role</p>
              <p className="mt-2 text-sm font-medium text-slate-900">{result.role}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 border border-slate-200">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-wide text-slate-400">Temporary password</p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.temporaryPassword)}
                  className="text-xs text-primary hover:underline"
                >
                  Copy
                </button>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-900 break-all">
                {result.temporaryPassword}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 border border-slate-200">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-wide text-slate-400">Setup token</p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.setupToken)}
                  className="text-xs text-primary hover:underline"
                >
                  Copy
                </button>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-900 break-all">
                {result.setupToken}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-white p-4 border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">Steps for the new user</h3>
            <ol className="mt-3 space-y-2 text-sm text-slate-700 list-decimal list-inside">
              <li>Go to <span className="font-medium">/auth/setup</span>.</li>
              <li>Paste the setup token and create a secure password.</li>
              <li>Then log in at <span className="font-medium">/login</span> with their email and new password.</li>
            </ol>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/users"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
            >
              Back to users
            </Link>
            <Link
              href="/auth/setup"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Open setup page
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6">
          {error ? (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              id="name"
              value={values.name}
              onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-amber-200"
              placeholder="e.g. Jane Doe"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={values.email}
              onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-amber-200"
              placeholder="jane@example.org"
              required
            />
          </div>

          <div>
            <label htmlFor="organisation" className="block text-sm font-medium text-slate-700">
              Organisation
            </label>
            <select
              id="organisation"
              value={values.organisationId}
              onChange={(event) => setValues((current) => ({ ...current, organisationId: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-amber-200"
            >
              <option value="">Select organisation (optional)</option>
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              Assign this user to an organisation so they can access the right evaluation projects.
            </p>
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-slate-700">
              Department / job title
            </label>
            <input
              id="department"
              value={values.department}
              onChange={(event) => setValues((current) => ({ ...current, department: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-amber-200"
              placeholder="e.g. Marketing, Operations, CEO"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-slate-700">
              Role
            </label>
            <select
              id="role"
              value={values.role}
              onChange={(event) => setValues((current) => ({ ...current, role: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-amber-200"
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-amber-300"
            >
              {saving ? 'Creating user…' : 'Create user'}
            </button>
            <Link
              href="/users"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
