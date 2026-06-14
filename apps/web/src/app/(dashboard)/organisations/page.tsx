'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/ui/empty-state';
import { apiFetch } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Organisation {
  id: string;
  name: string;
  description?: string;
  sector?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  _count: { users: number; evaluations: number };
}

interface Form {
  id: string;
  title: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  questionCount: number;
  createdAt: string;
  evaluationId?: string;
}

interface Evaluation {
  id: string;
  title: string;
  status: string;
  organisation: { id: string; name: string };
  _count: { forms: number };
}

interface Unit {
  id: string;
  name: string;
  description?: string;
  organisation: { id: string; name: string };
  staffCount: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTOR_COLORS: Record<string, string> = {
  Government: 'from-blue-500 to-indigo-600',
  Finance:    'from-emerald-500 to-teal-600',
  Healthcare: 'from-pink-500 to-rose-600',
  Education:  'from-violet-500 to-purple-600',
  Technology: 'from-cyan-500 to-sky-600',
  default:    'from-primary to-primary/70',
};

function sectorGrad(sector?: string) {
  if (!sector) return SECTOR_COLORS.default;
  const key = Object.keys(SECTOR_COLORS).find(k => sector.toLowerCase().includes(k.toLowerCase()));
  return key ? SECTOR_COLORS[key] : SECTOR_COLORS.default;
}

const STATUS_FORM_CFG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  DRAFT:     { label: 'Draft',     bg: 'bg-slate-100',  text: 'text-slate-600',   dot: 'bg-slate-400' },
  PUBLISHED: { label: 'Published', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  CLOSED:    { label: 'Closed',    bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-500' },
};

// ─── Modals ───────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <p className="text-base font-bold text-slate-900">{title}</p>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Create form modal ────────────────────────────────────────────────────────

function CreateFormModal({ orgId, orgName, evaluations, onClose, onCreated }: {
  orgId: string; orgName: string;
  evaluations: Evaluation[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [evalId, setEvalId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const orgEvals = evaluations.filter(e => e.organisation.id === orgId);

  async function handleSubmit() {
    if (!title.trim() || !evalId) { setError('Title and project are required.'); return; }
    setSubmitting(true); setError('');
    try {
      await apiFetch('/forms', { method: 'POST', body: JSON.stringify({ evaluationId: evalId, title: title.trim() }) });
      onCreated();
    } catch (e: any) {
      setError(e?.message || 'Unable to create form.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={`Create form for ${orgName}`} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Project / Evaluation</label>
          <select value={evalId} onChange={e => setEvalId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none">
            <option value="">Select a project…</option>
            {orgEvals.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
          </select>
          {orgEvals.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">No projects found for this organisation. Create one first via <Link href="/evaluations/new" className="underline">Projects</Link>.</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Form title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. GIS Readiness Assessment"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none" />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition">
            {submitting ? 'Creating…' : 'Create form'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Create unit modal ────────────────────────────────────────────────────────

function CreateUnitModal({ orgId, orgName, onClose, onCreated }: {
  orgId: string; orgName: string; onClose: () => void; onCreated: (unit: Unit) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!name.trim()) { setError('Unit name is required.'); return; }
    setSubmitting(true); setError('');
    try {
      const created = await apiFetch<Unit>('/units', {
        method: 'POST',
        body: JSON.stringify({ organisationId: orgId, name: name.trim(), description: description.trim() }),
      });
      onCreated(created);
    } catch (e: any) {
      setError(e?.message || 'Unable to create unit.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={`Create unit for ${orgName}`} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Unit name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Finance & Accounts"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Description (optional)</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Brief description of this unit…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none resize-none" />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition">
            {submitting ? 'Creating…' : 'Create unit'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Org detail panel ─────────────────────────────────────────────────────────

function OrgDetailPanel({ org, forms, units, evaluations, onRefresh }: {
  org: Organisation;
  forms: Form[];
  units: Unit[];
  evaluations: Evaluation[];
  onRefresh: () => void;
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateUnit, setShowCreateUnit] = useState(false);
  const [activeTab, setActiveTab] = useState<'forms' | 'units'>('forms');

  const orgForms = forms.filter(f => {
    const ev = evaluations.find(e => e.id === f.evaluationId);
    return ev?.organisation?.id === org.id;
  });
  const orgUnits = units.filter(u => u.organisation?.id === org.id);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Panel header */}
      <div className={`h-1.5 bg-gradient-to-r ${sectorGrad(org.sector)}`} />
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-bold text-slate-900">{org.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{org.sector || 'No sector'} · {orgForms.length} form{orgForms.length !== 1 ? 's' : ''} · {orgUnits.length} unit{orgUnits.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowCreateUnit(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-100 transition">
              + Unit
            </button>
            <button type="button" onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary/90 transition shadow-sm">
              + Form
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        {([
          { id: 'forms' as const, label: `Forms (${orgForms.length})`, icon: '📋' },
          { id: 'units' as const, label: `Units (${orgUnits.length})`, icon: '🏗️' },
        ]).map(tab => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            <span>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Forms tab */}
        {activeTab === 'forms' && (
          orgForms.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-slate-400">No forms yet.</p>
              <button type="button" onClick={() => setShowCreateForm(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 transition">
                + Create first form
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {orgForms.map(form => {
                const cfg = STATUS_FORM_CFG[form.status] ?? STATUS_FORM_CFG.DRAFT;
                return (
                  <div key={form.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 hover:border-primary/30 transition">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">📋</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{form.title}</p>
                        <p className="text-[10px] text-slate-400">{form.questionCount} questions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                      </span>
                      <Link href={`/forms/${form.id}`}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition">
                        Edit →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Units tab */}
        {activeTab === 'units' && (
          orgUnits.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-slate-400">No units yet.</p>
              <button type="button" onClick={() => setShowCreateUnit(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700 transition">
                + Create first unit
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {orgUnits.map(unit => (
                <div key={unit.id} className="flex items-center justify-between gap-3 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">🏗️</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{unit.name}</p>
                      {unit.description && <p className="text-[10px] text-slate-500 truncate">{unit.description}</p>}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{unit.staffCount ?? 0} staff</span>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Modals */}
      {showCreateForm && (
        <CreateFormModal
          orgId={org.id} orgName={org.name} evaluations={evaluations}
          onClose={() => setShowCreateForm(false)}
          onCreated={() => { setShowCreateForm(false); onRefresh(); }}
        />
      )}
      {showCreateUnit && (
        <CreateUnitModal
          orgId={org.id} orgName={org.name}
          onClose={() => setShowCreateUnit(false)}
          onCreated={() => { setShowCreateUnit(false); onRefresh(); }}
        />
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OrganisationsPage() {
  const router = useRouter();
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [orgs, fms, evs, uns] = await Promise.all([
        apiFetch<Organisation[]>('/organisations'),
        apiFetch<Form[]>('/forms').catch(() => [] as Form[]),
        apiFetch<Evaluation[]>('/evaluations').catch(() => [] as Evaluation[]),
        apiFetch<Unit[]>('/units').catch(() => [] as Unit[]),
      ]);
      setOrganisations(orgs);
      setForms(fms);
      setEvaluations(evs);
      setUnits(uns);
    } catch {
      // silently degrade
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function deleteOrg(id: string) {
    if (!window.confirm('Delete this organisation? This cannot be undone.')) return;
    try {
      await apiFetch(`/organisations/${id}`, { method: 'DELETE' });
      setOrganisations(prev => prev.filter(o => o.id !== id));
      if (selectedOrgId === id) setSelectedOrgId(null);
    } catch (e: any) {
      window.alert(e?.message || 'Unable to delete.');
    }
  }

  const filtered = organisations.filter(o =>
    !search || o.name.toLowerCase().includes(search.toLowerCase()) || (o.sector ?? '').toLowerCase().includes(search.toLowerCase())
  );
  const active = organisations.filter(o => o.status === 'ACTIVE');
  const selectedOrg = organisations.find(o => o.id === selectedOrgId) ?? null;

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
          <p className="mt-1.5 text-sm text-slate-500">Manage client organisations, their forms, and units.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/forms/new"
            className="inline-flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-800 hover:bg-amber-100 transition shadow-sm">
            + Create Form
          </Link>
          <Link href="/organisations/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary/80 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all">
            + Create Organisation
          </Link>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total',       value: organisations.length, icon: '🏢', grad: 'from-blue-500 to-indigo-600' },
          { label: 'Active',      value: active.length,        icon: '✅', grad: 'from-emerald-400 to-green-600' },
          { label: 'Total forms', value: forms.length,         icon: '📋', grad: 'from-amber-400 to-orange-500' },
          { label: 'Units',       value: units.length,         icon: '🏗️', grad: 'from-violet-500 to-purple-600' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.grad} text-lg shadow-md`}>{s.icon}</div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="mb-6">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search organisations…"
          className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      {/* ── Two-column layout: list + detail ── */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 animate-pulse">
              <div className="h-4 w-2/3 rounded-lg bg-slate-200" />
              <div className="h-3 w-1/2 rounded-lg bg-slate-100" />
              <div className="h-14 rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="🏢" title="No organisations" description="Create your first client organisation." actionLabel="Create Organisation" onAction={() => router.push('/organisations/new')} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          {/* Org grid */}
          <div className="grid gap-4 sm:grid-cols-2 content-start">
            {filtered.map(org => (
              <button key={org.id} type="button"
                onClick={() => setSelectedOrgId(selectedOrgId === org.id ? null : org.id)}
                className={`group relative flex flex-col rounded-3xl border text-left shadow-sm transition-all overflow-hidden ${
                  selectedOrgId === org.id
                    ? 'border-primary/50 bg-white shadow-lg ring-2 ring-primary/20'
                    : 'border-slate-200 bg-white hover:border-primary/30 hover:shadow-md'
                }`}>
                <div className={`h-1.5 bg-gradient-to-r ${sectorGrad(org.sector)}`} />
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${sectorGrad(org.sector)} text-white text-base shadow-md`}>🏢</div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{org.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{org.sector || 'No sector'}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold ${
                      org.status === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-400'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${org.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      {org.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-auto pt-3 border-t border-slate-100">
                    <span>👥 {org._count.users} users</span>
                    <span>📋 {org._count.evaluations} projects</span>
                    <button type="button" onClick={e => { e.stopPropagation(); deleteOrg(org.id); }}
                      className="opacity-0 group-hover:opacity-100 rounded-lg p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all" aria-label="Delete">
                      🗑️
                    </button>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Detail panel */}
          <div className="xl:sticky xl:top-6 xl:self-start">
            {selectedOrg ? (
              <OrgDetailPanel
                org={selectedOrg}
                forms={forms}
                units={units}
                evaluations={evaluations}
                onRefresh={loadAll}
              />
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <span className="text-4xl mb-3 block">🏢</span>
                <p className="text-sm font-semibold text-slate-500">Click an organisation to view its forms and units</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
