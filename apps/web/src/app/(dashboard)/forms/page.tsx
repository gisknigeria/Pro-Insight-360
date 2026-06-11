'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { EmptyState } from '@/components/ui/empty-state';

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

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }

    setCopyMessage('Share link copied to clipboard.');
    window.setTimeout(() => setCopyMessage(''), 3000);
  }

  async function loadForms() {
    setLoading(true);
    setError('');

    try {
      const data = await apiFetch<Form[]>('/forms');
      setForms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load forms.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadForms();
  }, []);

  async function handleUpdate(formId: string, update: Record<string, unknown>) {
    setActionFormId(formId);
    setError('');

    try {
      const updated = await apiFetch(`/forms/${formId}`, {
        method: 'PUT',
        body: JSON.stringify(update),
      });

      setForms((current) =>
        current.map((form) => {
          if (form.id !== formId) return form;
          return {
            ...form,
            ...(update as Partial<Form>),
            status: (update as Partial<Form>).status ?? form.status,
            accessMode: (update as Partial<Form>).accessMode ?? form.accessMode,
          };
        }),
      );

      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update form.');
      throw err;
    } finally {
      setActionFormId(null);
    }
  }

  async function handleTogglePublish(form: Form) {
    await handleUpdate(form.id, {
      status: form.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED',
    });
  }

  async function handleToggleAccessMode(form: Form) {
    await handleUpdate(form.id, {
      accessMode: form.accessMode === 'PUBLIC' ? 'REGISTERED' : 'PUBLIC',
    });
  }

  async function handleDelete(formId: string) {
    if (!window.confirm('Delete this form? This cannot be undone.')) {
      return;
    }

    setActionFormId(formId);
    setError('');
    try {
      await apiFetch(`/forms/${formId}`, { method: 'DELETE' });
      setForms((current) => current.filter((form) => form.id !== formId));
      setCopyMessage('Form deleted successfully.');
      window.setTimeout(() => setCopyMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete form.');
    } finally {
      setActionFormId(null);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Forms & Templates</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Create surveys, manage templates, and build custom forms.
            </p>
          </div>
          <Link
            href="/forms/new"
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark"
          >
            + Create Form
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('forms')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'forms'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            My Forms
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Templates
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-4">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : forms.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No forms yet"
          description="Create your first form to start collecting data from respondents."
          actionLabel="Create Form"
          onAction={() => (window.location.href = '/forms/new')}
        />
      ) : (
        <div className="space-y-3">
          {copyMessage ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {copyMessage}
            </div>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map((form) => {
              const isBusy = actionFormId === form.id;
              return (
                <div key={form.id} className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-3 gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{form.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                          {form.status}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                          {form.accessMode === 'PUBLIC' ? 'Public' : 'Registered only'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{form.description}</p>
                  <div className="flex justify-between gap-2 text-xs text-slate-500 mb-4">
                    <span>{form.questionCount} questions</span>
                    <span>{new Date(form.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/forms/${form.id}`}
                        className="rounded-2xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Edit form
                      </Link>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleTogglePublish(form)}
                        className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {form.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleToggleAccessMode(form)}
                        className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Set {form.accessMode === 'PUBLIC' ? 'Registered' : 'Public'}
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDelete(form.id)}
                        className="rounded-2xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Delete form
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(form.id, form.accessMode)}
                      className="rounded-2xl bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                    >
                      Copy share link
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
