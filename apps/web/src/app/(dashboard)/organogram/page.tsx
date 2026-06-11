'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import OrgChart from '@/components/organogram/OrgChart';
import { EmptyState } from '@/components/ui/empty-state';
import type { OrgRow } from '@/components/organogram/OrgChartUploader';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Organisation { id: string; name: string; }

interface UserSummary {
  id: string; email: string; name: string; role: string; organisation: Organisation;
}

interface PublishedAnalysis {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  evaluationId?: string | null;
  summary: string;
  analysis: {
    organogram?: {
      nodes?: Array<{ id?: string; label?: string; group?: string }>;
      links?: Array<{ source?: string; target?: string; relation?: string }>;
    };
    executiveSummary?: string;
  } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildOrgRows(
  nodes?: Array<{ id?: string; label?: string; group?: string }>,
  links?: Array<{ source?: string; target?: string; relation?: string }>,
): OrgRow[] {
  if (!nodes || nodes.length === 0) return [];

  const idToLabel = new Map<string, string>(
    nodes.map((n): [string, string] => [String(n.id ?? ''), String(n.label ?? n.id ?? 'Unknown')])
  );

  const rows: OrgRow[] = nodes.map(n => ({
    name: String(n.label ?? n.id ?? 'Unknown'),
    title: String(n.group ?? ''),
    reportsTo: '',
  }));

  (links ?? []).forEach(link => {
    const src = String(link.source ?? '');
    const tgt = String(link.target ?? '');
    const srcName: string = idToLabel.get(src) ?? src;
    const tgtName: string = idToLabel.get(tgt) ?? tgt;
    const row = rows.find(r => r.name === srcName);
    if (row) row.reportsTo = tgtName;
  });

  return rows;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrganogramPage() {
  const [orgName, setOrgName] = useState('');
  const [analyses, setAnalyses] = useState<PublishedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('accessToken');
      if (!token) { setError('Please sign in.'); setLoading(false); return; }

      let userId = '';
      try { userId = JSON.parse(atob(token.split('.')[1])).sub; }
      catch { setError('Session error.'); setLoading(false); return; }

      try {
        const [user, allPublished] = await Promise.all([
          apiFetch<UserSummary>(`/users/${userId}`),
          apiFetch<PublishedAnalysis[]>('/published-analyses'),
        ]);
        setOrgName(user.organisation?.name ?? '');

        // Only analyses that have an organogram
        const withOrg = allPublished.filter(
          pa => pa.analysis?.organogram?.nodes && pa.analysis.organogram.nodes.length > 0
        );
        setAnalyses(withOrg);
        if (withOrg.length > 0) setSelectedId(withOrg[0].id);
      } catch (err: any) {
        setError(err?.message || 'Unable to load organogram data.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const selected = useMemo(
    () => analyses.find(a => a.id === selectedId) ?? analyses[0] ?? null,
    [analyses, selectedId]
  );

  const orgRows: OrgRow[] = useMemo(
    () => buildOrgRows(selected?.analysis?.organogram?.nodes, selected?.analysis?.organogram?.links),
    [selected]
  );

  const departments = useMemo(
    () => [...new Set(orgRows.map(r => r.title).filter(Boolean))],
    [orgRows]
  );

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin mb-4" />
        <p className="text-sm text-slate-500">Loading organogram…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 font-medium">{error}</div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">
              GISKonsult · Organisational Structure
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Organogram</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Organisational hierarchy and reporting structure
              {orgName ? ` for ${orgName}` : ''}.
            </p>
          </div>
          {orgName && (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-sm font-bold text-slate-800">{orgName}</span>
            </div>
          )}
        </div>
      </div>

      {analyses.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <EmptyState
            icon="🏢"
            title="No organogram available yet"
            description="Your organisational structure chart will appear here once it has been prepared by the GISKonsult team."
          />
        </div>
      ) : (
        <>
          {/* ── Report selector (if multiple) ── */}
          {analyses.length > 1 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {analyses.map(a => (
                <button key={a.id} type="button"
                  onClick={() => setSelectedId(a.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                    selectedId === a.id
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-400 hover:text-teal-700'
                  }`}>
                  📋 {new Date(a.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {a.publishedBy ? ` · ${a.publishedBy}` : ''}
                </button>
              ))}
            </div>
          )}

          {/* ── Stats strip ── */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { label: 'Total Roles', value: orgRows.length, icon: '👤', grad: 'from-teal-500 to-emerald-600' },
              { label: 'Departments', value: departments.length, icon: '🏢', grad: 'from-blue-500 to-indigo-600' },
              { label: 'Report Date', value: selected ? new Date(selected.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—', icon: '📅', grad: 'from-violet-500 to-purple-600' },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.grad} text-lg shadow-md`}>
                  {stat.icon}
                </div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* ── Executive summary if present ── */}
          {selected?.analysis?.executiveSummary && (
            <div className="mb-6 rounded-2xl border border-teal-200 bg-teal-50/60 p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-2">Context</p>
              <p className="text-sm leading-relaxed text-slate-700 line-clamp-3">
                {selected.analysis.executiveSummary}
              </p>
            </div>
          )}

          {/* ── Org chart ── */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Reporting Structure</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {orgRows.length} roles across {departments.length} department{departments.length !== 1 ? 's' : ''}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">
                🏢 {orgName}
              </span>
            </div>

            {orgRows.length > 0 ? (
              <OrgChart rows={orgRows} />
            ) : (
              <EmptyState icon="🏢" title="No structure data" description="The organogram structure could not be loaded." />
            )}
          </div>

          {/* ── Department list ── */}
          {departments.length > 0 && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Departments represented</p>
              <div className="flex flex-wrap gap-2">
                {departments.map((dept, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                    🏢 {dept}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
