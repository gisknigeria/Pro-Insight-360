'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/ui/empty-state';

interface Organisation {
  id: string;
  name: string;
  description?: string;
  sector?: string;
  country?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  _count: { users: number; evaluations: number };
}

function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-200" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded-lg bg-slate-200" />
            <div className="h-3 w-16 rounded-full bg-slate-100" />
          </div>
        </div>
        <div className="h-5 w-8 rounded bg-slate-100" />
      </div>
      <div className="h-3 w-full rounded-lg bg-slate-100" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-14 rounded-xl bg-slate-100" />
        <div className="h-14 rounded-xl bg-slate-100" />
      </div>
      <div className="h-3 w-2/3 rounded-lg bg-slate-100" />
    </div>
  );
}

const SECTOR_COLORS: Record<string, string> = {
  'Government':  'from-blue-500 to-indigo-600',
  'Finance':     'from-emerald-500 to-teal-600',
  'Healthcare':  'from-pink-500 to-rose-600',
  'Education':   'from-violet-500 to-purple-600',
  'Technology':  'from-cyan-500 to-sky-600',
  'default':     'from-primary to-primary/70',
};

function sectorGradient(sector?: string) {
  if (!sector) return SECTOR_COLORS.default;
  const key = Object.keys(SECTOR_COLORS).find((k) => sector.toLowerCase().includes(k.toLowerCase()));
  return key ? SECTOR_COLORS[key] : SECTOR_COLORS.default;
}

export default function OrganisationsPage() {
  const router = useRouter();
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('accessToken');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/organisations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setOrganisations)
      .finally(() => setLoading(false));
  }, []);

  async function deleteOrganisation(id: string) {
    if (!window.confirm('Delete this organisation? This cannot be undone.')) return;
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organisations/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) { window.alert(payload?.message || 'Unable to delete.'); return; }
    setOrganisations((prev) => prev.filter((o) => o.id !== id));
  }

  const active = organisations.filter((o) => o.status === 'ACTIVE');

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* ── Header ── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Super Admin · Clients</p>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Organisations</h1>
            <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary ring-1 ring-primary/20">
              {organisations.length}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-slate-500">Manage client organisations and their evaluation memberships.</p>
        </div>
        <Link
          href="/organisations/new"
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary/80 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
        >
          <span className="text-base">+</span>
          Create Organisation
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total',        value: organisations.length, icon: '🏢', grad: 'from-blue-500 to-indigo-600' },
          { label: 'Active',       value: active.length,        icon: '✅', grad: 'from-emerald-400 to-green-600' },
          { label: 'Total users',  value: organisations.reduce((s, o) => s + o._count.users, 0), icon: '👥', grad: 'from-violet-500 to-purple-600' },
          { label: 'Evaluations',  value: organisations.reduce((s, o) => s + o._count.evaluations, 0), icon: '📋', grad: 'from-amber-400 to-orange-500' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.grad} text-lg shadow-md`}>
              {s.icon}
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1,2,3,4,5,6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : organisations.length === 0 ? (
        <EmptyState icon="🏢" title="No organisations yet" description="Create your first client organisation to start evaluations." actionLabel="Create Organisation" onAction={() => router.push('/organisations/new')} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {organisations.map((org) => (
            <div key={org.id} className="group relative flex flex-col rounded-3xl border border-slate-200 bg-white shadow-sm hover:border-primary/30 hover:shadow-lg transition-all overflow-hidden">
              {/* Gradient top strip */}
              <div className={`h-1.5 bg-gradient-to-r ${sectorGradient(org.sector)}`} />

              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${sectorGradient(org.sector)} text-white text-base shadow-md`}>
                      🏢
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-primary transition-colors">{org.name}</h3>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold mt-0.5 ${
                        org.status === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-400'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${org.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {org.status}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteOrganisation(org.id)}
                    className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    aria-label={`Delete ${org.name}`}
                  >
                    🗑️
                  </button>
                </div>

                <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed flex-1">
                  {org.description || <span className="italic opacity-60">No description provided.</span>}
                </p>

                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {[
                    { label: 'Sector',  value: org.sector || '—' },
                    { label: 'Country', value: org.country || '—' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
                      <p className="text-xs font-semibold text-slate-700 truncate">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    {org._count.users} user{org._count.users !== 1 ? 's' : ''}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                    {org._count.evaluations} evaluation{org._count.evaluations !== 1 ? 's' : ''}
                  </span>
                  <span className="text-slate-400">
                    {new Date(org.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
