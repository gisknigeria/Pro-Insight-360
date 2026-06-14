'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { EmptyState } from '@/components/ui/empty-state';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Organisation {
  id: string;
  name: string;
  sector?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  _count: { users: number; evaluations: number };
}

interface Evaluation {
  id: string;
  title: string;
  status: string;
  startDate?: string | null;
  organisation: { id: string; name: string };
  _count: { forms: number };
}

interface Form {
  id: string;
  title: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  questionCount: number;
  createdAt: string;
  evaluationId?: string;
  organisationId?: string;
  unitId?: string | null;
  unitName?: string | null;
}

interface Unit {
  id: string;
  name: string;
  description?: string;
  organisation: { id: string; name: string };
  staffCount?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SECTOR_GRAD: Record<string, string> = {
  Government:  'from-blue-500 to-indigo-600',
  Finance:     'from-emerald-500 to-teal-600',
  Healthcare:  'from-pink-500 to-rose-600',
  Education:   'from-violet-500 to-purple-600',
  Technology:  'from-cyan-500 to-sky-600',
  default:     'from-primary to-primary/70',
};
function sectorGrad(s?: string) {
  if (!s) return SECTOR_GRAD.default;
  const k = Object.keys(SECTOR_GRAD).find(k => s.toLowerCase().includes(k.toLowerCase()));
  return k ? SECTOR_GRAD[k] : SECTOR_GRAD.default;
}

const STATUS_EV: Record<string, { label: string; cls: string }> = {
  DRAFT:    { label: 'Draft',    cls: 'bg-slate-100 text-slate-600' },
  ACTIVE:   { label: 'Active',   cls: 'bg-emerald-50 text-emerald-700' },
  CLOSED:   { label: 'Closed',   cls: 'bg-orange-50 text-orange-700' },
  ARCHIVED: { label: 'Archived', cls: 'bg-slate-50 text-slate-400' },
};
const STATUS_FM: Record<string, { label: string; dot: string; cls: string }> = {
  DRAFT:     { label: 'Draft',     dot: 'bg-slate-400',   cls: 'bg-slate-100 text-slate-600' },
  PUBLISHED: { label: 'Published', dot: 'bg-emerald-500', cls: 'bg-emerald-50 text-emerald-700' },
  CLOSED:    { label: 'Closed',    dot: 'bg-orange-500',  cls: 'bg-orange-50 text-orange-700' },
};

function isFormBucketEvaluation(evaluation: Evaluation) {
  return ['general', 'forms'].includes(evaluation.title.trim().toLowerCase()) && !evaluation.startDate;
}

// ─── Create unit modal ────────────────────────────────────────────────────────

function CreateUnitModal({ orgId, orgName, onClose, onCreated }: {
  orgId: string; orgName: string; onClose: () => void; onCreated: (unit: Unit) => void;
}) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function save() {
    if (!name.trim()) { setErr('Unit name required.'); return; }
    setSaving(true); setErr('');
    try {
      const created = await apiFetch<Unit>('/units', { method: 'POST', body: JSON.stringify({ organisationId: orgId, name: name.trim(), description: desc.trim() }) });
      onCreated(created);
    } catch (e: any) { setErr(e?.message || 'Failed.'); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="font-bold text-slate-900 text-sm">Create unit — {orgName}</p>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Unit name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Finance & Accounts"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Description (optional)</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none resize-none" />
          </div>
          {err && <p className="text-xs text-red-600">{err}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving}
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition">
              {saving ? 'Creating…' : 'Create unit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Org detail panel ─────────────────────────────────────────────────────────

function OrgDetail({ org, forms, units, evaluations, onRefresh, onDeleteUnit, onDeleteEval, onDeleteForm, onAddUnit }: {
  org: Organisation;
  forms: Form[];
  units: Unit[];
  evaluations: Evaluation[];
  onRefresh: () => void;
  onDeleteUnit: (id: string) => void;
  onDeleteEval: (id: string) => void;
  onDeleteForm: (id: string) => void;
  onAddUnit: (unit: Unit) => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<'forms' | 'units' | 'projects'>('projects');
  const [showUnit, setShowUnit] = useState(false);

  const allOrgEvals = evaluations.filter(e => e.organisation?.id === org.id);
  const orgEvals = allOrgEvals.filter(e => !isFormBucketEvaluation(e));
  const orgUnits = units.filter(u => u.organisation?.id === org.id);
  const orgForms = forms.filter(f =>
    f.organisationId === org.id || allOrgEvals.some(e => e.id === f.evaluationId)
  );

  const tabs = [
    { id: 'projects' as const, label: `Projects (${orgEvals.length})`, icon: '📁' },
    { id: 'forms'   as const, label: `Forms (${orgForms.length})`,    icon: '📋' },
    { id: 'units'   as const, label: `Units (${orgUnits.length})`,     icon: '🏗️' },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Colour strip */}
      <div className={`h-1 bg-gradient-to-r ${sectorGrad(org.sector)}`} />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <div>
          <p className="text-sm font-bold text-slate-900">{org.name}</p>
          <p className="text-xs text-slate-400">{org.sector || 'No sector'}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowUnit(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-100 transition">
            + Unit
          </button>
          <button type="button"
            onClick={() => router.push(`/forms/new?orgId=${org.id}`)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary/90 transition shadow-sm">
            + Form
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        {tabs.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Projects */}
        {tab === 'projects' && (
          orgEvals.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No projects yet.</p>
          ) : (
            <div className="space-y-2">
              {orgEvals.map(ev => {
                const cfg = STATUS_EV[ev.status] ?? STATUS_EV.DRAFT;
                return (
                  <div key={ev.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="text-base shrink-0">📁</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{ev.title}</p>
                      <p className="text-[10px] text-slate-400">{ev._count.forms} form{ev._count.forms !== 1 ? 's' : ''}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.cls}`}>{cfg.label}</span>
                    <Link href={`/evaluations/${ev.id}`}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition shrink-0">
                      View →
                    </Link>
                    <button type="button" onClick={() => onDeleteEval(ev.id)}
                      className="rounded-lg p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition shrink-0" aria-label="Delete">
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Forms */}
        {tab === 'forms' && (
          orgForms.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-slate-400 mb-3">No forms yet.</p>
              <button type="button" onClick={() => router.push(`/forms/new?orgId=${org.id}`)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 transition">
                + Create first form
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {orgForms.map(f => {
                const cfg = STATUS_FM[f.status] ?? STATUS_FM.DRAFT;
                return (
                  <div key={f.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="text-base shrink-0">📋</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{f.title}</p>
                      <p className="text-[10px] text-slate-400">{f.questionCount} questions</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.cls}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                    </span>
                    <Link href={`/forms/${f.id}`}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition shrink-0">
                      Edit →
                    </Link>
                    <button type="button" onClick={() => onDeleteForm(f.id)}
                      className="rounded-lg p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition shrink-0" aria-label="Delete">
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Units */}
        {tab === 'units' && (
          orgUnits.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-slate-400 mb-3">No units yet.</p>
              <button type="button" onClick={() => setShowUnit(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700 transition">
                + Create first unit
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {orgUnits.map(u => (
                <div
                  key={u.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/forms/new?orgId=${org.id}&unitId=${encodeURIComponent(u.id)}&unitName=${encodeURIComponent(u.name)}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      router.push(`/forms/new?orgId=${org.id}&unitId=${encodeURIComponent(u.id)}&unitName=${encodeURIComponent(u.name)}`);
                    }
                  }}
                  className="block w-full rounded-xl border border-violet-100 bg-violet-50 overflow-hidden text-left transition hover:border-violet-300 hover:bg-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-300"
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="text-base shrink-0">🏗️</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{u.name}</p>
                      {u.description && <p className="text-[10px] text-slate-500 truncate">{u.description}</p>}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{u.staffCount ?? 0} staff</span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[10px] font-bold text-white transition shrink-0">
                      + Form
                    </span>
                    <button type="button" onClick={(event) => { event.stopPropagation(); onDeleteUnit(u.id); }}
                      className="rounded-lg p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition shrink-0" aria-label="Delete">
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {showUnit && (
        <CreateUnitModal orgId={org.id} orgName={org.name}
          onClose={() => setShowUnit(false)}
          onCreated={(unit) => { setShowUnit(false); setTab('units'); onAddUnit(unit); }} />
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OrganisationsPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [evals, setEvals] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [o, f, e, u] = await Promise.all([
        apiFetch<Organisation[]>('/organisations'),
        apiFetch<Form[]>('/forms').catch(() => [] as Form[]),
        apiFetch<Evaluation[]>('/evaluations').catch(() => [] as Evaluation[]),
        apiFetch<Unit[]>('/units').catch(() => [] as Unit[]),
      ]);
      setOrgs(o);
      setForms(f);
      setEvals(e);
      setUnits(u);
      if (o.length > 0 && !selectedId) setSelectedId(o[0].id);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function deleteOrg(id: string) {
    if (!window.confirm('Delete this organisation? This cannot be undone.')) return;
    try {
      await apiFetch(`/organisations/${id}`, { method: 'DELETE' });
      setOrgs(p => p.filter(o => o.id !== id));
      if (selectedId === id) setSelectedId(orgs.find(o => o.id !== id)?.id ?? null);
    } catch (e: any) { window.alert(e?.message || 'Unable to delete.'); }
  }

  async function deleteEval(id: string) {
    if (!window.confirm('Delete this project and all linked data?')) return;
    try {
      await apiFetch(`/evaluations/${id}`, { method: 'DELETE' });
      setEvals(p => p.filter(e => e.id !== id));
    } catch (e: any) { window.alert(e?.message || 'Unable to delete.'); }
  }

  async function deleteForm(id: string) {
    if (!window.confirm('Delete this form? This cannot be undone.')) return;
    try {
      await apiFetch(`/forms/${id}`, { method: 'DELETE' });
      setForms(p => p.filter(f => f.id !== id));
    } catch (e: any) { window.alert(e?.message || 'Unable to delete.'); }
  }

  function deleteUnit(id: string) {
    if (!window.confirm('Remove this unit?')) return;
    setUnits(p => p.filter(u => u.id !== id));
  }

  function addUnit(unit: Unit) {
    setUnits(p => [...p, unit]);
  }

  const filtered = orgs.filter(o =>
    !search || o.name.toLowerCase().includes(search.toLowerCase()) || (o.sector ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const selected = orgs.find(o => o.id === selectedId) ?? null;

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Super Admin · Clients</p>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Organisations</h1>
            <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary ring-1 ring-primary/20">{orgs.length}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">Manage client organisations, forms, units and projects.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => router.push('/forms/new')}
            className="inline-flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-800 hover:bg-amber-100 transition shadow-sm">
            + Create Form
          </button>
          <Link href="/organisations/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary/80 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all">
            + Organisation
          </Link>
        </div>
      </div>



      {/* Search */}
      <div className="mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search organisations…"
          className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      {/* Two-panel layout */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="h-14 rounded-xl bg-white border border-slate-200 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="🏢" title="No organisations" description="Create your first client organisation." actionLabel="Create Organisation" onAction={() => router.push('/organisations/new')} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[320px_1fr]">

          {/* ── Left: list ── */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">Client list</p>
            {filtered.map(org => (
              <div key={org.id}
                className={`group flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all ${
                  selectedId === org.id
                    ? 'border-primary/50 bg-primary/5 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-primary/30 hover:bg-slate-50'
                }`}
                onClick={() => setSelectedId(org.id)}>
                {/* Sector colour dot */}
                <div className={`h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br ${sectorGrad(org.sector)} flex items-center justify-center text-white text-xs font-black shadow`}>
                  {org.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${selectedId === org.id ? 'text-primary' : 'text-slate-900'}`}>{org.name}</p>
                  <p className="text-[10px] text-slate-400">{org.sector || 'No sector'} · {org._count.evaluations} project{org._count.evaluations !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`h-1.5 w-1.5 rounded-full ${org.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <button type="button"
                    onClick={e => { e.stopPropagation(); deleteOrg(org.id); }}
                    className="opacity-0 group-hover:opacity-100 rounded-lg p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    aria-label="Delete organisation">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Right: detail ── */}
          <div>
            {selected ? (
              <OrgDetail
                org={selected}
                forms={forms}
                units={units}
                evaluations={evals}
                onRefresh={loadAll}
                onDeleteUnit={deleteUnit}
                onDeleteEval={deleteEval}
                onDeleteForm={deleteForm}
                onAddUnit={addUnit}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <span className="text-4xl mb-3 block">🏢</span>
                <p className="text-sm font-semibold text-slate-500">Select an organisation from the list</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
