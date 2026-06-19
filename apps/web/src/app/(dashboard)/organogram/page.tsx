'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { isClientAdmin as checkClientAdmin } from '@/lib/auth';
import OrgChart from '@/components/organogram/OrgChart';
import { EmptyState } from '@/components/ui/empty-state';
import { AppIcon } from '@/components/ui/app-icons';
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
    gaps?: string[];
    recommendations?: string[];
    actionPlan?: Array<{ who?: string; what?: string; how?: string; when?: string }>;
  } | null;
}

interface OrganisationOption {
  id: string;
  name: string;
  sector?: string | null;
}

interface OrganogramIntakeResponse {
  id: string;
  organisationId: string;
  organisationName: string;
  submittedAt: string;
  submittedBy?: { name?: string | null; role?: string | null } | null;
  intake: unknown;
  prompt: string;
  publishedAt?: string | null;
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

function buildStructureInsights(rows: OrgRow[], analysis?: PublishedAnalysis['analysis'] | null) {
  const departments = [...new Set(rows.map(r => r.title).filter((value): value is string => Boolean(value)))];
  const roots = rows.filter(row => !row.reportsTo);
  const childCounts = new Map<string, number>();
  rows.forEach(row => {
    if (!row.reportsTo) return;
    childCounts.set(row.reportsTo, (childCounts.get(row.reportsTo) || 0) + 1);
  });
  const overloadedManagers = Array.from(childCounts.entries())
    .filter(([, count]) => count >= 4)
    .map(([name, count]) => ({ name, count }));
  const singlePersonDepartments = departments
    .map(department => ({ department, count: rows.filter(row => row.title === department).length }))
    .filter(item => item.count === 1);
  const actionPlan = Array.isArray(analysis?.actionPlan) ? analysis.actionPlan : [];
  const recommendations = Array.isArray(analysis?.recommendations) ? analysis.recommendations : [];
  const gaps = Array.isArray(analysis?.gaps) ? analysis.gaps : [];

  const ownershipItems = [...actionPlan.map(item => ({
    title: item.what || 'Action item',
    owner: item.who || inferOwnerFromText(item.what || item.how || '', departments),
    detail: item.how || item.when || '',
  })), ...recommendations.slice(0, 4).map(item => ({
    title: item,
    owner: inferOwnerFromText(item, departments),
    detail: 'Recommendation from published analysis',
  }))].slice(0, 8);

  const insightNotes = [
    roots.length > 1
      ? `${roots.length} top-level roles are visible. Confirm whether these all report to the same executive sponsor.`
      : roots.length === 1
        ? `${roots[0].name} appears to be the top accountability owner.`
        : 'No top-level role was detected.',
    overloadedManagers.length > 0
      ? `${overloadedManagers.length} manager${overloadedManagers.length === 1 ? '' : 's'} may have a wide span of control.`
      : 'No obvious wide-span manager was detected.',
    singlePersonDepartments.length > 0
      ? `${singlePersonDepartments.length} department${singlePersonDepartments.length === 1 ? '' : 's'} appear to depend on one named role.`
      : 'Departments have more than one visible role where listed.',
    gaps.length > 0
      ? `${gaps.length} published gap${gaps.length === 1 ? '' : 's'} can be mapped back to structure owners.`
      : 'No published gaps are attached to this organogram yet.',
  ];

  return {
    departments,
    roots,
    overloadedManagers,
    singlePersonDepartments,
    ownershipItems,
    insightNotes,
  };
}

function inferOwnerFromText(text: string, departments: string[]) {
  const lower = String(text || '').toLowerCase();
  const matchedDepartment = departments.find(department => lower.includes(department.toLowerCase()));
  if (matchedDepartment) return matchedDepartment;
  if (lower.includes('data')) return 'Data / Governance owner';
  if (lower.includes('gis') || lower.includes('geospatial')) return 'GIS / Geospatial lead';
  if (lower.includes('infrastructure') || lower.includes('network') || lower.includes('system')) return 'IT / Infrastructure lead';
  if (lower.includes('training') || lower.includes('skill')) return 'HR / Capability lead';
  if (lower.includes('policy') || lower.includes('governance')) return 'Leadership / Governance owner';
  return 'Executive sponsor';
}

function StructureInsightPanel({ rows, analysis }: { rows: OrgRow[]; analysis?: PublishedAnalysis['analysis'] | null }) {
  const insights = useMemo(() => buildStructureInsights(rows, analysis), [rows, analysis]);
  const [copied, setCopied] = useState(false);

  async function copyOwnershipBrief() {
    const text = [
      'Use this organogram to connect structure, accountability, and analysis recommendations.',
      '',
      `Roles: ${rows.length}`,
      `Departments: ${insights.departments.length}`,
      `Top-level roles: ${insights.roots.map(row => row.name).join(', ') || 'None detected'}`,
      `Wide-span managers: ${insights.overloadedManagers.map(item => `${item.name} (${item.count} direct reports)`).join(', ') || 'None detected'}`,
      '',
      'Ownership map:',
      ...(insights.ownershipItems.length > 0
        ? insights.ownershipItems.map(item => `- ${item.title}\n  Owner: ${item.owner}\n  Detail: ${item.detail || 'No detail provided'}`)
        : ['- No action plan or recommendation ownership data yet.']),
      '',
      'Structure notes:',
      ...insights.insightNotes.map(note => `- ${note}`),
    ].join('\n');

    await navigator.clipboard.writeText(text).catch(() => window.prompt('Copy this organogram ownership brief:', text));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-teal-600">Structure insight</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">Accountability and ownership map</h2>
          <p className="mt-1 text-sm text-slate-500">Use the organogram to see who should own gaps, recommendations, and action items.</p>
        </div>
        <button type="button" onClick={copyOwnershipBrief} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800">
          <AppIcon name={copied ? 'check' : 'copy'} className="h-4 w-4 text-white" />
          {copied ? 'Brief copied' : 'Copy ownership brief'}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: 'Roles', value: rows.length, icon: 'users' as const, tone: 'bg-blue-50 text-blue-700' },
          { label: 'Departments', value: insights.departments.length, icon: 'building' as const, tone: 'bg-teal-50 text-teal-700' },
          { label: 'Top owners', value: insights.roots.length, icon: 'sitemap' as const, tone: 'bg-violet-50 text-violet-700' },
          { label: 'Wide spans', value: insights.overloadedManagers.length, icon: 'activity' as const, tone: 'bg-amber-50 text-amber-700' },
        ].map(metric => (
          <div key={metric.label} className={`${metric.tone} p-4`}>
            <AppIcon name={metric.icon} className="mb-2 h-5 w-5" />
            <p className="text-2xl font-black">{metric.value}</p>
            <p className="text-xs font-bold uppercase">{metric.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="bg-slate-50 p-4">
          <p className="mb-3 text-sm font-bold text-slate-900">What the structure is telling us</p>
          <div className="space-y-2">
            {insights.insightNotes.map((note, index) => (
              <div key={index} className="flex gap-2 bg-white p-3 text-sm text-slate-700">
                <AppIcon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-950 p-4 text-white">
          <p className="mb-3 text-sm font-bold text-white">Recommendation ownership</p>
          {insights.ownershipItems.length > 0 ? (
            <div className="space-y-2">
              {insights.ownershipItems.map((item, index) => (
                <div key={index} className="bg-white/10 p-3">
                  <p className="text-sm font-bold text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-teal-200">Owner: {item.owner}</p>
                  {item.detail ? <p className="mt-1 text-xs text-slate-300">{item.detail}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-300">Publish an analysis with recommendations or action items to map ownership here.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function buildOrganogramReportSections(rows: OrgRow[], analysis?: PublishedAnalysis['analysis'] | null) {
  const insights = buildStructureInsights(rows, analysis);
  return [
    {
      heading: 'Structure insights',
      lines: insights.insightNotes,
    },
    {
      heading: 'Recommendation ownership',
      lines: insights.ownershipItems.length > 0
        ? insights.ownershipItems.map(item => `${item.title} - Owner: ${item.owner}${item.detail ? ` - ${item.detail}` : ''}`)
        : ['No recommendation ownership has been published yet.'],
    },
    {
      heading: 'Departments',
      lines: insights.departments.length > 0 ? insights.departments : ['No departments were detected.'],
    },
  ];
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
  onDelete: () => void;
}

function OrgCard({ analysis, isSelected, onSelect, onDelete }: OrgCardProps) {
  const nodeCount = analysis.analysis?.organogram?.nodes?.length ?? 0;
  const deptCount = new Set(analysis.analysis?.organogram?.nodes?.map(n => n.group).filter(Boolean)).size;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      className={`w-full rounded-2xl border p-4 transition-all ${
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
        <div className="flex shrink-0 items-center gap-2">
          {isSelected && <span className="text-blue-600 font-bold text-xs">Viewing</span>}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className="rounded-lg border border-red-100 bg-white px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="flex gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">👤 {nodeCount} roles</span>
        <span className="inline-flex items-center gap-1">🏢 {deptCount} depts</span>
      </div>
    </div>
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
  const [organisations, setOrganisations] = useState<OrganisationOption[]>([]);
  const [selectedOrganisationId, setSelectedOrganisationId] = useState('');
  const [intakeLink, setIntakeLink] = useState('');
  const [intakeResponses, setIntakeResponses] = useState<OrganogramIntakeResponse[]>([]);
  const [intakeLoading, setIntakeLoading] = useState(false);
  const [intakeMsg, setIntakeMsg] = useState('');
  const [publishingResponseId, setPublishingResponseId] = useState('');
  const [organogramDrafts, setOrganogramDrafts] = useState<Record<string, string>>({});

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

  const loadIntakeResponses = useCallback(async () => {
    setIntakeLoading(true);
    try {
      const responses = await apiFetch<OrganogramIntakeResponse[]>('/organogram-intake-responses');
      setIntakeResponses(responses);
    } catch {
      setIntakeResponses([]);
    } finally {
      setIntakeLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isClient || clientRole) return;

    async function loadAdminIntakeData() {
      try {
        const orgs = await apiFetch<OrganisationOption[]>('/organisations');
        setOrganisations(orgs);
        if (orgs.length > 0) setSelectedOrganisationId(prev => prev || orgs[0].id);
      } catch {
        setOrganisations([]);
      }
      loadIntakeResponses();
    }

    loadAdminIntakeData();
  }, [clientRole, isClient, loadIntakeResponses]);

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

  async function deletePublishedAnalysis(id: string) {
    if (!window.confirm('Delete this published organogram?')) return;

    await apiFetch(`/published-analyses/${id}`, { method: 'DELETE' });
    setAnalyses(prev => {
      const next = prev.filter(item => item.id !== id);
      if (selectedId === id) setSelectedId(next[0]?.id ?? '');
      return next;
    });
    setEditing(false);
    setSaveMsg('Published organogram deleted.');
    setTimeout(() => setSaveMsg(''), 4000);
  }

  async function createIntakeLink() {
    if (!selectedOrganisationId) {
      setIntakeMsg('Please select an organisation first.');
      return;
    }

    setIntakeMsg('');
    const created = await apiFetch<{ token: string }>('/organogram-intake-links', {
      method: 'POST',
      body: JSON.stringify({ organisationId: selectedOrganisationId }),
    });
    const link = `${window.location.origin}/organogram-intake?token=${created.token}`;
    setIntakeLink(link);
    await navigator.clipboard.writeText(link).catch(() => undefined);
    setIntakeMsg('Link created and copied. Send it to the person filling the structure.');
  }

  async function copyText(text: string, message: string) {
    await navigator.clipboard.writeText(text);
    setIntakeMsg(message);
    setTimeout(() => setIntakeMsg(''), 3500);
  }

  async function publishIntakeOrganogram(response: OrganogramIntakeResponse) {
    const raw = organogramDrafts[response.id] || '';
    if (!raw.trim()) {
      setIntakeMsg('Paste the organogram JSON from ChatGPT or Claude before publishing.');
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      setIntakeMsg('The pasted organogram is not valid JSON.');
      return;
    }

    const organogram = parsed.organogram ?? parsed;
    if (!Array.isArray(organogram.nodes) || !Array.isArray(organogram.links)) {
      setIntakeMsg('JSON must include organogram.nodes and organogram.links arrays.');
      return;
    }

    setPublishingResponseId(response.id);
    try {
      const result = await apiFetch<{ message: string }>(`/organogram-intake-responses/${response.id}/publish`, {
        method: 'POST',
        body: JSON.stringify({ organogram }),
      });
      setIntakeMsg(result.message || 'Organogram published.');
      await loadIntakeResponses();
      await loadAnalyses();
    } catch (err: any) {
      setIntakeMsg(err?.message || 'Unable to publish organogram.');
    } finally {
      setPublishingResponseId('');
    }
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
            <div className="mb-6">
              <StructureInsightPanel rows={orgRows} analysis={selected?.analysis} />
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-5">Reporting Structure</h2>
              {orgRows.length > 0
                ? <OrgChart
                    rows={orgRows}
                    reportTitle={`${selected?.recipientName || 'Organisation'} organogram report`}
                    reportSummary={selected?.analysis?.executiveSummary || 'Organisational structure and accountability report.'}
                    reportSections={buildOrganogramReportSections(orgRows, selected?.analysis)}
                  />
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
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/organogram-intake"
            target="_blank"
            className="inline-flex items-center justify-center rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-800 transition hover:bg-teal-100"
          >
            Open standalone intake form
          </Link>
          <p className="flex items-center text-xs font-medium text-slate-500">
            Send this to a CEO or HR lead, then paste the generated prompt into ChatGPT or Claude.
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-teal-600">Standalone organogram form</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Create a client-specific intake link</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Select an organisation you already created, copy the link, and send it to the CEO or HR lead. Their response will appear below for AI conversion and publishing.
            </p>
          </div>
          <Link
            href="/organisations/new"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            Create organisation
          </Link>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(220px,360px)_auto_1fr] lg:items-end">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Organisation</span>
            <select
              value={selectedOrganisationId}
              onChange={(event) => { setSelectedOrganisationId(event.target.value); setIntakeLink(''); }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            >
              <option value="">Select organisation</option>
              {organisations.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={createIntakeLink}
            disabled={!selectedOrganisationId}
            className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            Generate copy link
          </button>
          {intakeLink && (
            <div className="flex min-w-0 gap-2 rounded-xl border border-teal-100 bg-teal-50 p-2">
              <input readOnly value={intakeLink} className="min-w-0 flex-1 bg-transparent px-2 text-xs font-semibold text-teal-900 outline-none" />
              <button type="button" onClick={() => copyText(intakeLink, 'Link copied.')} className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-teal-700">
                Copy
              </button>
            </div>
          )}
        </div>

        {intakeMsg && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            {intakeMsg}
          </div>
        )}

        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Submitted organogram responses</h3>
              <p className="text-sm text-slate-500">Copy the AI prompt, paste the generated organogram JSON back here, then publish to the organisation account.</p>
            </div>
            <button type="button" onClick={loadIntakeResponses} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
              Refresh
            </button>
          </div>

          {intakeLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">Loading responses...</div>
          ) : intakeResponses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">No submitted organogram responses yet.</div>
          ) : (
            <div className="space-y-4">
              {intakeResponses.map((response) => (
                <div key={response.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{response.organisationName}</p>
                      <p className="text-xs text-slate-500">
                        Submitted {new Date(response.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {response.submittedBy?.name ? ` by ${response.submittedBy.name}` : ''}
                        {response.submittedBy?.role ? ` (${response.submittedBy.role})` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {response.publishedAt && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Published</span>}
                      <button type="button" onClick={() => copyText(JSON.stringify(response.intake, null, 2), 'Raw response copied.')} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">
                        Copy response
                      </button>
                      <button type="button" onClick={() => copyText(response.prompt, 'AI prompt copied. Paste it into ChatGPT or Claude.')} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white">
                        Copy response + prompt
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={organogramDrafts[response.id] ?? ''}
                    onChange={(event) => setOrganogramDrafts(prev => ({ ...prev, [response.id]: event.target.value }))}
                    rows={7}
                    placeholder='Paste ChatGPT/Claude JSON here, e.g. {"organogram":{"nodes":[...],"links":[...]}}'
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => publishIntakeOrganogram(response)}
                      disabled={publishingResponseId === response.id}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      {publishingResponseId === response.id ? 'Publishing...' : 'Publish organogram to organisation'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                onSelect={() => { setSelectedId(a.id); setEditing(false); }}
                onDelete={() => deletePublishedAnalysis(a.id)} />
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

                <StructureInsightPanel rows={orgRows} analysis={selected.analysis} />

                {/* Edit panel */}
                {editing && selected.analysis?.organogram && (
                  <EditPanel
                    organogram={selected.analysis.organogram}
                    onSave={handleSaveOrganogram}
                    onCancel={() => setEditing(false)}
                  />
                )}

                {/* Chart */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Reporting structure</p>
                  {orgRows.length > 0
                    ? <OrgChart
                        rows={orgRows}
                        reportTitle={`${selected.recipientName || 'Organisation'} organogram report`}
                        reportSummary={selected.analysis?.executiveSummary || 'Organisational structure and accountability report.'}
                        reportSections={buildOrganogramReportSections(orgRows, selected.analysis)}
                      />
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
