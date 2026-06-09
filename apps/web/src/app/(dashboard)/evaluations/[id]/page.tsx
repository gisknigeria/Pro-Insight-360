'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';

interface Evaluation {
  id: string;
  title: string;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  startDate: string | null;
  createdAt: string;
  organisation: { id: string; name: string };
  _count: { forms: number };
}

const STATUS_CONFIG: Record<Evaluation['status'], { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-slate-100 text-slate-600' },
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700' },
  CLOSED: { label: 'Closed', color: 'bg-orange-100 text-orange-700' },
  ARCHIVED: { label: 'Archived', color: 'bg-slate-100 text-slate-400' },
};

export default function EvaluationDetailPage() {
  const params = useParams();
  const evaluationId = params?.id as string;
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!evaluationId) return;
    const token = localStorage.getItem('accessToken');

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/evaluations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Failed to load evaluation.');
        }
        return res.json();
      })
      .then((evaluations: Evaluation[]) => {
        const found = evaluations.find((item) => item.id === evaluationId);
        if (!found) {
          setError('Evaluation not found.');
        } else {
          setEvaluation(found);
        }
      })
      .catch((err) => {
        setError(err?.message || 'Unable to load evaluation.');
      })
      .finally(() => setLoading(false));
  }, [evaluationId]);

  if (loading) {
    return <div className="text-slate-500 text-sm py-8 text-center">Loading evaluation…</div>;
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="Evaluation unavailable"
        description={error}
        actionLabel="Back to evaluations"
        onAction={() => window.location.href = '/evaluations'}
      />
    );
  }

  if (!evaluation) {
    return null;
  }

  const status = STATUS_CONFIG[evaluation.status];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{evaluation.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {evaluation.organisation.name} · {evaluation._count.forms} form{evaluation._count.forms !== 1 ? 's' : ''}
            {evaluation.startDate && ` · Started ${new Date(evaluation.startDate).toLocaleDateString()}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}>
            {status.label}
          </span>
          <Link
            href="/evaluations"
            className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Back to evaluations
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Overview</h2>
          <dl className="space-y-3 text-sm text-slate-600">
            <div>
              <dt className="font-medium text-slate-800">Organisation</dt>
              <dd>{evaluation.organisation.name}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-800">Status</dt>
              <dd>{status.label}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-800">Start date</dt>
              <dd>{evaluation.startDate ? new Date(evaluation.startDate).toLocaleDateString() : 'Not set'}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-800">Forms</dt>
              <dd>{evaluation._count.forms}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Actions</h2>
          <div className="space-y-3">
            <Link
              href={`/evaluations/${evaluation.id}/diagnosis`}
              className="block w-full px-4 py-3 text-sm font-medium text-center text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Open diagnosis
            </Link>
            <Link
              href="/forms/new"
              className="block w-full px-4 py-3 text-sm font-medium text-center text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Create a form for this evaluation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
