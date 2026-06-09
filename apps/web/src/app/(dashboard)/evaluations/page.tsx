'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Evaluation {
  id: string;
  title: string;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  startDate: string | null;
  createdAt: string;
  organisation: { id: string; name: string };
  _count: { forms: number };
}

const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'bg-slate-100 text-slate-600' },
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700' },
  CLOSED: { label: 'Closed', color: 'bg-orange-100 text-orange-700' },
  ARCHIVED: { label: 'Archived', color: 'bg-slate-100 text-slate-400' },
};

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [archiveTarget, setArchiveTarget] = useState<Evaluation | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/evaluations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setEvaluations)
      .finally(() => setLoading(false));
  }, []);

  async function archiveEvaluation(id: string) {
    const token = localStorage.getItem('accessToken');
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/evaluations/${id}/archive`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    setEvaluations((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'ARCHIVED' as const } : e)),
    );
    setArchiveTarget(null);
  }

  async function deleteEvaluation(id: string) {
    if (!window.confirm('Delete this evaluation and all linked forms and reports? This cannot be undone.')) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/evaluations/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      setEvaluations((prev) => prev.filter((evaluation) => evaluation.id !== id));
    } else {
      const payload = await response.json().catch(() => null);
      window.alert(payload?.message || 'Unable to delete evaluation.');
    }
  }

  const active = evaluations.filter((e) => e.status !== 'ARCHIVED');
  const archived = evaluations.filter((e) => e.status === 'ARCHIVED');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Evaluation Projects</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage all organisational evaluation engagements.</p>
        </div>
        <Link
          href="/evaluations/new"
          className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          + New Evaluation
        </Link>
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm py-8 text-center">Loading evaluations…</div>
      ) : active.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No evaluations yet"
          description="Create your first evaluation project to start collecting organisational data."
          actionLabel="Create Evaluation"
          onAction={() => window.location.href = '/evaluations/new'}
        />
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-900">Active Evaluations ({active.length})</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {active.map((ev) => {
                const cfg = STATUS_CONFIG[ev.status];
                return (
                  <div key={ev.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <Link
                          href={`/evaluations/${ev.id}`}
                          className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors truncate"
                        >
                          {ev.title}
                        </Link>
                        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {ev.organisation.name} · {ev._count.forms} form{ev._count.forms !== 1 ? 's' : ''}
                        {ev.startDate && ` · Started ${new Date(ev.startDate).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Link
                        href={`/evaluations/${ev.id}/diagnosis`}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 hover:border-blue-400 rounded-lg transition-colors"
                      >
                        Diagnosis
                      </Link>
                      <Link
                        href={`/evaluations/${ev.id}`}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => deleteEvaluation(ev.id)}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-800 rounded-lg transition-colors"
                        aria-label={`Delete ${ev.title}`}
                      >
                        Delete
                      </button>
                      {ev.status !== 'ARCHIVED' && (
                        <button
                          onClick={() => setArchiveTarget(ev)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-red-500 transition-colors"
                          aria-label={`Archive ${ev.title}`}
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {archived.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-sm font-semibold text-slate-400">Archived ({archived.length})</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {archived.map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between px-6 py-3 opacity-60">
                    <p className="text-sm text-slate-600">{ev.title}</p>
                    <p className="text-xs text-slate-400">{ev.organisation.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={archiveTarget !== null}
        title={`Archive "${archiveTarget?.title}"?`}
        description="This evaluation will be archived. All data, responses, and reports will be retained. You can still view the evaluation but it will no longer be active."
        confirmLabel="Archive Evaluation"
        cancelLabel="Keep Active"
        onConfirm={() => archiveTarget && archiveEvaluation(archiveTarget.id)}
        onCancel={() => setArchiveTarget(null)}
      />
    </div>
  );
}
