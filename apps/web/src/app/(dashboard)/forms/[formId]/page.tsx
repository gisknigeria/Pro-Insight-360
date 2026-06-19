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
type VersionedFormDefinition = FormDefinition & {
  currentVersion?: number;
  version?: number;
  versions?: Array<{ version: number; title?: string; questionCount?: number; createdAt?: string }>;
};

interface FormVersionSummary {
  version: number;
  title: string;
  questionCount: number;
  createdAt?: string | null;
  isCurrent: boolean;
  responses: number;
  answers: number;
  latestSubmittedAt?: string | null;
  publishedAnalyses: number;
  latestPublishedAt?: string | null;
  latestSummary?: string;
  gaps?: number;
  recommendations?: number;
  charts?: number;
}

interface FormVersionsPayload {
  currentVersion: number;
  versions: FormVersionSummary[];
}

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
  const [versionInfo, setVersionInfo] = useState<FormVersionsPayload | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [republishing, setRepublishing] = useState(false);
  const [comparisonCopied, setComparisonCopied] = useState(false);

  useEffect(() => {
    if (!formId) return;

    async function loadDefinition() {
      setError('');
      setLoading(true);

      try {
        const data = await apiFetch<VersionedFormDefinition>(`/forms/${formId}/definition`);
        setDefinition(data);
        setAccessMode(((data as FormDefinition & { accessMode?: FormAccessMode }).accessMode || 'REGISTERED') as FormAccessMode);
        const versions = await apiFetch<FormVersionsPayload>(`/forms/${formId}/versions`);
        setVersionInfo(versions);
        setSelectedVersion(versions.currentVersion);
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

  async function refreshVersions() {
    const versions = await apiFetch<FormVersionsPayload>(`/forms/${formId}/versions`);
    setVersionInfo(versions);
    setSelectedVersion(versions.currentVersion);
    return versions;
  }

  async function republishNewVersion() {
    if (!definition || republishing) return;
    const current = versionInfo?.currentVersion || (definition as VersionedFormDefinition).currentVersion || (definition as VersionedFormDefinition).version || 1;
    const confirmed = window.confirm(`Republish this questionnaire as version ${current + 1}? The invite link will stay the same, and new responses will be counted under the new version.`);
    if (!confirmed) return;

    setRepublishing(true);
    try {
      const result = await apiFetch<{ message?: string; currentVersion: number }>(`/forms/${formId}/republish-version`, {
        method: 'POST',
        body: JSON.stringify({ note: `Republished from version ${current}` }),
      });
      const nextDefinition = {
        ...(definition as VersionedFormDefinition),
        currentVersion: result.currentVersion,
        version: result.currentVersion,
      };
      setDefinition(nextDefinition);
      await refreshVersions();
      setSaveMessage(result.message || `Form republished as version ${result.currentVersion}.`);
      window.setTimeout(() => setSaveMessage(''), 4000);
    } finally {
      setRepublishing(false);
    }
  }

  async function copyVersionComparison() {
    const versions = versionInfo?.versions || [];
    if (versions.length === 0) return;
    const text = [
      `Insight/Form: ${definition?.title || 'Untitled form'}`,
      `Latest version: V${versionInfo?.currentVersion || 1}`,
      '',
      'Compare these assessment runs and explain what improved, what declined, and what leadership should do next:',
      '',
      ...versions.map((version) => [
        `Version ${version.version}${version.isCurrent ? ' (latest)' : ''}`,
        `Responses: ${version.responses}`,
        `Answers: ${version.answers}`,
        `Questions: ${version.questionCount}`,
        `Published analyses: ${version.publishedAnalyses}`,
        `Gaps identified: ${version.gaps || 0}`,
        `Recommendations: ${version.recommendations || 0}`,
        `Charts included: ${version.charts || 0}`,
        version.latestSummary ? `Latest professional summary: ${version.latestSummary}` : 'Latest professional summary: Not published yet',
      ].join('\n')),
    ].join('\n\n');

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      window.prompt('Copy this version comparison brief:', text);
    }
    setComparisonCopied(true);
    window.setTimeout(() => setComparisonCopied(false), 2200);
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

      <section className="grid gap-4 bg-slate-100 p-5 shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-slate-950 p-5 text-white">
          <div className="mb-4 flex items-center gap-3">
            <span className="bg-emerald-500 p-2 text-white">
              <AppIcon name="activity" className="h-6 w-6 text-white" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Versioned assessment runs</h2>
              <p className="text-sm text-slate-200">
                Rerun the same questionnaire over time and compare response growth, answers, and published insight outputs.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="bg-white p-4 text-slate-950">
              <span className="block text-xs font-bold uppercase text-slate-500">Latest version</span>
              <span className="mt-1 block text-3xl font-black text-slate-950">V{versionInfo?.currentVersion || (definition as VersionedFormDefinition).currentVersion || 1}</span>
            </div>
            <div className="bg-emerald-500 p-4 text-white">
              <span className="block text-xs font-bold uppercase text-emerald-50">Total runs</span>
              <span className="mt-1 block text-3xl font-black text-white">{versionInfo?.versions.length || 1}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void republishNewVersion()}
            disabled={republishing}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-600"
          >
            <AppIcon name="plus" className="h-5 w-5 text-white" />
            {republishing ? 'Republishing version' : 'Republish as newer version'}
          </button>
        </div>

        <div className="bg-white p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-950">Compare version performance</h3>
              <p className="text-sm text-slate-500">Switch versions to see what changed after each monthly or periodic rerun.</p>
            </div>
            <select
              value={selectedVersion || versionInfo?.currentVersion || 1}
              onChange={(event) => setSelectedVersion(Number(event.target.value))}
              className="bg-slate-950 px-3 py-2 text-sm font-bold text-white outline-none"
            >
              {(versionInfo?.versions || [{ version: 1, title: definition.title, questionCount: 0, isCurrent: true, responses: 0, answers: 0, publishedAnalyses: 0 }]).map((version) => (
                <option key={version.version} value={version.version}>Version {version.version}{version.isCurrent ? ' - latest' : ''}</option>
              ))}
            </select>
          </div>

          {(() => {
            const versions = versionInfo?.versions || [];
            const active = versions.find((version) => version.version === selectedVersion) || versions[versions.length - 1];
            const previous = active ? versions.filter((version) => version.version < active.version).at(-1) : null;
            const responseDelta = active && previous ? active.responses - previous.responses : active?.responses || 0;
            const analysisDelta = active && previous ? active.publishedAnalyses - previous.publishedAnalyses : active?.publishedAnalyses || 0;
            return active ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Responses', value: active.responses, delta: responseDelta },
                    { label: 'Answers', value: active.answers, delta: previous ? active.answers - previous.answers : active.answers },
                    { label: 'Questions', value: active.questionCount, delta: previous ? active.questionCount - previous.questionCount : active.questionCount },
                    { label: 'Published insight', value: active.publishedAnalyses, delta: analysisDelta },
                  ].map((metric) => (
                    <div key={metric.label} className="bg-slate-100 p-4">
                      <p className="text-xs font-bold uppercase text-slate-500">{metric.label}</p>
                      <p className="mt-2 text-2xl font-black text-slate-950">{metric.value}</p>
                      <p className={`mt-1 text-xs font-bold ${metric.delta >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {previous ? `${metric.delta >= 0 ? '+' : ''}${metric.delta} vs V${previous.version}` : 'Baseline version'}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Gaps', value: active.gaps || 0 },
                    { label: 'Recommendations', value: active.recommendations || 0 },
                    { label: 'Charts', value: active.charts || 0 },
                  ].map((metric) => (
                    <div key={metric.label} className="bg-emerald-50 p-4">
                      <p className="text-xs font-bold uppercase text-emerald-700">{metric.label}</p>
                      <p className="mt-2 text-2xl font-black text-slate-950">{metric.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-950 p-4 text-sm text-white">
                  <p className="font-bold text-white">Version {active.version} summary</p>
                  <p className="mt-1 text-slate-200">
                    {active.responses > 0
                      ? `${active.responses} submitted response${active.responses === 1 ? '' : 's'} captured for this run.`
                      : 'No responses have been submitted for this run yet.'}
                    {active.publishedAnalyses > 0
                      ? ` ${active.publishedAnalyses} published insight report${active.publishedAnalyses === 1 ? '' : 's'} can be compared against other versions.`
                      : ' No published insight has been attached to this version yet.'}
                  </p>
                  {active.latestSummary ? (
                    <p className="mt-3 bg-white/10 p-3 text-slate-100">{active.latestSummary}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => void copyVersionComparison()}
                  className="inline-flex items-center justify-center gap-2 bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary/90"
                >
                  <AppIcon name={comparisonCopied ? 'check' : 'copy'} className="h-5 w-5 text-white" />
                  {comparisonCopied ? 'Comparison brief copied' : 'Copy comparison brief'}
                </button>
              </div>
            ) : (
              <div className="bg-slate-100 p-4 text-sm font-medium text-slate-600">Version comparison will appear after this form is saved.</div>
            );
          })()}
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


