'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';
import { OfflineStatusBanner } from '@/components/form-renderer/offline-status-banner';
import { apiFetch } from '@/lib/api';

interface FormAssignment {
  formId: string;
  formTitle: string;
  evaluationTitle: string;
  deadline: string | null;
  hoursLeft: number | null;
  urgent: boolean;
  assignedAt: string;
}

export default function MyFormsPage() {
  const [assignments, setAssignments] = useState<FormAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<FormAssignment[]>('/form-assignments/me')
      .then(setAssignments)
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, []);

  const pending = assignments;

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* ── Header ── */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Respondent · Assignments</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Forms</h1>
        <p className="mt-1.5 text-sm text-slate-500">Complete your assigned forms below. Your responses drive organisational insights.</p>
      </div>

      <div className="mb-6">
        <OfflineStatusBanner />
      </div>

      {/* ── Stats ── */}
      {!loading && assignments.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { label: 'Assigned', value: assignments.length, icon: '📋', grad: 'from-blue-500 to-indigo-600' },
            { label: 'Urgent',   value: assignments.filter((f) => f.urgent).length, icon: '⚡', grad: 'from-red-400 to-rose-600' },
            { label: 'Pending',  value: pending.length, icon: '⏳', grad: 'from-amber-400 to-orange-500' },
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
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-3xl bg-white border border-slate-200" />
          ))}
        </div>
      ) : pending.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No forms assigned yet"
          description="When a consultant assigns forms to you, they will appear here. Check back later."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-bold text-slate-900">Forms to complete</h2>
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full bg-primary text-xs font-bold text-white px-1">
              {pending.length}
            </span>
          </div>

          {pending.map((form) => (
            <div
              key={form.formId}
              className={`group relative rounded-3xl border bg-white p-5 shadow-sm hover:shadow-md transition-all ${
                form.urgent ? 'border-red-200 bg-red-50/30' : 'border-slate-200 hover:border-primary/30'
              }`}
            >
              {form.urgent && (
                <div className="absolute top-0 left-6 right-6 h-0.5 rounded-full bg-gradient-to-r from-red-400 to-rose-500" />
              )}

              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base ${
                    form.urgent ? 'bg-red-100' : 'bg-primary/10'
                  }`}>
                    {form.urgent ? '⚡' : '📋'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{form.formTitle}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{form.evaluationTitle}</p>
                    {form.deadline && (
                      <p className={`text-xs mt-2 font-semibold inline-flex items-center gap-1 ${
                        form.urgent ? 'text-red-600' : 'text-slate-500'
                      }`}>
                        {form.urgent ? '⚠️ Due soon:' : '📅 Deadline:'}
                        {' '}{new Date(form.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {form.hoursLeft !== null && form.hoursLeft > 0 && (
                          <span className={`rounded-full px-2 py-0.5 text-xs ${form.urgent ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                            {form.hoursLeft}h left
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <Link
                  href={`/my-forms/${form.formId}`}
                  className={`shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm ${
                    form.urgent
                      ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-200'
                      : 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-primary/20'
                  }`}
                >
                  Complete →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
