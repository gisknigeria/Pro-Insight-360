'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { EmptyState } from '@/components/ui/empty-state';
import { AppIcon, type AppIconName } from '@/components/ui/app-icons';

interface Form {
  id: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  accessMode: 'PUBLIC' | 'REGISTERED';
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  DRAFT:     { label: 'Draft',     bg: 'bg-slate-100',   text: 'text-slate-600',   dot: 'bg-slate-400' },
  PUBLISHED: { label: 'Published', bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500' },
  CLOSED:    { label: 'Closed',    bg: 'bg-orange-50',   text: 'text-orange-700',  dot: 'bg-orange-500' },
};

function StatusDot({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-3/4 rounded-lg bg-slate-200" />
          <div className="h-3 w-1/2 rounded-lg bg-slate-100" />
        </div>
        <div className="h-6 w-16 rounded-full bg-slate-100 ml-4" />
      </div>
      <div className="h-3 w-full rounded-lg bg-slate-100" />
      <div className="h-3 w-2/3 rounded-lg bg-slate-100" />
      <div className="flex gap-2 pt-2">
        <div className="h-8 w-20 rounded-xl bg-slate-100" />
        <div className="h-8 w-20 rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'forms' | 'templates'>('forms');
  const [copyMessage, setCopyMessage] = useState('');
  const [error, setError] = useState('');
  const [actionFormId, setActionFormId] = useState<string | null>(null);

  function handleCopyLink(formId: string, accessMode: Form['accessMode']) {
    const route = accessMode === 'PUBLIC' ? 'public/forms' : 'my-forms';
    const shareUrl = `${window.location.origin}/${route}/${formId}`;
    if (navigator.clipboard) navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopyMessage('Share link copied!');
    setTimeout(() => setCopyMessage(''), 3000);
  }

  async function loadForms() {
    setLoading(true); setError('');
    try {
      setForms(await apiFetch<Form[]>('/forms'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load forms.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadForms(); }, []);

  async function handleUpdate(formId: string, update: Record<string, unknown>) {
    setActionFormId(formId); setError('');
    try {
      await apiFetch(`/forms/${formId}`, { method: 'PUT', body: JSON.stringify(update) });
      setForms((prev) => prev.map((f) => f.id !== formId ? f : { ...f, ...(update as Partial<Form>) }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update form.');
    } finally { setActionFormId(null); }
  }

  async function handleDelete(formId: string) {
    if (!window.confirm('Delete this form? This cannot be undone.')) return;
    setActionFormId(formId); setError('');
    try {
      await apiFetch(`/forms/${formId}`, { method: 'DELETE' });
      setForms((prev) => prev.filter((f) => f.id !== formId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete form.');
    } finally { setActionFormId(null); }
  }

  const published = forms.filter((f) => f.status === 'PUBLISHED').length;
  const draft = forms.filter((f) => f.status === 'DRAFT').length;
  const stats: { label: string; value: number; icon: AppIconName; grad: string }[] = [
    { label: 'Total forms', value: forms.length, icon: 'clipboard', grad: 'from-blue-500 to-indigo-600' },
    { label: 'Published', value: published, icon: 'check', grad: 'from-emerald-400 to-green-600' },
    { label: 'Draft', value: draft, icon: 'edit', grad: 'from-amber-400 to-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* ── Header ── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Super Admin · Questionnaires</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Forms & Templates</h1>
          <p className="mt-1.5 text-sm text-slate-500">Create and manage questionnaires for your evaluation programmes.</p>
        </div>
        <Link
          href="/forms/new"
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary/80 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
        >
          <AppIcon name="plus" className="h-4 w-4" />
          Create Form
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.grad} text-lg shadow-md`}>
              <AppIcon name={s.icon} className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="mb-6 border-b border-slate-200">
        <nav className="flex gap-1">
          {(['forms', 'templates'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors capitalize ${
                activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Feedback ── */}
      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AppIcon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />{error}
        </div>
      )}
      {copyMessage && (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <AppIcon name="check" className="mt-0.5 h-4 w-4 shrink-0" />{copyMessage}
        </div>
      )}

      {/* ── Content ── */}
      {activeTab === 'forms' && (
        <>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1,2,3,4,5,6].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : forms.length === 0 ? (
            <EmptyState icon="clipboard" title="No forms yet" description="Create your first form to start collecting data." actionLabel="Create Form" onAction={() => (window.location.href = '/forms/new')} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {forms.map((form) => {
                const isBusy = actionFormId === form.id;
                return (
                  <div key={form.id} className="group relative flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
                    {/* Top accent */}
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm text-primary">
                          <AppIcon name="clipboard" className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{form.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {form.questionCount} question{form.questionCount !== 1 ? 's' : ''} · Updated {new Date(form.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                      <StatusDot status={form.status} />
                    </div>

                    {form.description && (
                      <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">{form.description}</p>
                    )}

                    <div className="flex items-center gap-2 mb-5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        form.accessMode === 'PUBLIC' ? 'bg-violet-50 text-violet-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <AppIcon name={form.accessMode === 'PUBLIC' ? 'globe' : 'lock'} className="h-3.5 w-3.5" />
                        {form.accessMode === 'PUBLIC' ? 'Public' : 'Registered'}
                      </span>
                    </div>

                    <div className="mt-auto space-y-2">
                      <div className="flex gap-2">
                        <Link href={`/forms/${form.id}`} className="flex-1 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition">
                          <AppIcon name="edit" className="mr-1.5 h-3.5 w-3.5" /> Edit
                        </Link>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleUpdate(form.id, { status: form.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' })}
                          className={`flex-1 inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                            form.status === 'PUBLISHED'
                              ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          <AppIcon name={form.status === 'PUBLISHED' ? 'pause' : 'play'} className="mr-1.5 h-3.5 w-3.5" />
                          {form.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleUpdate(form.id, { accessMode: form.accessMode === 'PUBLIC' ? 'REGISTERED' : 'PUBLIC' })}
                          className="flex-1 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
                        >
                          <AppIcon name={form.accessMode === 'PUBLIC' ? 'lock' : 'globe'} className="mr-1.5 h-3.5 w-3.5" />
                          {form.accessMode === 'PUBLIC' ? 'Set Registered' : 'Set Public'}
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleCopyLink(form.id, form.accessMode)}
                          className="flex-1 inline-flex items-center justify-center rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary/90 transition disabled:opacity-50"
                        >
                          <AppIcon name="link" className="mr-1.5 h-3.5 w-3.5" /> Copy link
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDelete(form.id)}
                        className="w-full inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                      >
                        <AppIcon name="trash" className="mr-1.5 h-3.5 w-3.5" /> Delete form
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'templates' && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <AppIcon name="form" className="mb-4 h-10 w-10" />
          <p className="text-sm font-medium">Template library coming soon.</p>
        </div>
      )}
    </div>
  );
}
