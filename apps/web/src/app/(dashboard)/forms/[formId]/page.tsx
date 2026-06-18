'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { AppIcon } from '@/components/ui/app-icons';
import { FormBuilderCanvas } from '@/components/form-builder/form-builder-canvas';
import { FormPreviewModal } from '@/components/form-builder/form-preview-modal';
import type { FormDefinition } from '@/components/form-builder/form-builder.types';

type FormAccessMode = 'REGISTERED' | 'PUBLIC';

export default function EditFormPage() {
  const params = useParams();
  const formId = params.formId as string;

  const [definition, setDefinition] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [accessMode, setAccessMode] = useState<FormAccessMode>('REGISTERED');
  const [accessSaving, setAccessSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!formId) return;

    async function loadDefinition() {
      setError('');
      setLoading(true);

      try {
        const data = await apiFetch<FormDefinition>(`/forms/${formId}/definition`);
        setDefinition(data);
        setAccessMode(((data as FormDefinition & { accessMode?: FormAccessMode }).accessMode || 'REGISTERED') as FormAccessMode);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load form definition.');
      } finally {
        setLoading(false);
      }
    }

    loadDefinition();
  }, [formId]);

  async function handleSave(updatedDefinition: FormDefinition) {
    const definitionWithAccess = {
      ...updatedDefinition,
      accessMode,
    };
    const payload = {
      title: definitionWithAccess.title,
      definition: definitionWithAccess,
      accessMode,
    };

    await apiFetch(`/forms/${formId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    setDefinition(definitionWithAccess);
    setSaveMessage('Form saved successfully.');
    window.setTimeout(() => setSaveMessage(''), 3000);
  }

  function inviteLink() {
    if (typeof window === 'undefined') return `/public/forms/${formId}`;
    return `${window.location.origin}/public/forms/${formId}`;
  }

  async function copyInviteLink() {
    const url = inviteLink();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Copy this questionnaire invite link:', url);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  async function saveAccessMode(nextMode = accessMode) {
    if (!definition) return;
    setAccessSaving(true);
    const nextDefinition = {
      ...definition,
      accessMode: nextMode,
    };
    try {
      await apiFetch(`/forms/${formId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: nextDefinition.title,
          definition: nextDefinition,
          accessMode: nextMode,
        }),
      });
      setDefinition(nextDefinition);
      setSaveMessage('Form access updated.');
      window.setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setAccessSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <AppIcon name="form" className="mx-auto h-10 w-10 animate-pulse text-primary" />
      </div>
    );
  }

  if (error || !definition) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <Link href="/forms" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          <AppIcon name="chevronRight" className="h-4 w-4 rotate-180" />
          Back to forms
        </Link>
        <div className="bg-red-50 p-6 text-sm font-medium text-red-700 shadow-sm">
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
            className="inline-flex items-center gap-2 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <AppIcon name="chevronRight" className="h-4 w-4 rotate-180" />
            Back to forms
          </Link>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-2 bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
          >
            <AppIcon name="play" className="h-4 w-4 text-white" />
            Preview all questions
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="bg-green-50 p-4 text-sm font-medium text-green-700 shadow-sm">
          {saveMessage}
        </div>
      )}

      <section className="grid gap-4 bg-slate-950 p-5 text-white shadow-sm lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="bg-primary p-2 text-white">
              <AppIcon name="link" className="h-6 w-6 text-white" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Form access and invite link</h2>
              <p className="text-sm text-slate-200">
                Control who can open this questionnaire and copy the live invite link for respondents.
              </p>
            </div>
          </div>
          <div className="bg-slate-800 p-3 text-sm font-medium text-white">
            <span className="block text-xs uppercase tracking-wide text-slate-300">Invite link</span>
            <span className="mt-1 block break-all text-white">{inviteLink()}</span>
          </div>
        </div>

        <div className="grid gap-3 bg-slate-900 p-4">
          <label className="text-sm font-bold text-white" htmlFor="form-access-mode">
            Who can see this form
          </label>
          <select
            id="form-access-mode"
            value={accessMode}
            onChange={(event) => {
              const nextMode = event.target.value as FormAccessMode;
              setAccessMode(nextMode);
              void saveAccessMode(nextMode);
            }}
            className="bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none ring-2 ring-transparent focus:ring-primary"
            disabled={accessSaving}
          >
            <option value="REGISTERED">Only invited or registered users</option>
            <option value="PUBLIC">Anyone with the invite link</option>
          </select>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void saveAccessMode()}
              disabled={accessSaving}
              className="inline-flex items-center justify-center gap-2 bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-600"
            >
              <AppIcon name="check" className="h-5 w-5 text-white" />
              {accessSaving ? 'Saving access' : 'Save access'}
            </button>
            <button
              type="button"
              onClick={() => void copyInviteLink()}
              className="inline-flex items-center justify-center gap-2 bg-white px-4 py-2 text-sm font-bold text-slate-950 hover:bg-slate-100"
            >
              <AppIcon name={copied ? 'check' : 'copy'} className="h-5 w-5 text-slate-950" />
              {copied ? 'Copied' : 'Copy invite link'}
            </button>
          </div>
        </div>
      </section>

      <div className="bg-white shadow-sm">
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


