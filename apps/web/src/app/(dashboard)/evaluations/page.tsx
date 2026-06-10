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

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
  ACTIVE: { label: 'Active', color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20', dot: 'bg-emerald-500' },
  CLOSED: { label: 'Closed', color: 'bg-orange-50 text-orange-700 ring-1 ring-orange-500/20', dot: 'bg-orange-500' },
  ARCHIVED: { label: 'Archived', color: 'bg-slate-50 text-slate-400', dot: 'bg-slate-300' },
};

function EvaluationRow({ evaluation, onArchive, onDelete }: { evaluation: Evaluation; onArchive: () => void; onDelete: () => void }) {
  const cfg = STATUS_CONFIG[evaluation.status] || STATUS_CONFIG.DRAFT;

  return (
    <div className="group flex items-center justify-between px-6 py-4 hover:bg-surface-muted/80 transition-all duration-200 border-b border-border last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          {/* Icon */}
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-sm shadow-sm">
            📋
          </div>
          <div className="min-w-0">
            <Link
              href={`/evaluations/${evaluation.id}`}
              className="text-sm font-bold text-foreground hover:text-primary transition-colors truncate block"
            >
              {evaluation.title}
            </Link>
          </div>
          <span className={`shrink-0 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted ml-12">
          <span>{evaluation.organisation.name}</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>{evaluation._count.forms} form{evaluation._count.forms !== 1 ? 's' : ''}</span>
          {evaluation.startDate && (
            <>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>Started {new Date(evaluation.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <Link
          href={`/evaluations/${evaluation.id}/diagnosis`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-muted bg-surface-muted border border-border hover:border-primary/30 rounded-lg transition-all hover:shadow-sm"
        >
          🔍 Diagnosis
        </Link>
        <Link
          href={`/evaluations/${evaluation.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-primary to-accent rounded-lg transition-all hover:shadow-md hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0"
        >
          View →
        </Link>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 text-xs font-medium text-muted hover:text-danger rounded-lg transition-colors"
          aria-label={`Delete ${evaluation.title}`}
        >
          🗑️
        </button>
        {evaluation.status !== 'ARCHIVED' && (
          <button
            onClick={onArchive}
            className="px-3 py-1.5 text-xs font-medium text-muted hover:text-amber-500 transition-colors"
            aria-label={`Archive ${evaluation.title}`}
          >
            📦
          </button>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="skeleton h-8 w-48 mb-2" />
          <div className="skeleton h-4 w-64" />
        </div>
        <div className="skeleton h-10 w-40 rounded-xl" />
      </div>
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="px-6 py-5 border-b border-border">
          <div className="skeleton h-5 w-44" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="px-6 py-5 border-b border-border last:border-b-0">
            <div className="flex items-center gap-3">
              <div className="skeleton h-9 w-9 rounded-lg" />
              <div>
                <div className="skeleton h-4 w-52 mb-2" />
                <div className="skeleton h-3 w-36" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [archiveTarget, setArchiveTarget] = useState<Evaluation | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  if (loading) return <LoadingSkeleton />;

  return (
    <div className={mounted ? 'animate-fade-in' : ''}>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Evaluation Projects</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary ring-1 ring-primary/20">
              {evaluations.length}
            </span>
          </div>
          <p className="text-sm text-muted">Manage all organisational evaluation engagements.</p>
        </div>
        <Link
          href="/evaluations/new"
          className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0"
        >
          <span className="text-lg leading-none">+</span>
          <span>New Evaluation</span>
        </Link>
      </div>

      {active.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No evaluations yet"
          description="Create your first evaluation project to start collecting organisational data."
          actionLabel="Create Evaluation"
          onAction={() => window.location.href = '/evaluations/new'}
        />
      ) : (
        <div className="space-y-6">
          {/* ── Active evaluations ── */}
          <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-primary/[0.02] to-accent/[0.01]">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                </span>
                <h2 className="text-sm font-bold text-foreground">Active Evaluations</h2>
                <span className="text-xs font-semibold text-muted bg-surface-muted px-2 py-0.5 rounded-md ml-1">
                  {active.length}
                </span>
              </div>
            </div>
            <div className="divide-y divide-border">
              {active.map((ev) => (
                <EvaluationRow
                  key={ev.id}
                  evaluation={ev}
                  onArchive={() => setArchiveTarget(ev)}
                  onDelete={() => deleteEvaluation(ev.id)}
                />
              ))}
            </div>
          </div>

          {/* ── Archived evaluations ── */}
          {archived.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-border">
                <h2 className="text-sm font-bold text-muted">Archived ({archived.length})</h2>
              </div>
              <div className="divide-y divide-border">
                {archived.map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between px-6 py-3 opacity-50">
                    <div className="flex items-center gap-3">
                      <span className="text-sm">📦</span>
                      <p className="text-sm text-muted">{ev.title}</p>
                    </div>
                    <p className="text-xs text-muted">{ev.organisation.name}</p>
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
