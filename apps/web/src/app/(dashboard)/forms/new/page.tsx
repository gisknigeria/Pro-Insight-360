'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface EvaluationOption {
  id: string;
  title: string;
  organisation: { id: string; name: string };
}

export default function NewFormPage() {
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<EvaluationOption[]>([]);
  const [values, setValues] = useState({
    name: '',
    description: '',
    evaluationId: '',
    accessMode: 'REGISTERED',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<EvaluationOption[]>('/evaluations')
      .then(setEvaluations)
      .catch((err) => {
        console.error('Load evaluations failed:', err);
        setError('Unable to load evaluations. Please refresh the page.');
      })
      .finally(() => setLoading(false));
  }, []);

  const canSubmit = values.name.trim() && values.evaluationId;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (!canSubmit) {
      setError('Please provide a form name and select an evaluation.');
      return;
    }

    setSaving(true);
    try {
      const definition = {
        formId: `form-${Date.now()}`,
        title: values.name.trim(),
        description: values.description.trim(),
        pages: [
          {
            pageId: 'page-1',
            title: 'Page 1',
            questions: [],
          },
        ],
        conditionalLogic: [],
        version: 1,
      };

      const data = await apiFetch<{ id: string }>('/forms', {
        method: 'POST',
        body: JSON.stringify({
          evaluationId: values.evaluationId,
          title: values.name.trim(),
          definition,
          accessMode: values.accessMode,
        }),
      });

      router.push(`/forms/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create form.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error && evaluations.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Create a new form</h1>
        <p className="text-slate-500 mb-6">You need at least one evaluation project before you can create a form.</p>
        <Link
          href="/evaluations/new"
          className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create Evaluation First
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Create a new form</h1>
        <p className="mt-2 text-sm text-slate-500">
          Start by naming the form and selecting an evaluation. You will be taken to the form builder next.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            Form name
          </label>
          <input
            id="name"
            value={values.name}
            onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="e.g. GIS Readiness Assessment"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            id="description"
            value={values.description}
            onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
            rows={4}
            placeholder="What is this form for?"
          />
        </div>

        <div>
          <label htmlFor="evaluationId" className="block text-sm font-medium text-slate-700">
            Evaluation project
          </label>
          <select
            id="evaluationId"
            value={values.evaluationId}
            onChange={(event) => setValues((current) => ({ ...current, evaluationId: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            required
          >
            <option value="" disabled>
              Select an evaluation
            </option>
            {evaluations.map((evaluation) => (
              <option key={evaluation.id} value={evaluation.id}>
                {evaluation.title} ({evaluation.organisation.name})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="accessMode" className="block text-sm font-medium text-slate-700">
            Form access
          </label>
          <select
            id="accessMode"
            value={values.accessMode}
            onChange={(event) => setValues((current) => ({ ...current, accessMode: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="REGISTERED">Registered only</option>
            <option value="PUBLIC">Public access</option>
          </select>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {saving ? 'Creating form…' : 'Create form'}
          </button>
          <Link
            href="/forms"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
