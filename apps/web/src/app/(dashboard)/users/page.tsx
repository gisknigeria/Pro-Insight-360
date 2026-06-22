'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/ui/empty-state';
import { AppIcon, type AppIconName } from '@/components/ui/app-icons';
import { DashboardMetricCard, DashboardPageFrame } from '@/components/ui/dashboard-chrome';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

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

const ROLE_CFG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  SUPER_ADMIN:  { label: 'Super Admin',  bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500' },
  CONSULTANT:   { label: 'Consultant',   bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500' },
  CLIENT_ADMIN: { label: 'Client Admin', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  HOD:          { label: 'Head of Dept', bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-500' },
  RESPONDENT:   { label: 'Respondent',   bg: 'bg-slate-100',  text: 'text-slate-600',   dot: 'bg-slate-400' },
};

const STATUS_CFG: Record<string, { bg: string; text: string; dot: string }> = {
  ACTIVE:   { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  INACTIVE: { bg: 'bg-slate-100',  text: 'text-slate-600',   dot: 'bg-slate-400' },
  LOCKED:   { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500' },
};

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CFG[role] ?? ROLE_CFG.RESPONDENT;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.INACTIVE;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

const ROLE_CHART_COLORS: Record<string, string> = {
  SUPER_ADMIN: '#ef4444',
  CONSULTANT:  '#f59e0b',
  CLIENT_ADMIN:'#10b981',
  HOD:         '#8b5cf6',
  RESPONDENT:  '#64748b',
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetInfo, setResetInfo] = useState<{ email: string; setupToken: string; temporaryPassword: string } | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [currentRole, setCurrentRole] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1] || ''));
        setCurrentRole(String(payload.role || ''));
      } catch {
        setCurrentRole('');
      }
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  async function handleResetPassword(user: User) {
    setError(''); setResetInfo(null);
    if (!confirm(`Reset password for ${user.name || user.email}?`)) return;
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Unable to reset.'); return; }
      setResetInfo({ email: data.email, setupToken: data.setupToken, temporaryPassword: data.temporaryPassword });
    } catch { setError('Unable to connect.'); }
  }

  async function handleDeleteUser(user: User) {
    if (!confirm(`Delete ${user.name || user.email}? This cannot be undone.`)) return;
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) { setError(payload?.message || 'Unable to delete.'); return; }
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
  }

  // Role distribution chart data
  const roleDistribution = Object.entries(ROLE_CFG).map(([role, cfg]) => ({
    name: cfg.label,
    value: users.filter((u) => u.role === role).length,
    role,
  }));

  const filtered = users.filter((u) => {
    const matchesSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.organisation?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });
  const userStats: { label: string; value: number; icon: AppIconName; grad: string }[] = [
    { label: 'Total', value: users.length, icon: 'users', grad: 'from-blue-500 to-indigo-600' },
    { label: 'Active', value: users.filter((u) => u.status === 'ACTIVE').length, icon: 'check', grad: 'from-emerald-400 to-green-600' },
    { label: 'Locked', value: users.filter((u) => u.status === 'LOCKED').length, icon: 'lock', grad: 'from-red-400 to-rose-600' },
    { label: 'Inactive', value: users.filter((u) => u.status === 'INACTIVE').length, icon: 'pause', grad: 'from-slate-400 to-slate-600' },
  ];

  return (
    <DashboardPageFrame>
      {/* ── Header ── */}
      <div className="flex flex-col gap-5 border border-slate-900 bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Super Admin · Access</p>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">Users</h1>
            <span className="inline-flex items-center justify-center border border-cyan-300/30 bg-slate-900 px-3 py-1 text-xs font-bold text-cyan-200">
              {users.length}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-slate-300">Manage system users, roles, and access permissions.</p>
        </div>
        <Link
          href="/users/new"
          className="inline-flex items-center gap-2 border border-cyan-300/30 bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-950/20 transition-colors hover:border-cyan-300 hover:bg-slate-800"
        >
          <AppIcon name="plus" className="h-4 w-4" />
          Add User
        </Link>
      </div>

      {/* ── Stats + Chart ── */}
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {userStats.map((s) => (
            <DashboardMetricCard
              key={s.label}
              label={s.label}
              value={s.value}
              icon={s.icon}
              tone={s.label === 'Active' ? 'teal' : s.label === 'Locked' ? 'rose' : s.label === 'Inactive' ? 'slate' : 'blue'}
            />
          ))}
        </div>

        {/* Role distribution chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Users by role</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleDistribution} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} interval={0} angle={-15} textAnchor="end" height={35} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  formatter={(v) => [v, 'Users']}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {roleDistribution.map((entry) => (
                    <Cell key={entry.role} fill={ROLE_CHART_COLORS[entry.role] ?? '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AppIcon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />{error}
        </div>
      )}
      {resetInfo && (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
          <p className="font-bold mb-3 flex items-center gap-2"><AppIcon name="check" className="h-4 w-4" /> Password reset for {resetInfo.email}</p>
          <div className="space-y-2 rounded-xl bg-white/60 border border-emerald-200 p-4 text-xs">
            <p><strong>Temp password:</strong> <code className="bg-emerald-100 px-2 py-0.5 rounded font-mono">{resetInfo.temporaryPassword}</code></p>
            <p><strong>Setup token:</strong> <code className="bg-emerald-100 px-2 py-0.5 rounded font-mono break-all">{resetInfo.setupToken}</code></p>
          </div>
        </div>
      )}

      {/* ── Search + Filter ── */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <AppIcon name="search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search by name, email or organisation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition"
        >
          <option value="ALL">All roles</option>
          {Object.entries(ROLE_CFG).map(([role, cfg]) => (
            <option key={role} value={role}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-white border border-slate-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="users" title="No users found" description={search || roleFilter !== 'ALL' ? 'Try adjusting your search or filter.' : 'Add users to your organisation.'} actionLabel={!search && roleFilter === 'ALL' ? 'Add First User' : undefined} onAction={!search && roleFilter === 'ALL' ? () => router.push('/users/new') : undefined} />
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Header */}
          <div className="hidden md:grid grid-cols-[2.5fr_2fr_1.5fr_1.5fr_1.2fr_1.5fr] gap-4 border-b border-slate-100 bg-slate-50/80 px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">
            <span>User</span>
            <span>Email</span>
            <span>Role</span>
            <span>Organisation</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="divide-y divide-slate-100">
            {filtered.map((user) => (
              <div key={user.id} className="group grid grid-cols-1 md:grid-cols-[2.5fr_2fr_1.5fr_1.5fr_1.2fr_1.5fr] gap-3 md:gap-4 px-6 py-4 hover:bg-slate-50/80 transition-colors items-start md:items-center">
                {/* Name */}
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-sm font-bold text-primary">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 md:hidden">{user.email}</p>
                    {user.department && <p className="text-xs text-slate-400">{user.department}</p>}
                  </div>
                </div>

                <span className="hidden md:block text-sm text-slate-500 truncate">{user.email}</span>
                <RoleBadge role={user.role} />
                <span className="text-sm text-slate-500 truncate">{user.organisation?.name || '-'}</span>
                <StatusBadge status={user.status} />

                {/* Actions */}
                <div className="flex items-center justify-end gap-1.5">
                  <Link
                    href={`/users/${user.id}/edit`}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-primary/30 hover:bg-white transition"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleResetPassword(user)}
                    className="rounded-xl px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition"
                  >
                    <AppIcon name="key" className="h-4 w-4" />
                  </button>
                  {currentRole === 'SUPER_ADMIN' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(user)}
                      className="rounded-xl px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                    >
                      <AppIcon name="trash" className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardPageFrame>
  );
}
