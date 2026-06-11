'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
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
      body: JSON.stringify({ formId, answers: answersToPayload(answers) }),
    });
    setSubmitted(true);
    setTimeout(() => router.push('/'), 2000);
  }

  if (loading) {
    return <p className="text-slate-500 text-sm">Loading form…</p>;
  }

  if (error) {
    return (
      <div>
        <Link href="/" className="text-sm text-primary hover:underline mb-4 inline-block">
          ← Back to home
        </Link>
        <div role="alert" className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-4xl mb-4" aria-hidden="true">
          ✅
        </p>
        <h1 className="text-xl font-semibold text-slate-900">Thank you!</h1>
        <p className="text-slate-500 mt-2 text-sm">
          Your response has been submitted. Returning to the home page…
        </p>
      </div>
    );
  }

  if (!definition) return null;

  return (
    <div>
      <Link href="/" className="text-sm text-primary hover:underline mb-4 inline-block">
        ← Back to home
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{definition.title}</h1>
        <p className="text-slate-500 mt-1 text-sm">
          This form is public and can be completed without logging in.
        </p>
      </div>

      <div className="mb-6">
        <OfflineStatusBanner />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
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
