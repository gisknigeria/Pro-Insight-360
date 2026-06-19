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
  responsesDetail?: Array<{
    respondent: string;
    submittedAt?: string | null;
    answers: Array<{ question: string; answer: string }>;
  }>;
  analyses?: Array<{
    id: string;
    publishedAt: string;
    summary?: string;
    analysis?: any;
  }>;
}

interface FormVersionsPayload {
  form?: { id: string; title: string; evaluationId?: string };
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
  const [clientAdmins, setClientAdmins] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [comparisonOutput, setComparisonOutput] = useState('');
  const [comparisonParsed, setComparisonParsed] = useState<any | null>(null);
  const [comparisonParseError, setComparisonParseError] = useState('');
  const [comparisonPublishMessage, setComparisonPublishMessage] = useState('');
  const [comparisonPublishError, setComparisonPublishError] = useState('');
  const [comparisonPublishing, setComparisonPublishing] = useState(false);

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
        apiFetch<{ id: string; name: string; email: string; role: string }[]>('/users')
          .then((users) => {
            const admins = users.filter((user) => user.role === 'CLIENT_ADMIN');
            setClientAdmins(admins.map((user) => ({ id: user.id, name: user.name || user.email, email: user.email })));
            if (admins.length > 0) setSelectedAdminId(admins[0].id);
          })
          .catch(() => setClientAdmins([]));
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
    const versionBlocks = versions.map((version) => {
      const responseText = (version.responsesDetail || []).map((response, index) => {
        const answers = response.answers.map((answer) => `Question: ${answer.question}\nAnswer: ${answer.answer}`).join('\n');
        return `Response ${index + 1}\nRespondent: ${response.respondent}\nSubmitted: ${response.submittedAt ? new Date(response.submittedAt).toLocaleString() : 'Unknown'}\n${answers}`;
      }).join('\n\n');

      const analysisText = (version.analyses || []).map((analysis, index) => (
        `Published analysis ${index + 1}\nPublished: ${analysis.publishedAt ? new Date(analysis.publishedAt).toLocaleString() : 'Unknown'}\nSummary: ${analysis.summary || ''}\nAnalysis JSON:\n${JSON.stringify(analysis.analysis || {}, null, 2)}`
      )).join('\n\n');

      return [
        `VERSION ${version.version}${version.isCurrent ? ' (LATEST)' : ''}`,
        `Question count: ${version.questionCount}`,
        `Submitted responses: ${version.responses}`,
        `Total answers: ${version.answers}`,
        `Published analyses: ${version.publishedAnalyses}`,
        `Gaps: ${version.gaps || 0}`,
        `Recommendations: ${version.recommendations || 0}`,
        `Charts: ${version.charts || 0}`,
        version.latestSummary ? `Latest professional summary: ${version.latestSummary}` : 'Latest professional summary: Not published yet',
        '',
        'Submitted response data:',
        responseText || 'No submitted responses for this version yet.',
        '',
        'Published analysis data:',
        analysisText || 'No published analysis for this version yet.',
      ].join('\n');
    }).join('\n\n====================\n\n');

