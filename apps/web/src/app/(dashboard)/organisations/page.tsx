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
          <div className="skeleton h-8 w-48 mb-2" />
          <div className="skeleton h-4 w-64" />
        </div>
        <div className="skeleton h-10 w-44 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
      </div>
    </div>
  );
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
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organisations/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      window.alert(payload?.message || 'Unable to delete organisation.');
      return;
    }
    setOrganisations((current) => current.filter((org) => org.id !== id));
  }

  if (loading) return <LoadingSkeleton />;

  const activeCount = organisations.filter((o) => o.status === 'ACTIVE').length;

  return (
    <div className={mounted ? 'animate-fade-in' : ''}>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Organisations</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary ring-1 ring-primary/20">
              {organisations.length}
            </span>
          </div>
          <p className="text-sm text-muted">Manage client organisations and their evaluations.</p>
        </div>
        <Link
          href="/organisations/new"
          className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0"
        >
          <span className="text-lg leading-none">+</span>
          <span>Create Organisation</span>
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <StatCard label="Total Organisations" value={organisations.length} icon="🏢" delay={0} />
        <StatCard label="Active" value={activeCount} icon="✅" delay={50} />
      </div>

      {/* ── Organisations Grid ── */}
      {organisations.length === 0 ? (
        <EmptyState
          icon="🏢"
          title="No organisations yet"
          description="Create your first client organization to start evaluations."
          actionLabel="Create Organisation"
          onAction={() => router.push('/organisations/new')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organisations.map((org, idx) => (
            <div
              key={org.id}
              className="group relative rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 card-hover animate-fade-in-up"
              style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'both' }}
            >
              {/* Decorative top gradient */}
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-primary via-accent to-primary opacity-60" />

              <div className="flex justify-between items-start mb-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-lg shadow-sm">
                    🏢
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{org.name}</h3>
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-lg mt-1 ${
                      org.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20'
                        : 'bg-slate-50 text-slate-500 ring-1 ring-slate-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${org.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      {org.status}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteOrganisation(org.id)}
                  className="opacity-0 group-hover:opacity-100 px-2.5 py-1.5 text-xs font-medium text-muted hover:text-danger rounded-lg transition-all hover:bg-red-50"
                  aria-label={`Delete ${org.name}`}
                >
                  🗑️
                </button>
              </div>

              <p className="text-sm text-muted mb-4 line-clamp-2 leading-relaxed">
                {org.description || (
                  <span className="italic text-muted/60">No description provided</span>
                )}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="rounded-lg bg-surface-muted p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">Sector</p>
                  <p className="text-sm font-medium text-foreground">{org.sector || '—'}</p>
                </div>
                <div className="rounded-lg bg-surface-muted p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">Country</p>
                  <p className="text-sm font-medium text-foreground">{org.country || '—'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted border-t border-border pt-4 mt-2">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  {org._count.users} users
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  {org._count.evaluations} evaluations
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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
- [x] Redesign evaluations list page with modern card layouts and micro-interactions
- [x] Redesign users page with beautiful responsive table
- [x] Redesign organisations page with modern cards and micro-interactions
- [ ] Check remaining pages (settings, forms, gap-analysis, organisations/new, etc.)
</task_progress>
</write_to_file>