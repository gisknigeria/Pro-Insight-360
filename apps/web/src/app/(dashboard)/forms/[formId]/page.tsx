'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { FormBuilderCanvas } from '@/components/form-builder/form-builder-canvas';
import { FormPreviewModal } from '@/components/form-builder/form-preview-modal';
import type { FormDefinition } from '@/components/form-builder/form-builder.types';

export default function EditFormPage() {
  const params = useParams();
  const formId = params.formId as string;

  const [definition, setDefinition] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (!formId) return;

    async function loadDefinition() {
      setError('');
      setLoading(true);

      try {
        const data = await apiFetch<FormDefinition>(`/forms/${formId}/definition`);
        setDefinition(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load form definition.');
      } finally {
        setLoading(false);
      }
    }

    loadDefinition();
  }, [formId]);

  async function handleSave(updatedDefinition: FormDefinition) {
    const payload = {
      title: updatedDefinition.title,
      definition: updatedDefinition,
    };

    await apiFetch(`/forms/${formId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    setDefinition(updatedDefinition);
    setSaveMessage('Form saved successfully.');
    window.setTimeout(() => setSaveMessage(''), 3000);
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !definition) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <Link href="/forms" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
          ← Back to forms
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || 'Unable to find this form.'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Edit form</h1>
          <p className="mt-2 text-sm text-slate-500">
            Build your questionnaire here. Drag questions from the palette, set answer types, and preview the respondent experience.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/forms"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to forms
          </Link>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Preview all questions
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {saveMessage}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <FormBuilderCanvas
          initialDefinition={definition}
          formTitle={definition.title}
          onSave={handleSave}
          onPreview={() => setPreviewOpen(true)}
        />
      </div>

      <FormPreviewModal
        open={previewOpen}
        definition={definition}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