    const text = [
      'You are an expert organisational analyst comparing repeat assessment runs for the same insight/form.',
      'Use ONLY the response data and published analysis data below. Compare every version together and explain measurable improvement, decline, unchanged gaps, and what leadership should do next.',
      '',
      'Return valid JSON only with this structure:',
      '{',
      '  "title": "Version comparison analysis",',
      '  "executiveSummary": "Professional comparison summary",',
      '  "comparisonSummary": "What improved and what declined across versions",',
      '  "improvements": ["..."],',
      '  "declines": ["..."],',
      '  "unchangedGaps": ["..."],',
      '  "gaps": ["..."],',
      '  "recommendations": ["..."],',
      '  "actionPlan": [{ "who": "...", "what": "...", "how": "...", "when": "..." }],',
      '  "charts": [{ "title": "Version growth", "data": [{ "label": "V1", "value": 0 }] }],',
      '  "questions": [{ "question": "Version comparison", "answer": "..." }]',
      '}',
      '',
      `Insight/Form: ${definition?.title || 'Untitled form'}`,
      `Latest version: V${versionInfo?.currentVersion || 1}`,
      '',
      versionBlocks,
    ].join('\n\n');

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      window.prompt('Copy this version comparison brief:', text);
    }
    setComparisonCopied(true);
    window.setTimeout(() => setComparisonCopied(false), 2200);
  }

  function parseComparisonOutput() {
    setComparisonParseError('');
    setComparisonPublishMessage('');
    setComparisonPublishError('');
    try {
      const text = comparisonOutput.trim();
      const start = text.indexOf('{');
      const parsed = JSON.parse(start >= 0 ? text.slice(start) : text);
      setComparisonParsed({
        ...parsed,
        analysisType: 'VERSION_COMPARISON',
        comparedVersions: versionInfo?.versions.map((version) => version.version) || [],
      });
    } catch {
      setComparisonParsed(null);
      setComparisonParseError('Could not parse the comparison JSON. Paste valid JSON from ChatGPT or Claude.');
    }
  }

  async function publishComparisonAnalysis() {
    setComparisonPublishMessage('');
    setComparisonPublishError('');
    if (!comparisonParsed) {
      setComparisonPublishError('Parse a comparison analysis before publishing.');
      return;
    }
    if (!selectedAdminId) {
      setComparisonPublishError('Select a client admin recipient.');
      return;
    }
    if (!versionInfo?.form?.evaluationId) {
      setComparisonPublishError('This form is not attached to an evaluation.');
      return;
    }

    setComparisonPublishing(true);
    try {
      const result = await apiFetch<{ message: string }>('/diagnoses/publish', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: selectedAdminId,
          evaluationId: versionInfo.form.evaluationId,
          formVersion: versionInfo.currentVersion,
          analysis: comparisonParsed,
        }),
      });
      setComparisonPublishMessage(result.message || 'Comparison analysis published successfully.');
      await refreshVersions();
    } catch (err: any) {
      setComparisonPublishError(err?.message || 'Unable to publish comparison analysis.');
    } finally {
      setComparisonPublishing(false);
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

      <section className="grid gap-4 bg-slate-950 p-5 text-white shadow-sm lg:grid-cols-[1fr_1fr]">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="bg-primary p-2 text-white">
              <AppIcon name="chart" className="h-6 w-6 text-white" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Comparison analysis</h2>
              <p className="text-sm text-slate-200">
                Paste the AI version-comparison JSON here, preview it, then publish it to the client admin like a normal analysis.
              </p>
            </div>
          </div>
          <textarea
            value={comparisonOutput}
            onChange={(event) => setComparisonOutput(event.target.value)}
            rows={10}
            className="w-full bg-white p-3 text-sm font-medium text-slate-950 outline-none ring-2 ring-transparent focus:ring-primary"
            placeholder='Paste comparison JSON here, for example { "executiveSummary": "...", "improvements": [], "charts": [] }'
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={parseComparisonOutput}
              className="inline-flex items-center gap-2 bg-white px-4 py-2 text-sm font-bold text-slate-950 hover:bg-slate-100"
            >
              <AppIcon name="check" className="h-5 w-5 text-slate-950" />
              Parse comparison
            </button>
            <button
              type="button"
              onClick={() => void copyVersionComparison()}
              className="inline-flex items-center gap-2 bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
            >
              <AppIcon name={comparisonCopied ? 'check' : 'copy'} className="h-5 w-5 text-white" />
              {comparisonCopied ? 'Prompt copied' : 'Copy full comparison prompt'}
            </button>
          </div>
          {comparisonParseError ? <p className="mt-3 bg-red-50 p-3 text-sm font-bold text-red-700">{comparisonParseError}</p> : null}
        </div>

        <div className="bg-slate-900 p-5">
          <h3 className="text-base font-bold text-white">Preview and publish</h3>
          {comparisonParsed ? (
            <div className="mt-4 space-y-4">
              <div className="bg-white p-4 text-slate-950">
                <p className="text-sm font-black text-slate-950">{comparisonParsed.title || 'Version comparison analysis'}</p>
                <p className="mt-2 text-sm text-slate-700">{comparisonParsed.executiveSummary || comparisonParsed.comparisonSummary || 'No summary provided.'}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Improvements', value: Array.isArray(comparisonParsed.improvements) ? comparisonParsed.improvements.length : 0 },
                  { label: 'Gaps', value: Array.isArray(comparisonParsed.gaps) ? comparisonParsed.gaps.length : 0 },
                  { label: 'Charts', value: Array.isArray(comparisonParsed.charts) ? comparisonParsed.charts.length : 0 },
                ].map((metric) => (
                  <div key={metric.label} className="bg-white/10 p-3 text-white">
                    <p className="text-xs font-bold uppercase text-slate-300">{metric.label}</p>
                    <p className="mt-1 text-xl font-black text-white">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 bg-white/10 p-4 text-sm text-slate-200">Parse a comparison JSON to preview it here.</div>
          )}

          <div className="mt-5 grid gap-3">
            <label className="text-sm font-bold text-white" htmlFor="comparison-client-admin">Publish to client admin</label>
            <select
              id="comparison-client-admin"
              value={selectedAdminId}
              onChange={(event) => setSelectedAdminId(event.target.value)}
              className="bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none ring-2 ring-transparent focus:ring-primary"
            >
              {clientAdmins.length === 0 ? (
                <option value="">No client admins found</option>
              ) : clientAdmins.map((admin) => (
                <option key={admin.id} value={admin.id}>{admin.name} ({admin.email})</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void publishComparisonAnalysis()}
              disabled={comparisonPublishing || !comparisonParsed || clientAdmins.length === 0}
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-600"
            >
              <AppIcon name="upload" className="h-5 w-5 text-white" />
              {comparisonPublishing ? 'Publishing comparison' : 'Publish comparison analysis'}
            </button>
          </div>
          {comparisonPublishMessage ? <p className="mt-3 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{comparisonPublishMessage}</p> : null}
          {comparisonPublishError ? <p className="mt-3 bg-red-50 p-3 text-sm font-bold text-red-700">{comparisonPublishError}</p> : null}
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


