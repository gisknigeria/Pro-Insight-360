'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import { AppIcon } from '@/components/ui/app-icons';
import { DashboardPageFrame } from '@/components/ui/dashboard-chrome';

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
      await apiFetch('/departments', { method: 'POST', body: JSON.stringify({ organisationId: orgId, name: name.trim(), description: desc.trim() }) });
      onCreated({
        id: `${orgId}::${name.trim()}`,
        name: name.trim(),
        description: desc.trim(),
        organisation: { id: orgId, name: orgName },
        staffCount: 0,
      });
    } catch (e: any) { setErr(e?.message || 'Failed.'); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 bg-slate-50">
          <p className="font-bold text-slate-900 text-sm">Create unit — {orgName}</p>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Unit name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Finance & Accounts"
              className="w-full bg-slate-100 px-3 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Description (optional)</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              className="w-full bg-slate-100 px-3 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none resize-none" />
          </div>
          {err && <p className="text-xs text-red-600">{err}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 bg-slate-100 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving}
              className="flex-1 bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition">
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
  const [tab, setTab] = useState<'forms' | 'units'>('forms');
  const [showUnit, setShowUnit] = useState(false);
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
  const [questionMap, setQuestionMap] = useState<Record<string, string[]>>({});
  const [copiedFormId, setCopiedFormId] = useState<string | null>(null);

  const allOrgEvals = evaluations.filter(e => e.organisation?.id === org.id);
  const orgEvals = allOrgEvals.filter(e => !isFormBucketEvaluation(e));
  const orgForms = forms.filter(f =>
    f.organisationId === org.id || allOrgEvals.some(e => e.id === f.evaluationId)
  );

  const orgUnits = useMemo(() => {
    const map = new Map<string, Unit>();
    units.filter(u => u.organisation?.id === org.id).forEach(u => map.set(u.id, u));
    orgForms.filter(form => form.unitId || form.unitName).forEach((form) => {
      const unitKey = form.unitId || `${org.id}::${form.unitName}`;
      if (!map.has(unitKey)) {
        map.set(unitKey, {
          id: unitKey,
          name: form.unitName || 'Unassigned unit',
          description: 'Department captured from linked questionnaire forms.',
          organisation: { id: org.id, name: org.name },
          staffCount: 0,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [org.id, org.name, orgForms, units]);

  const tabs = [
    { id: 'forms' as const, label: `Forms (${orgForms.length + orgEvals.length})`, icon: 'form' },
    { id: 'units' as const, label: `Units (${orgUnits.length})`, icon: 'sitemap' },
  ];

  async function loadQuestions(formId: string) {
    if (questionMap[formId]) return;
    try {
      const definition = await apiFetch<{ pages?: Array<{ questions?: Array<{ label?: string }> }> }>(`/forms/${formId}/definition`);
      const questions = (definition.pages ?? []).flatMap((page) => page.questions ?? []).map((question) => question.label || 'Untitled question');
      setQuestionMap((current) => ({ ...current, [formId]: questions }));
    } catch {
      setQuestionMap((current) => ({ ...current, [formId]: [] }));
    }
  }

  function getUnitForms(unit: Unit) {
    return orgForms.filter((form) => form.unitId === unit.id || form.unitName === unit.name);
  }

  function toggleUnit(unit: Unit) {
    const next = expandedUnitId === unit.id ? null : unit.id;
    setExpandedUnitId(next);
    if (next) getUnitForms(unit).forEach((form) => void loadQuestions(form.id));
  }

  function publicFormUrl(formId: string) {
    if (typeof window === 'undefined') return `/public/forms/${formId}`;
    return `${window.location.origin}/public/forms/${formId}`;
  }

  async function copyInviteLink(formId: string) {
    const url = publicFormUrl(formId);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Copy this questionnaire invite link:', url);
    }
    setCopiedFormId(formId);
    window.setTimeout(() => setCopiedFormId(null), 2200);
  }

  return (
    <div className="bg-white shadow-sm overflow-hidden">
      {/* Colour strip */}
      <div className={`h-1 bg-gradient-to-r ${sectorGrad(org.sector)}`} />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 bg-slate-50">
        <div>
          <p className="text-sm font-bold text-slate-900">{org.name}</p>
          <p className="text-xs text-slate-400">{org.sector || 'No sector'}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowUnit(true)}
            className="inline-flex items-center gap-1.5 border border-violet-200 bg-violet-100 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-violet-200 transition">
            <AppIcon name="plus" className="h-6 w-6" /> Unit
          </button>
          <button type="button"
            onClick={() => router.push(`/organisations/organogram?orgId=${org.id}`)}
            className="inline-flex items-center gap-1.5 border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 transition">
            <AppIcon name="sitemap" className="h-6 w-6" /> Organogram
          </button>
          <button type="button"
            onClick={() => router.push(`/forms/new?orgId=${org.id}`)}
            className="inline-flex items-center gap-1.5 border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-50 transition shadow-sm">
            <AppIcon name="plus" className="h-6 w-6" /> Form
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-50">
        {tabs.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            <AppIcon name={t.icon as 'form' | 'sitemap'} className="h-3.5 w-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Projects */}
        {tab === 'forms' && orgEvals.length > 0 && (
          orgEvals.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No projects yet.</p>
          ) : (
            <div className="space-y-2">
              {orgEvals.map(ev => {
                const cfg = STATUS_EV[ev.status] ?? STATUS_EV.DRAFT;
                return (
                  <div key={ev.id} className="flex items-center gap-3 bg-slate-100 px-4 py-3">
                    <AppIcon name="folder" className="h-7 w-7 shrink-0 text-blue-700" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{ev.title}</p>
                      <p className="text-[10px] text-slate-400">{ev._count.forms} form{ev._count.forms !== 1 ? 's' : ''}</p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold ${cfg.cls}`}>{cfg.label}</span>
                    <Link href={`/evaluations/${ev.id}`}
                      className="bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition shrink-0"> <span className="inline-flex items-center gap-1"><AppIcon name="edit" className="h-5 w-5" /> View</span>
                    </Link>
                    <button type="button" onClick={() => onDeleteEval(ev.id)}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition shrink-0" aria-label="Delete"><AppIcon name="trash" className="h-6 w-6" />
                    </button>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Forms */}
        {tab === 'forms' && (
          orgForms.length === 0 && orgEvals.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-slate-400 mb-3">No forms yet.</p>
              <button type="button" onClick={() => router.push(`/forms/new?orgId=${org.id}`)}
                className="inline-flex items-center gap-1.5 border border-amber-300 bg-white px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-50 transition">
                <AppIcon name="plus" className="h-3.5 w-3.5" /> Create first form
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {orgForms.map(f => {
                const cfg = STATUS_FM[f.status] ?? STATUS_FM.DRAFT;
                return (
                  <div key={f.id} className="flex items-center gap-3 bg-slate-100 px-4 py-3">
                    <AppIcon name="form" className="h-7 w-7 shrink-0 text-emerald-700" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{f.title}</p>
                      <p className="text-[10px] text-slate-400">{f.questionCount} questions</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold ${cfg.cls}`}>
                      <span className={`h-1.5 w-1.5 ${cfg.dot}`} />{cfg.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyInviteLink(f.id)}
                      className="inline-flex shrink-0 items-center gap-1 bg-emerald-600 px-3 py-2 text-[11px] font-black text-white transition hover:bg-emerald-700"
                    >
                      <AppIcon name="copy" className="h-5 w-5" />
                      {copiedFormId === f.id ? 'Copied' : ''}
                    </button>
                  
                    <Link href={`/forms/${f.id}`}
                      className="bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition shrink-0"> <span className="inline-flex items-center gap-1"><AppIcon name="edit" className="h-5 w-5" /> Edit</span>
                    </Link>
                    <button type="button" onClick={() => onDeleteForm(f.id)}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition shrink-0" aria-label="Delete"><AppIcon name="trash" className="h-6 w-6" />
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
                className="inline-flex items-center gap-1.5 bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700 transition">
                <AppIcon name="plus" className="h-5 w-5" /> Create first unit
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {orgUnits.map(u => {
                const unitForms = getUnitForms(u);
                const isOpen = expandedUnitId === u.id;
                return (
                <div
                  key={u.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleUnit(u)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggleUnit(u);
                    }
                  }}
                  className="block w-full bg-violet-100 overflow-hidden text-left transition hover:border-violet-300 hover:bg-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-300"
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <AppIcon name="sitemap" className="h-7 w-7 shrink-0 text-violet-700" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{u.name}</p>
                      {u.description && <p className="text-[10px] text-slate-500 truncate">{u.description}</p>}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{u.staffCount ?? 0} staff</span>
                    <span className="inline-flex items-center gap-1 bg-primary px-2.5 py-1.5 text-[10px] font-bold text-white transition shrink-0">
                      <AppIcon name="plus" className="h-4 w-4" /> Form
                    </span>
                    <button type="button" onClick={(event) => { event.stopPropagation(); onDeleteUnit(u.id); }}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition shrink-0" aria-label="Delete"><AppIcon name="trash" className="h-6 w-6" />
                    </button>
                  </div>
                  {isOpen && (
                    <div className="bg-white p-4">
                      <div className="mb-4 grid gap-3 sm:grid-cols-3">
                        <div className="bg-violet-50 p-3">
                          <p className="text-[10px] font-black uppercase tracking-wider text-violet-700">Purpose</p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-700">{u.description || `${u.name} supports ${org.name}'s operations, data collection, and department-level readiness review.`}</p>
                        </div>
                        <div className="bg-slate-50 p-3">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">People</p>
                          <p className="mt-1 text-lg font-black text-slate-950">{u.staffCount ?? 0}</p>
                          <p className="text-[10px] text-slate-500">staff/contact records</p>
                        </div>
                        <div className="bg-emerald-50 p-3">
                          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Questionnaires</p>
                          <p className="mt-1 text-lg font-black text-slate-950">{unitForms.length}</p>
                          <p className="text-[10px] text-slate-500">linked to this unit</p>
                        </div>
                      </div>

                      {unitForms.length === 0 ? (
                        <div className="bg-slate-50 p-4 text-center">
                          <p className="mb-3 text-sm text-slate-500">No questionnaire has been created for this unit yet.</p>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              router.push(`/forms/new?orgId=${org.id}&unitId=${encodeURIComponent(u.id)}&unitName=${encodeURIComponent(u.name)}`);
                            }}
                            className="inline-flex items-center gap-1.5 bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 transition"
                          >
                            <AppIcon name="plus" className="h-3.5 w-3.5" /> Create form
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {unitForms.map((form) => (
                            <div key={form.id} className="bg-slate-100 p-3">
                              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                  <p className="text-sm font-bold text-slate-950">{form.title}</p>
                                  <p className="mt-1 text-xs text-slate-500">{form.questionCount} questions - share link: {publicFormUrl(form.id)}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <button type="button" onClick={(event) => { event.stopPropagation(); void copyInviteLink(form.id); }} className="inline-flex items-center gap-1 bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700">
                                    <AppIcon name="copy" className="h-5 w-5" /> {copiedFormId === form.id ? 'Copied' : ''}
                                  </button>
                                  <Link href={`/evaluations/${form.evaluationId}/diagnosis`} onClick={(event) => event.stopPropagation()} className="inline-flex items-center gap-1 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100">
                                    <AppIcon name="chart" className="h-3.5 w-3.5" /> Insight
                                  </Link>
                                  <Link href={`/forms/${form.id}`} onClick={(event) => event.stopPropagation()} className="inline-flex items-center gap-1 bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100">
                                    <AppIcon name="edit" className="h-3.5 w-3.5" /> Edit
                                  </Link>
                                  <Link href={`/public/forms/${form.id}`} onClick={(event) => event.stopPropagation()} className="inline-flex items-center gap-1 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100">
                                    <AppIcon name="link" className="h-3.5 w-3.5" /> Share
                                  </Link>
                                </div>
                              </div>
                              <div className="mt-3 bg-white p-3">
                                <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">Questions under this form</p>
                                {(questionMap[form.id] ?? []).length > 0 ? (
                                  <ul className="grid gap-1 sm:grid-cols-2">
                                    {questionMap[form.id].slice(0, 10).map((question, index) => (
                                      <li key={`${form.id}-${index}`} className="flex gap-2 text-xs text-slate-700">
                                        <span className="font-black text-primary">{index + 1}.</span>
                                        <span>{question}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-xs text-slate-500">No questions found yet. Use Edit to add questionnaire questions.</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );})}
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
    <DashboardPageFrame>
      {/* Header */}
      <div className="flex flex-col gap-5 border border-slate-900 bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/10 sm:flex-row sm:items-end sm:justify-between">
        <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Super Admin</p>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">Organisations</h1>
            <span className="inline-flex items-center justify-center border border-cyan-300/30 bg-slate-900 px-3 py-1 text-xs font-bold text-cyan-200">{orgs.length}</span>
          </div>
          <p className="mt-1 text-sm text-slate-300">Supports client profiling, enquiry management, organogram development, unit configuration and structural mapping to evaluate institutional capacity.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/organisations/organogram"
            className="inline-flex items-center gap-2 border border-teal-300/30 bg-teal-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-950/20 transition-colors hover:bg-teal-400">
            <AppIcon name="sitemap" className="h-6 w-6" /> Organogram
          </Link>
          <button type="button" onClick={() => router.push('/forms/new')}
            className="inline-flex items-center gap-2 border border-amber-300/30 bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-slate-950/20 transition-colors hover:bg-amber-300">
            <AppIcon name="plus" className="h-6 w-6" /> Create Form
          </button>
          <Link href="/organisations/new"
            className="inline-flex items-center gap-2 border border-cyan-300/30 bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-950/20 transition-colors hover:border-cyan-300 hover:bg-slate-800">
            <AppIcon name="plus" className="h-6 w-6" /> Organisation
          </Link>
        </div>
      </div>



      {/* Search */}
      <div className="mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search organisations…"
          className="w-full max-w-sm bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      {/* Two-panel layout */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="h-14 bg-white shadow-sm animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-100 px-6 py-14 text-center">
          <AppIcon name="building" className="mx-auto mb-4 h-14 w-14 text-primary" />
          <h2 className="text-lg font-bold text-slate-950">No organisations</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">Create your first client organisation.</p>
          <button type="button" onClick={() => router.push('/organisations/new')} className="mt-5 inline-flex items-center gap-2 bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90">
            <AppIcon name="plus" className="h-6 w-6" /> Create Organisation
          </button>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[320px_1fr]">

          {/* ── Left: list ── */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">Client list</p>
            {filtered.map(org => (
              <div key={org.id}
                className={`group flex items-center gap-3 border px-4 py-3 cursor-pointer transition-all ${
                  selectedId === org.id
                    ? 'bg-primary/15 shadow-sm'
                    : 'bg-white hover:bg-slate-100'
                }`}
                onClick={() => setSelectedId(org.id)}>
                {/* Sector colour dot */}
                <div className={`h-8 w-8 shrink-0 bg-gradient-to-br ${sectorGrad(org.sector)} flex items-center justify-center text-white text-xs font-black shadow`}>
                  {org.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${selectedId === org.id ? 'text-primary' : 'text-slate-900'}`}>{org.name}</p>
                  <p className="text-[10px] text-slate-400">{org.sector || 'No sector'} · {org._count.evaluations} project{org._count.evaluations !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`h-1.5 w-1.5 ${org.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <button type="button"
                    onClick={e => { e.stopPropagation(); deleteOrg(org.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    aria-label="Delete organisation"><AppIcon name="trash" className="h-6 w-6" />
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
              <div className="bg-slate-100 p-10 text-center">
                <AppIcon name="building" className="mx-auto mb-3 h-12 w-12 text-slate-400" />
                <p className="text-sm font-semibold text-slate-500">Select an organisation from the list</p>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardPageFrame>
  );
}
