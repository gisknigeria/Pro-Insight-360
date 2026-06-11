'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/ui/empty-state';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'CONSULTANT' | 'CLIENT_ADMIN' | 'HOD' | 'RESPONDENT';
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  organisation?: { id: string; name: string } | null;
  department?: string | null;
  createdAt: string;
  lastLogin?: string;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; ring: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-red-50 text-red-700', ring: 'ring-red-500/20' },
  CONSULTANT: { label: 'Consultant', color: 'bg-amber-50 text-amber-800', ring: 'ring-blue-500/20' },
  CLIENT_ADMIN: { label: 'Client Admin', color: 'bg-emerald-50 text-emerald-700', ring: 'ring-emerald-500/20' },
  HOD: { label: 'Head of Dept', color: 'bg-purple-50 text-purple-700', ring: 'ring-purple-500/20' },
  RESPONDENT: { label: 'Respondent', color: 'bg-slate-50 text-slate-700', ring: 'ring-slate-500/20' },
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20',
  INACTIVE: 'bg-slate-50 text-slate-600 ring-1 ring-slate-500/20',
  LOCKED: 'bg-red-50 text-red-700 ring-1 ring-red-500/20',
};

function StatCard({ label, value, icon, delay = 0 }: { label: string; value: number; icon: string; delay?: number }) {
  return (
    <div
      className="rounded-xl border border-border bg-surface p-4 shadow-sm animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 text-base shadow-sm">
          {icon}
        </span>
        <p className="text-sm font-semibold text-muted">{label}</p>
      </div>
      <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="skeleton h-8 w-32 mb-2" />
          <div className="skeleton h-4 w-64" />
        </div>
        <div className="skeleton h-10 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
      </div>
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="skeleton h-12 w-full" />
        {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-16 w-full border-t border-border" />)}
      </div>
    </div>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetInfo, setResetInfo] = useState<{ email: string; setupToken: string; temporaryPassword: string } | null>(null);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('accessToken');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  async function handleResetPassword(user: User) {
    setError('');
    setResetInfo(null);
    if (!confirm(`Reset password for ${user.name || user.email}?`)) return;

    const token = localStorage.getItem('accessToken');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Unable to reset password.');
        return;
      }
      setResetInfo({ email: data.email, setupToken: data.setupToken, temporaryPassword: data.temporaryPassword });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect to server.');
    }
  }

  async function handleDeleteUser(user: User) {
    if (!confirm(`Delete user ${user.name || user.email}? This cannot be undone.`)) return;
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.message || 'Unable to delete user.');
      return;
    }
    setUsers((current) => current.filter((item) => item.id !== user.id));
  }

  if (loading) return <LoadingSkeleton />;

  return (
    <div className={mounted ? 'animate-fade-in' : ''}>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Users</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary ring-1 ring-primary/20">
              {users.length}
            </span>
          </div>
          <p className="text-sm text-muted">Manage system users, roles, and access permissions.</p>
        </div>
        <Link
          href="/users/new"
          className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0"
        >
          <span className="text-lg leading-none">+</span>
          <span>Add User</span>
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Users" value={users.length} icon="👥" delay={0} />
        <StatCard label="Active" value={users.filter((u) => u.status === 'ACTIVE').length} icon="✅" delay={50} />
        <StatCard label="Locked" value={users.filter((u) => u.status === 'LOCKED').length} icon="🔒" delay={100} />
      </div>

      {/* ── Alerts ── */}
      {error ? (
        <div className="mb-6 rounded-xl border border-red-200/50 bg-gradient-to-r from-red-50 to-red-100/50 p-4 text-sm text-red-700 shadow-sm animate-scale-in">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      ) : null}

      {resetInfo ? (
        <div className="mb-6 rounded-xl border border-green-200/50 bg-gradient-to-r from-green-50 to-green-100/50 p-5 text-sm text-green-800 shadow-sm animate-scale-in">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">✅</span>
            <p className="font-bold text-foreground">Password reset link generated for {resetInfo.email}</p>
          </div>
          <div className="space-y-2 bg-white/60 rounded-lg p-4 border border-green-200/50">
            <p>
              <span className="font-bold text-foreground">Temporary password:</span>{' '}
              <code className="font-mono bg-green-100 px-2 py-0.5 rounded text-green-800">{resetInfo.temporaryPassword}</code>
            </p>
            <p>
              <span className="font-bold text-foreground">Setup token:</span>{' '}
              <code className="font-mono bg-green-100 px-2 py-0.5 rounded text-green-800 text-xs break-all">{resetInfo.setupToken}</code>
            </p>
          </div>
        </div>
      ) : null}

      {/* ── Users Table ── */}
      {users.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No users yet"
          description="Add users to your organization to start collaborating."
          actionLabel="Add First User"
          onAction={() => router.push('/users/new')}
        />
      ) : (
        <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[3fr_2fr_1.5fr_1.5fr_1fr_1.5fr_1.5fr] gap-4 px-6 py-4 border-b border-border bg-gradient-to-r from-primary/[0.02] to-accent/[0.01] text-[11px] font-bold uppercase tracking-wider text-muted">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Organisation</span>
            <span>Dept.</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-border">
            {users.map((user) => {
              const roleCfg = ROLE_CONFIG[user.role];
              return (
                <div
                  key={user.id}
                  className="grid grid-cols-1 md:grid-cols-[3fr_2fr_1.5fr_1.5fr_1fr_1.5fr_1.5fr] gap-3 md:gap-4 px-6 py-4 hover:bg-surface-muted/60 transition-all duration-200 items-start md:items-center"
                >
                  {/* Name (mobile-first) */}
                  <div className="flex items-center gap-3 md:gap-0">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-sm font-bold text-primary md:hidden">
                      {user.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{user.name}</p>
                      <span className="md:hidden text-xs text-muted">{user.email}</span>
                    </div>
                  </div>

                  {/* Email (hidden on mobile) */}
                  <span className="hidden md:block text-sm text-muted truncate">{user.email}</span>

                  {/* Role */}
                  <span className={`inline-flex items-center justify-center text-[11px] font-semibold px-2.5 py-1 rounded-lg ${roleCfg.color} ring-1 ${roleCfg.ring} w-fit`}>
                    {roleCfg.label}
                  </span>

                  {/* Organisation */}
                  <span className="text-sm text-muted truncate">{user.organisation?.name || '—'}</span>

                  {/* Department */}
                  <span className="text-sm text-muted truncate">{user.department || '—'}</span>

                  {/* Status + Last Login (combined on mobile) */}
                  <div className="flex flex-col gap-1.5">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg w-fit ${STATUS_STYLES[user.status] || STATUS_STYLES.INACTIVE}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        user.status === 'ACTIVE' ? 'bg-emerald-500' :
                        user.status === 'LOCKED' ? 'bg-red-500' : 'bg-slate-400'
                      }`} />
                      {user.status}
                    </span>
                    <span className="text-xs text-muted">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 justify-end">
                    <Link
                      href={`/users/${user.id}/edit`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-muted bg-surface-muted border border-border hover:border-primary/30 rounded-lg transition-all hover:shadow-sm"
                    >
                      ✏️ Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleResetPassword(user)}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      🔑 Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(user)}
                      className="px-3 py-1.5 text-xs font-semibold text-danger hover:bg-red-50 rounded-lg transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
