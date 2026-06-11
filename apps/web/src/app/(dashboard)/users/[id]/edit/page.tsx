'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

type Role = 'SUPER_ADMIN' | 'CONSULTANT' | 'CLIENT_ADMIN' | 'HOD' | 'RESPONDENT';

type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  organisation: { id: string; name: string };
  organisationId?: string | null;
  department?: string | null;
};

const roles: { value: Role; label: string }[] = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'CONSULTANT', label: 'Consultant' },
  { value: 'CLIENT_ADMIN', label: 'Client Admin' },
  { value: 'HOD', label: 'Head of Department' },
  { value: 'RESPONDENT', label: 'Respondent' },
];

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    apiFetch<User>(`/users/${userId}`)
      .then((loadedUser) => {
        setUser({
          ...loadedUser,
          organisationId: loadedUser.organisation?.id || '',
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load user.'))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/organisations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setOrgs)
      .catch(() => setOrgs([]));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    setSaving(true);
    setError('');
    try {
      await apiFetch(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: user.name,
          role: user.role,
          isActive: user.status !== 'INACTIVE',
          department: user.department,
          organisationId: user.organisationId || null,
        }),
      });
      setMessage('User updated successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update user.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <Link href="/users" className="text-sm text-primary hover:underline">
          ← Back to users
        </Link>
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Unable to load this user.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Edit user</h1>
        <p className="text-slate-500 mt-1 text-sm">Update user details, organisation, and active status.</p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {message}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            Full name
          </label>
          <input
            id="name"
            value={user.name}
            onChange={(event) => setUser({ ...user, name: event.target.value })}
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-amber-200"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email address
          </label>
          <input
            id="email"
            value={user.email}
            disabled
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600 shadow-sm"
          />
        </div>

        <div>
          <label htmlFor="organisation" className="block text-sm font-medium text-slate-700">
            Organisation
          </label>
          <select
            id="organisation"
            value={user.organisationId || ''}
            onChange={(event) => setUser({ ...user, organisationId: event.target.value })}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-amber-200"
          >
            <option value="">Select organisation</option>
            {orgs.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-slate-700">
            Role
          </label>
          <select
            id="role"
            value={user.role}
            onChange={(event) => setUser({ ...user, role: event.target.value as Role })}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-amber-200"
          >
            {roles.map((roleOption) => (
              <option key={roleOption.value} value={roleOption.value}>
                {roleOption.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="department" className="block text-sm font-medium text-slate-700">
            Department / job title
          </label>
          <input
            id="department"
            value={user.department || ''}
            onChange={(event) => setUser({ ...user, department: event.target.value })}
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-amber-200"
            placeholder="e.g. Finance, Operations, CEO"
          />
        </div>

        <div>
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={user.status !== 'INACTIVE'}
              onChange={(event) => setUser({ ...user, status: event.target.checked ? 'ACTIVE' : 'INACTIVE' })}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            Active account
          </label>
          <p className="mt-2 text-xs text-slate-500">Deactivate this user to block logins without deleting their record.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-amber-300"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/users')}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
