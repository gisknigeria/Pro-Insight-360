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
  const completed: FormAssignment[] = [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Forms</h1>
        <p className="text-slate-500 mt-1 text-sm">Forms you have been assigned to complete.</p>
      </div>

      <div className="mb-4">
        <OfflineStatusBanner />
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm py-8 text-center">Loading your forms…</div>
      ) : pending.length === 0 && completed.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No forms assigned yet"
          description="When a consultant assigns forms to you, they will appear here. Check back later."
        />
      ) : (
        <div className="space-y-6">
          {/* Pending forms */}
          {pending.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-900 mb-3">
                Forms to complete
                <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full">
                  {pending.length}
                </span>
              </h2>
              <div className="space-y-3">
                {pending.map((form) => (
                  <div
                    key={form.formId}
                    className={`bg-white rounded-xl border p-5 ${
                      form.urgent ? 'border-red-300 bg-red-50' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 mb-0.5">{form.formTitle}</p>
                        <p className="text-xs text-slate-500">{form.evaluationTitle}</p>
                        {form.deadline && (
                          <p className={`text-xs mt-1.5 font-medium ${form.urgent ? 'text-red-600' : 'text-slate-500'}`}>
                            {form.urgent ? '⚠️ ' : ''}
                            Deadline: {new Date(form.deadline).toLocaleDateString()}
                            {form.hoursLeft !== null && form.hoursLeft > 0 && (
                              <span className="ml-1">({form.hoursLeft}h left)</span>
                            )}
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/my-forms/${form.formId}`}
                        className="shrink-0 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
                      >
                        Complete Form
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed forms */}
          {completed.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 mb-3">
                Completed ({completed.length})
              </h2>
              <div className="space-y-2">
                {completed.map((form) => (
                  <div key={form.formId} className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-5 py-3">
                    <span className="text-green-500" aria-hidden="true">✓</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 font-medium">{form.formTitle}</p>
                      <p className="text-xs text-slate-400">{form.evaluationTitle}</p>
                    </div>
                    <span className="text-xs text-slate-400">Submitted</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
