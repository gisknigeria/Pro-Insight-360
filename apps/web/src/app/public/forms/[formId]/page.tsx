'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { AppIcon } from '@/components/ui/app-icons';
import type { FormDefinition } from '@/components/form-builder/form-builder.types';
import { FormRenderer, answersToPayload } from '@/components/form-renderer/form-renderer';
import { OfflineStatusBanner } from '@/components/form-renderer/offline-status-banner';

export default function PublicFillFormPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.formId as string;

  const [definition, setDefinition] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');

  useEffect(() => {
    if (!formId) return;

    apiFetch<FormDefinition>(`/forms/${formId}/definition`)
      .then((def) => setDefinition(def))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Could not load this form.'),
      )
      .finally(() => setLoading(false));
  }, [formId]);

  async function handleSubmit(answers: Record<string, unknown>) {
    await apiFetch('/responses/public/submit', {
      method: 'POST',
      body: JSON.stringify({
        formId,
        answers: answersToPayload(answers),
        respondentName: respondentName.trim() || undefined,
        respondentEmail: respondentEmail.trim() || undefined,
      }),
    });
    setSubmitted(true);
    setTimeout(() => router.push('/'), 2000);
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading form...</p>;
  }

  if (error) {
    return (
      <div>
        <Link href="/" className="mb-4 inline-block text-sm text-primary hover:underline">
          Back to home
        </Link>
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <AppIcon name="check" className="h-6 w-6" />
        </span>
        <h1 className="text-xl font-semibold text-slate-900">Thank you!</h1>
        <p className="mt-2 text-sm text-slate-500">
          Your response has been submitted. Returning to the home page...
        </p>
      </div>
    );
  }

  if (!definition) return null;

  return (
    <div>
      <Link href="/" className="mb-4 inline-block text-sm text-primary hover:underline">
        Back to home
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{definition.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          This form is public and can be completed without logging in.
        </p>
      </div>

      <div className="mb-6">
        <OfflineStatusBanner />
      </div>

      <div className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Your name</span>
          <input
            value={respondentName}
            onChange={(event) => setRespondentName(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Optional"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Your email</span>
          <input
            type="email"
            value={respondentEmail}
            onChange={(event) => setRespondentEmail(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Optional"
          />
        </label>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
        <FormRenderer
          definition={definition}
          formId={formId}
          initialAnswers={{}}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
