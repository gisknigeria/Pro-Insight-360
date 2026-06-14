'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { isClientAdmin as checkClientAdmin } from '@/lib/auth';
import OrgChart from '@/components/organogram/OrgChart';
import { EmptyState } from '@/components/ui/empty-state';
import type { OrgRow } from '@/components/organogram/OrgChartUploader';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrgNode { id?: string; label?: string; group?: string; }
interface OrgLink { source?: string; target?: string; relation?: string; }
interface Organogram { nodes?: OrgNode[]; links?: OrgLink[]; }

interface PublishedAnalysis {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  recipientId?: string;
  recipientName?: string;
  evaluationId?: string | null;
  summary: string;
  analysis: {
    organogram?: Organogram;
    executiveSummary?: string;
  } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildOrgRows(nodes?: OrgNode[], links?: OrgLink[]): OrgRow[] {
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

// ─── Edit panel ───────────────────────────────────────────────────────────────

interface EditPanelProps {
  organogram: Organogram;
  onSave: (updated: Organogram) => Promise<void>;
  onCancel: () => void;
}

function EditPanel({ organogram, onSave, onCancel }: EditPanelProps) {
  const [nodesText, setNodesText] = useState(JSON.stringify(organogram.nodes ?? [], null, 2));
  const [linksText, setLinksText] = useState(JSON.stringify(organogram.links ?? [], null, 2));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    try {
      const nodes = JSON.parse(nodesText);
      const links = JSON.parse(linksText);
      if (!Array.isArray(nodes) || !Array.isArray(links)) throw new Error('Both must be arrays.');
      setSaving(true);
      await onSave({ nodes, links });
    } catch (e: any) {
      setError(e?.message ?? 'Invalid JSON');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-blue-800">Edit organogram data</p>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition">
            {saving ? 'Saving…' : '💾 Save & publish'}
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      <div className="grid gap-4 xl:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Nodes — <code className="text-[10px]">[{"{"}"id","label","group"{"}"}]</code>
          </p>
          <textarea value={nodesText} onChange={e => setNodesText(e.target.value)} rows={14}
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-mono text-slate-800 focus:border-blue-400 focus:outline-none resize-none" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Links — <code className="text-[10px]">[{"{"}"source","target","relation"{"}"}]</code>
          </p>
          <textarea value={linksText} onChange={e => setLinksText(e.target.value)} rows={14}
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-mono text-slate-800 focus:border-blue-400 focus:outline-none resize-none" />
        </div>
      </div>
      <p className="text-[11px] text-slate-400">
        Tip: In links, use the exact label text from nodes in source/target (e.g. "General Manager (GM)"). Saving will update the chart for both admin and client immediately.
      </p>
    </div>
  );
}

// ─── Org card (super admin view) ──────────────────────────────────────────────

interface OrgCardProps {
  analysis: PublishedAnalysis;
  isSelected: boolean;
  onSelect: () => void;
}

function OrgCard({ analysis, isSelected, onSelect }: OrgCardProps) {
  const nodeCount = analysis.analysis?.organogram?.nodes?.length ?? 0;
  const deptCount = new Set(analysis.analysis?.organogram?.nodes?.map(n => n.group).filter(Boolean)).size;

  return (
    <button type="button" onClick={onSelect}
      className={`w-full text-left rounded-2xl border p-4 transition-all ${
        isSelected
          ? 'border-blue-400 bg-blue-50 shadow-md'
          : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
      }`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base ${
            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100'
          }`}>🏢</span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {analysis.recipientName ?? 'Unknown org'}
            </p>
            <p className="text-[10px] text-slate-400">
              {new Date(analysis.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              {analysis.publishedBy ? ` · ${analysis.publishedBy}` : ''}
            </p>
          </div>
        </div>
        {isSelected && <span className="shrink-0 text-blue-600 font-bold text-xs">▶ Viewing</span>}
      </div>
      <div className="flex gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">👤 {nodeCount} roles</span>
        <span className="inline-flex items-center gap-1">🏢 {deptCount} depts</span>
      </div>
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OrganogramPage() {
  const [isClient, setIsClient] = useState(false);
  const [clientRole, setClientRole] = useState(false);
  const [analyses, setAnalyses] = useState<PublishedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [editing, setEditing] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    setIsClient(true);
    setClientRole(checkClientAdmin());
  }, []);

  const loadAnalyses = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const isClientAdminRole = checkClientAdmin();
      const endpoint = isClientAdminRole ? '/published-analyses' : '/published-analyses/all';
      const data = await apiFetch<PublishedAnalysis[]>(endpoint);
      const withOrg = data.filter(
        pa => pa.analysis?.organogram?.nodes && pa.analysis.organogram.nodes.length > 0
      );
      setAnalyses(withOrg);
      if (withOrg.length > 0 && !selectedId) setSelectedId(withOrg[0].id);
    } catch (err: any) {
      setError(err?.message || 'Unable to load organogram data.');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => { if (isClient) loadAnalyses(); }, [isClient]);

  const selected = useMemo(
    () => analyses.find(a => a.id === selectedId) ?? null,
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

  async function handleSaveOrganogram(updated: Organogram) {
    if (!selected) return;
    await apiFetch(`/published-analyses/${selected.id}/organogram`, {
      method: 'PATCH',
      body: JSON.stringify({ organogram: updated }),
    });
    // Update local state immediately
    setAnalyses(prev => prev.map(a => {
      if (a.id !== selected.id) return a;
      return { ...a, analysis: { ...(a.analysis ?? {}), organogram: updated } };
    }));
    setEditing(false);
    setSaveMsg('Organogram saved and published to client.');
    setTimeout(() => setSaveMsg(''), 4000);
  }

  if (!isClient || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin mb-4" />
        <p className="text-sm text-slate-500">Loading organograms…</p>
      </div>
    );
  }

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>;
  }

  // ── CLIENT ADMIN view ────────────────────────────────────────────────────────
  if (clientRole) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">GISKonsult · Organisational Structure</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Organogram</h1>
          <p className="mt-1.5 text-sm text-slate-500">Your organisation's hierarchy and reporting structure.</p>
        </div>
        {analyses.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <EmptyState icon="🏢" title="No organogram available yet"
              description="Your organisational structure chart will appear here once it has been prepared by the GISKonsult team." />
          </div>
        ) : (
          <>
            {analyses.length > 1 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {analyses.map(a => (
                  <button key={a.id} type="button" onClick={() => setSelectedId(a.id)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                      selectedId === a.id ? 'bg-teal-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-400'
                    }`}>
                    📋 {new Date(a.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </button>
                ))}
              </div>
            )}
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                { label: 'Total Roles', value: orgRows.length, icon: '👤', grad: 'from-teal-500 to-emerald-600' },
                { label: 'Departments', value: departments.length, icon: '🏢', grad: 'from-blue-500 to-indigo-600' },
                { label: 'Report Date', value: selected ? new Date(selected.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—', icon: '📅', grad: 'from-violet-500 to-purple-600' },
              ].map(stat => (
                <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.grad} text-lg shadow-md`}>{stat.icon}</div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-5">Reporting Structure</h2>
              {orgRows.length > 0
                ? <OrgChart rows={orgRows} />
                : <EmptyState icon="🏢" title="No structure data" description="The organogram structure could not be loaded." />
              }
            </div>
          </>
        )}
      </div>
    );
  }

  // ── SUPER ADMIN view ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">Super Admin · Organograms</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Organisation Charts</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              View, edit, and publish organograms across all client organisations.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-teal-500" />
            <span className="text-sm font-bold text-slate-700">{analyses.length} organisation{analyses.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {saveMsg && (
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>✓</span>{saveMsg}
        </div>
      )}

      {analyses.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <EmptyState icon="🏢" title="No organograms yet"
            description="Organograms are generated when you publish an analysis that includes organisational structure data." />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
          {/* ── Left: Org list ── */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">Client organisations</p>
            {analyses.map(a => (
              <OrgCard key={a.id} analysis={a} isSelected={selectedId === a.id}
                onSelect={() => { setSelectedId(a.id); setEditing(false); }} />
            ))}
          </div>

          {/* ── Right: Chart panel ── */}
          <div className="space-y-5">
            {selected && (
              <>
                {/* Card header */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-bold text-slate-900">{selected.recipientName ?? 'Organisation'}</p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {orgRows.length} roles · {departments.length} departments
                      </p>
                      {selected.analysis?.executiveSummary && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed max-w-xl">
                          {selected.analysis.executiveSummary}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {!editing && (
                        <button type="button" onClick={() => setEditing(true)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm">
                          ✏️ Edit organogram
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Dept pills */}
                  {departments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
                      {departments.map((d, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">🏢 {d}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Edit panel */}
                {editing && selected.analysis?.organogram && (
                  <EditPanel
                    organogram={selected.analysis.organogram}
                    onSave={handleSaveOrganogram}
                    onCancel={() => setEditing(false)}
                  />
                )}

                {/* Chart */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm overflow-x-auto">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Reporting structure</p>
                  {orgRows.length > 0
                    ? <OrgChart rows={orgRows} />
                    : <EmptyState icon="🏢" title="No chart data" description="Edit the organogram to add nodes and links." />
                  }
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
