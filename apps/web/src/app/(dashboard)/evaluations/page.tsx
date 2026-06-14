'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface Evaluation {
  id: string;
  title: string;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  startDate: string | null;
  createdAt: string;
  organisation: { id: string; name: string };
  _count: { forms: number };
}

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; dot: string; ring: string }> = {
  DRAFT:    { label: 'Draft',    bg: 'bg-slate-100',  text: 'text-slate-600',   dot: 'bg-slate-400',   ring: 'ring-slate-200' },
  ACTIVE:   { label: 'Active',   bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', ring: 'ring-emerald-200' },
  CLOSED:   { label: 'Closed',   bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-500',  ring: 'ring-orange-200' },
  ARCHIVED: { label: 'Archived', bg: 'bg-slate-50',   text: 'text-slate-400',   dot: 'bg-slate-300',   ring: 'ring-slate-100' },
};

const PIE_COLORS: Record<string, string> = {
  ACTIVE:   '#10b981',
  DRAFT:    '#94a3b8',
  CLOSED:   '#f97316',
  ARCHIVED: '#cbd5e1',
};

function isFormBucketEvaluation(evaluation: Evaluation) {
  return ['general', 'forms'].includes(evaluation.title.trim().toLowerCase()) && !evaluation.startDate;
}

function EvaluationCard({ evaluation, onArchive, onDelete }: {
  evaluation: Evaluation;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const cfg = STATUS_CFG[evaluation.status] ?? STATUS_CFG.DRAFT;

  return (
    <div className="group relative flex flex-col rounded-3xl border border-slate-200 bg-white shadow-sm hover:border-primary/30 hover:shadow-md transition-all overflow-hidden">
      {/* Status stripe */}
      <div className={`h-1 ${evaluation.status === 'ACTIVE' ? 'bg-emerald-400' : evaluation.status === 'CLOSED' ? 'bg-orange-400' : 'bg-slate-200'}`} />

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-base">📋</div>
            <div className="min-w-0">
              <Link
                href={`/evaluations/${evaluation.id}`}
                className="text-sm font-bold text-slate-900 hover:text-primary transition-colors truncate block"
              >
                {evaluation.title}
              </Link>
              <p className="text-xs text-slate-400 mt-0.5">{evaluation.organisation.name}</p>
            </div>
          </div>
          <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} ${evaluation.status === 'ACTIVE' ? 'animate-pulse' : ''}`} />
            {cfg.label}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-5">
          <span className="inline-flex items-center gap-1">
            <span>📄</span>{evaluation._count.forms} form{evaluation._count.forms !== 1 ? 's' : ''}
          </span>
          {evaluation.startDate && (
            <span className="inline-flex items-center gap-1">
              <span>📅</span>
              Started {new Date(evaluation.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2">
          <Link
            href={`/evaluations/${evaluation.id}/diagnosis`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
          >
            🔍 Diagnosis
          </Link>
          <Link
            href={`/evaluations/${evaluation.id}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-3 py-2 text-xs font-bold text-white shadow-sm hover:shadow-md transition-all"
          >
            View →
          </Link>
          <button
            onClick={onDelete}
            className="rounded-xl p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            aria-label={`Delete ${evaluation.title}`}
          >
            🗑️
          </button>
          {evaluation.status !== 'ARCHIVED' && (
            <button
              onClick={onArchive}
              className="rounded-xl p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
              aria-label={`Archive ${evaluation.title}`}
            >
              📦
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-slate-200" />
          <div className="h-3 w-1/2 rounded bg-slate-100" />
        </div>
      </div>
      <div className="h-3 w-2/3 rounded bg-slate-100" />
      <div className="flex gap-2">
        <div className="h-8 flex-1 rounded-xl bg-slate-100" />
        <div className="h-8 flex-1 rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [archiveTarget, setArchiveTarget] = useState<Evaluation | null>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/evaluations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setEvaluations(list.filter((evaluation) => !isFormBucketEvaluation(evaluation)));
      })
      .finally(() => setLoading(false));
  }, []);

  async function archiveEvaluation(id: string) {
    const token = localStorage.getItem('accessToken');
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/evaluations/${id}/archive`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    setEvaluations((prev) => prev.map((e) => e.id === id ? { ...e, status: 'ARCHIVED' as const } : e));
    setArchiveTarget(null);
  }

  async function deleteEvaluation(id: string) {
    if (!window.confirm('Delete this evaluation and all linked data? This cannot be undone.')) return;
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/evaluations/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setEvaluations((prev) => prev.filter((e) => e.id !== id));
    } else {
      const payload = await res.json().catch(() => null);
      window.alert(payload?.message || 'Unable to delete.');
    }
  }

  const pieData = useMemo(() => [
    { name: 'Active',   value: evaluations.filter((e) => e.status === 'ACTIVE').length,   status: 'ACTIVE' },
    { name: 'Draft',    value: evaluations.filter((e) => e.status === 'DRAFT').length,    status: 'DRAFT' },
    { name: 'Closed',   value: evaluations.filter((e) => e.status === 'CLOSED').length,   status: 'CLOSED' },
    { name: 'Archived', value: evaluations.filter((e) => e.status === 'ARCHIVED').length, status: 'ARCHIVED' },
  ].filter((d) => d.value > 0), [evaluations]);

  const filtered = useMemo(() =>
    activeStatusFilter === 'ALL' ? evaluations : evaluations.filter((e) => e.status === activeStatusFilter),
    [evaluations, activeStatusFilter],
  );

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* ── Header ── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Super Admin · Projects</p>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Projects</h1>
            <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary ring-1 ring-primary/20">
              {evaluations.length}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-slate-500">Manage all organisational evaluation projects.</p>
        </div>
      </div>

      {/* ── Stats + Chart ── */}
      <div className="mb-8 grid gap-4 xl:grid-cols-[1fr_300px]">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total',    value: evaluations.length,                                     icon: '📋', grad: 'from-blue-500 to-indigo-600' },
            { label: 'Active',   value: evaluations.filter((e) => e.status === 'ACTIVE').length,  icon: '🟢', grad: 'from-emerald-400 to-green-600' },
            { label: 'Draft',    value: evaluations.filter((e) => e.status === 'DRAFT').length,   icon: '📝', grad: 'from-slate-400 to-slate-600' },
            { label: 'Closed',   value: evaluations.filter((e) => e.status === 'CLOSED').length,  icon: '🔒', grad: 'from-orange-400 to-orange-600' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.grad} text-lg shadow-md`}>
                {s.icon}
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Pie chart */}
        {pieData.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Status distribution</p>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="40%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry) => (
                      <Cell key={entry.status} fill={PIE_COLORS[entry.status] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius: '10px', fontSize: '11px' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ── Filter tabs ── */}
      <div className="mb-6 flex flex-wrap gap-2">
        {['ALL', 'ACTIVE', 'DRAFT', 'CLOSED', 'ARCHIVED'].map((status) => {
          const count = status === 'ALL' ? evaluations.length : evaluations.filter((e) => e.status === status).length;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setActiveStatusFilter(status)}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                activeStatusFilter === status
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-primary/30'
              }`}
            >
              {status === 'ALL' ? 'All' : STATUS_CFG[status]?.label ?? status}
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                activeStatusFilter === status ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1,2,3,4,5,6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📋"
          title={activeStatusFilter === 'ALL' ? 'No evaluations yet' : `No ${activeStatusFilter.toLowerCase()} evaluations`}
          description={activeStatusFilter === 'ALL' ? 'Create your first evaluation project to start collecting organisational data.' : 'Try a different filter.'}
          actionLabel={activeStatusFilter === 'ALL' ? 'Create Evaluation' : undefined}
          onAction={activeStatusFilter === 'ALL' ? () => (window.location.href = '/evaluations/new') : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((ev) => (
            <EvaluationCard
              key={ev.id}
              evaluation={ev}
              onArchive={() => setArchiveTarget(ev)}
              onDelete={() => deleteEvaluation(ev.id)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={archiveTarget !== null}
        title={`Archive "${archiveTarget?.title}"?`}
        description="This evaluation will be archived. All data, responses, and reports will be retained."
        confirmLabel="Archive Evaluation"
        cancelLabel="Keep Active"
        onConfirm={() => archiveTarget && archiveEvaluation(archiveTarget.id)}
        onCancel={() => setArchiveTarget(null)}
      />
    </div>
  );
}
