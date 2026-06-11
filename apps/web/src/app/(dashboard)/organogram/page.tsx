'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import OrgChart from '@/components/organogram/OrgChart';
import { EmptyState } from '@/components/ui/empty-state';
import type { OrgRow } from '@/components/organogram/OrgChartUploader';
import { isClientAdmin } from '@/lib/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Organisation { id: string; name: string; }

interface UserSummary {
  id: string; email: string; name: string; role: string; organisation: Organisation;
}

interface OrgNode { id?: string; label?: string; group?: string; }
interface OrgLink { source?: string; target?: string; relation?: string; }

interface PublishedAnalysis {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  recipientId?: string;
  recipientName?: string;
  evaluationId?: string | null;
  summary: string;
  analysis: {
    organogram?: { nodes?: OrgNode[]; links?: OrgLink[] };
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

// Convert OrgRow[] back to nodes/links for saving
function orgRowsToOrgData(rows: OrgRow[]): { nodes: OrgNode[]; links: OrgLink[] } {
  const nodes: OrgNode[] = rows.map((r, i) => ({
    id: String(i + 1),
    label: r.name,
    group: r.title ?? '',
  }));
  const labelToId = new Map(nodes.map(n => [n.label!, n.id!]));
  const links: OrgLink[] = rows
    .filter(r => r.reportsTo)
    .map(r => ({
      source: labelToId.get(r.name) ?? r.name,
      target: labelToId.get(r.reportsTo ?? '') ?? r.reportsTo ?? '',
      relation: 'reports to',
    }));
  return { nodes, links };
}

// ─── Inline editor for organogram rows ───────────────────────────────────────

interface EditorRow { name: string; title: string; reportsTo: string; }

function OrgEditor({
  rows, onChange,
}: {
  rows: EditorRow[];
  onChange: (rows: EditorRow[]) => void;
}) {
  function update(i: number, field: keyof EditorRow, val: string) {
    const next = rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r);
    onChange(next);
  }
  function addRow() {
    onChange([...rows, { name: '', title: '', reportsTo: '' }]);
  }
  function removeRow(i: number) {
    onChange(rows.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_1fr_1fr_36px] gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
        <span>Role / Name</span><span>Department</span><span>Reports To</span><span />
      </div>
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_1fr_36px] gap-2 items-center">
          <input value={row.name} onChange={e => update(i, 'name', e.target.value)}
            placeholder="Role name"
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
          <input value={row.title} onChange={e => update(i, 'title', e.target.value)}
            placeholder="Department"
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
          <select value={row.reportsTo} onChange={e => update(i, 'reportsTo', e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30">
            <option value="">— Root (no parent) —</option>
            {rows.filter((_, idx) => idx !== i).map((r, j) => (
              <option key={j} value={r.name}>{r.name || `Row ${j + 1}`}</option>
            ))}
          </select>
          <button type="button" onClick={() => removeRow(i)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition text-sm font-bold">
            ✕
          </button>
        </div>
      ))}
      <button type="button" onClick={addRow}
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
        + Add row
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OrganogramPage() {
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [orgName, setOrgName] = useState('');
  const [analyses, setAnalyses] = useState<PublishedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Super admin state
  const [selectedId, setSelectedId] = useState<string>('');
  const [editing, setEditing] = useState(false);
  const [editorRows, setEditorRows] = useState<EditorRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('accessToken');
      if (!token) { setError('Please sign in.'); setLoading(false); return; }

      let userId = '';
      try { userId = JSON.parse(atob(token.split('.')[1])).sub; }
      catch { setError('Session error.'); setLoading(false); return; }

      try {
        const user = await apiFetch<UserSummary>(`/users/${userId}`);
        const superAdmin = !isClientAdmin() && user.role === 'SUPER_ADMIN';
        setIsSuperAdmin(superAdmin);
        setOrgName(user.organisation?.name ?? '');

        const endpoint = superAdmin ? '/published-analyses/all' : '/published-analyses';
        const allPublished = await apiFetch<PublishedAnalysis[]>(endpoint);

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

  // Start editing — copy current rows into editor
  function startEdit() {
    setEditorRows(orgRows.map(r => ({ name: r.name, title: r.title ?? '', reportsTo: r.reportsTo ?? '' })));
    setEditing(true);
    setSaveMsg('');
  }

  function cancelEdit() {
    setEditing(false);
    setEditorRows([]);
    setSaveMsg('');
  }

  // Preview of the edited rows as OrgRow[]
  const previewRows: OrgRow[] = useMemo(
    () => editorRows.map(r => ({ name: r.name, title: r.title, reportsTo: r.reportsTo })),
    [editorRows]
  );

  async function saveOrganogram() {
    if (!selected) return;
    setSaving(true); setSaveMsg('');
    try {
      const organogram = orgRowsToOrgData(editorRows);
      await apiFetch(`/published-analyses/${selected.id}/organogram`, {
        method: 'PATCH',
        body: JSON.stringify({ organogram }),
      });
      // Update local state so the chart refreshes immediately
      setAnalyses(prev => prev.map(a => {
        if (a.id !== selected.id) return a;
        return {
          ...a,
          analysis: { ...a.analysis, organogram },
        };
      }));
      setSaveMsg('Organogram saved successfully.');
      setEditing(false);
    } catch (err: any) {
      setSaveMsg(err?.message || 'Unable to save organogram.');
    } finally {
      setSaving(false);
    }
  }

  // ── Loading / error ───────────────────────────────────────────────────────

  if (loading || isSuperAdmin === null) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin mb-4" />
        <p className="text-sm text-slate-500">Loading organogram…</p>
      </div>
    );
  }

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 font-medium">{error}</div>;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const headerLabel = isSuperAdmin ? 'Super Admin · All Organisations' : 'GISKonsult · Organisational Structure';
  const headerTitle = isSuperAdmin ? 'All Organisation Organograms' : 'Organogram';
  const headerDesc = isSuperAdmin
    ? 'View and edit organisational structures across all client accounts.'
    : `Organisational hierarchy and reporting structure${orgName ? ` for ${orgName}` : ''}.`;

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">{headerLabel}</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{headerTitle}</h1>
            <p className="mt-1.5 text-sm text-slate-500">{headerDesc}</p>
          </div>
          {!isSuperAdmin && orgName && (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-sm font-bold text-slate-800">{orgName}</span>
            </div>
          )}
          {isSuperAdmin && (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-fuchsia-500 animate-pulse" />
              <span className="text-sm font-bold text-slate-800">{analyses.length} organogram{analyses.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {analyses.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <EmptyState icon="🏢" title="No organograms available"
            description={isSuperAdmin
              ? "No published analyses with organogram data exist yet. Publish an analysis with organogram data from the GISKonsult Analytics page."
              : "Your organisational structure chart will appear here once it has been prepared by the GISKonsult team."} />
        </div>
      ) : (
        <>
          {/* ── Organisation / analysis selector ── */}
          <div className="mb-6 flex flex-wrap gap-2">
            {analyses.map(a => (
              <button key={a.id} type="button"
                onClick={() => { setSelectedId(a.id); setEditing(false); setSaveMsg(''); }}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                  selectedId === a.id
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-400 hover:text-teal-700'
                }`}>
                🏢
                {isSuperAdmin && a.recipientName ? `${a.recipientName} · ` : ''}
                {new Date(a.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </button>
            ))}
          </div>

          {/* ── Stats ── */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { label: 'Total Roles',  value: editing ? editorRows.length : orgRows.length, icon: '👤', grad: 'from-teal-500 to-emerald-600' },
              { label: 'Departments',  value: editing ? [...new Set(editorRows.map(r => r.title).filter(Boolean))].length : departments.length, icon: '🏢', grad: 'from-blue-500 to-indigo-600' },
              { label: 'Report Date',  value: selected ? new Date(selected.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—', icon: '📅', grad: 'from-violet-500 to-purple-600' },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.grad} text-lg shadow-md`}>{stat.icon}</div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* ── Save message ── */}
          {saveMsg && (
            <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-medium ${
              saveMsg.includes('success') ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'
            }`}>
              {saveMsg.includes('success') ? '✓ ' : '⚠ '}{saveMsg}
            </div>
          )}

          {/* ── Main card ── */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {isSuperAdmin && selected?.recipientName ? `${selected.recipientName} — ` : ''}Reporting Structure
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {editing ? `Editing ${editorRows.length} roles` : `${orgRows.length} roles across ${departments.length} department${departments.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <div className="flex gap-2">
                {isSuperAdmin && !editing && (
                  <button type="button" onClick={startEdit}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 transition shadow-sm">
                    ✏️ Edit organogram
                  </button>
                )}
                {isSuperAdmin && editing && (
                  <>
                    <button type="button" onClick={cancelEdit}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
                      Cancel
                    </button>
                    <button type="button" onClick={saveOrganogram} disabled={saving}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm">
                      {saving ? (
                        <><span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />Saving…</>
                      ) : '💾 Save & publish'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ── Editor ── */}
            {isSuperAdmin && editing ? (
              <div className="space-y-6">
                <OrgEditor rows={editorRows} onChange={setEditorRows} />
                {previewRows.filter(r => r.name).length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Live preview</p>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <OrgChart rows={previewRows.filter(r => r.name)} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              orgRows.length > 0 ? (
                <OrgChart rows={orgRows} />
              ) : (
                <EmptyState icon="🏢" title="No structure data" description="The organogram structure could not be loaded." />
              )
            )}
          </div>

          {/* ── Department list ── */}
          {departments.length > 0 && !editing && (
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
