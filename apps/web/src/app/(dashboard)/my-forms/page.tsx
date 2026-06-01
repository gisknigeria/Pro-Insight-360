'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { EmptyState } from '@/components/ui/empty-state';

interface AssignedForm {
  formId: string;
  title: string;
  evaluationTitle: string;
  responseDeadline: string | null;
  assignedAt: string;
  completionStatus: 'not_started' | 'in_progress' | 'submitted';
  submittedAt: string | null;
}

const STATUS_LABELS = {
  not_started: { label: 'Not started', className: 'bg-slate-100 text-slate-600' },
  in_progress: { label: 'In progress', className: 'bg-amber-100 text-amber-800' },
  submitted: { label: 'Submitted', className: 'bg-green-100 text-green-800' },
};

export default function MyFormsPage() {
  const [forms, setForms] = useState<AssignedForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<AssignedForm[]>('/responses/assigned')
      .then(setForms)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Could not load your forms.'),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-slate-500 text-sm">Loading your assigned forms…</p>;
  }

  if (error) {
    return (
      <div role="alert" className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">My Forms</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Forms assigned to you. You can save your progress and return anytime before the deadline.
        </p>
      </div>

      {forms.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200">
          <EmptyState
            icon="📝"
            title="No forms assigned yet"
            description="When your administrator assigns you a form, it will appear here."
          />
        </div>
      ) : (
        <ul className="space-y-3" role="list">
          {forms.map((form) => {
            const status = STATUS_LABELS[form.completionStatus];
            const isDone = form.completionStatus === 'submitted';
            return (
              <li
                key={form.formId}
                className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 mb-0.5">{form.evaluationTitle}</p>
                  <h2 className="text-base font-semibold text-slate-900">{form.title}</h2>
                  {form.responseDeadline && (
                    <p className="text-xs text-slate-500 mt-1">
                      Deadline:{' '}
                      {new Date(form.responseDeadline).toLocaleDateString(undefined, {
                        dateStyle: 'medium',
                      })}
                    </p>
                  )}
                </div>
                <span
                  className={`self-start text-xs font-medium px-2.5 py-1 rounded-full ${status.className}`}
                >
                  {status.label}
                </span>
                {!isDone ? (
                  <Link
                    href={`/my-forms/${form.formId}`}
                    className="shrink-0 inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
                  >
                    {form.completionStatus === 'in_progress'
                      ? 'Continue form'
                      : 'Start form'}
                  </Link>
                ) : (
                  <span className="text-sm text-slate-500 shrink-0">
                    Submitted{' '}
                    {form.submittedAt
                      ? new Date(form.submittedAt).toLocaleDateString()
                      : ''}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
