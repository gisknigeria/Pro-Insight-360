'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OrgChartUploader, { OrgRow } from '@/components/organogram/OrgChartUploader';
import OrgChart from '@/components/organogram/OrgChart';
import { EmptyState } from '@/components/ui/empty-state';

interface Evaluation {
  id: string;
  title: string;
}

export default function NewOrganogramPage() {
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState('');
  const [rows, setRows] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/evaluations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((data: Evaluation[]) => {
        setEvaluations(data);
        if (data.length > 0) {
          setSelectedEvaluationId(data[0].id);
        }
      })
      .catch(() => setError('Unable to load evaluations.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedEvaluationId) {
      setError('Please select an evaluation.');
      return;
    }

    if (rows.length === 0) {
      setError('Please upload an organogram CSV or JSON file first.');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const departments = Array.from(new Set(rows.map((row) => row.department).filter(Boolean)));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organograms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          evaluationId: selectedEvaluationId,
          rawData: { nodes: rows, departments },
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        setError(result.message || 'Unable to create organogram.');
        return;
      }

      setSuccess('Organogram created successfully. Redirecting...');
      setTimeout(() => router.push('/organogram'), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create organogram.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="No evaluations available"
        description="Create an evaluation before you can add an organogram."
        actionLabel="Create evaluation"
        onAction={() => router.push('/evaluations/new')}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create a new organogram</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Upload your organisation hierarchy and generate an interactive organogram.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6">
        {error ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {success ? (
          <div role="status" className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        ) : null}

        <div>
          <label htmlFor="evaluation" className="block text-sm font-medium text-slate-700">
            Evaluation
          </label>
          <select
            id="evaluation"
            value={selectedEvaluationId}
            onChange={(event) => setSelectedEvaluationId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-amber-200"
          >
            {evaluations.map((evaluation) => (
              <option key={evaluation.id} value={evaluation.id}>
                {evaluation.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <OrgChartUploader onData={setRows} />
        </div>

        {rows.length > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Preview</h2>
            <OrgChart rows={rows} />
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-amber-300"
          >
            {saving ? 'Creating organogram…' : 'Create organogram'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/organogram')}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
