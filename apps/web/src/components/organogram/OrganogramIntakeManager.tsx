'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface OrganisationOption {
  id: string;
  name: string;
  sector?: string | null;
}

interface OrganogramIntakeResponse {
  id: string;
  organisationId: string;
  organisationName: string;
  submittedAt: string;
  submittedBy?: { name?: string | null; role?: string | null } | null;
  intake: unknown;
  prompt: string;
  publishedAt?: string | null;
}

interface OrganogramIntakeManagerProps {
  initialOrgId?: string;
}

interface OrganogramDraft {
  nodes?: unknown[];
  links?: unknown[];
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function isOrganogramDraft(value: unknown): value is OrganogramDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as OrganogramDraft;
  return Array.isArray(draft.nodes) && Array.isArray(draft.links);
}

export default function OrganogramIntakeManager({ initialOrgId = '' }: OrganogramIntakeManagerProps) {
  const [organisations, setOrganisations] = useState<OrganisationOption[]>([]);
  const [selectedOrganisationId, setSelectedOrganisationId] = useState('');
  const [intakeLink, setIntakeLink] = useState('');
  const [intakeResponses, setIntakeResponses] = useState<OrganogramIntakeResponse[]>([]);
  const [intakeLoading, setIntakeLoading] = useState(false);
  const [intakeMsg, setIntakeMsg] = useState('');
  const [publishingResponseId, setPublishingResponseId] = useState('');
  const [organogramDrafts, setOrganogramDrafts] = useState<Record<string, string>>({});

  const loadIntakeResponses = useCallback(async () => {
    setIntakeLoading(true);
    try {
      const responses = await apiFetch<OrganogramIntakeResponse[]>('/organogram-intake-responses');
      setIntakeResponses(responses);
    } catch {
      setIntakeResponses([]);
    } finally {
      setIntakeLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const orgs = await apiFetch<OrganisationOption[]>('/organisations');
        if (!cancelled) {
          setOrganisations(orgs);
          setSelectedOrganisationId((current) => current || initialOrgId || orgs[0]?.id || '');
        }
      } catch {
        if (!cancelled) setOrganisations([]);
      }
      if (!cancelled) loadIntakeResponses();
    }

    loadData();
    return () => { cancelled = true; };
  }, [initialOrgId, loadIntakeResponses]);

  async function createIntakeLink() {
    if (!selectedOrganisationId) {
      setIntakeMsg('Please select an organisation first.');
      return;
    }

    const created = await apiFetch<{ token: string }>('/organogram-intake-links', {
      method: 'POST',
      body: JSON.stringify({ organisationId: selectedOrganisationId }),
    });
    const link = `${window.location.origin}/organogram-intake?token=${created.token}`;
    setIntakeLink(link);
    await copyText(link, 'Organogram intake link copied.');
  }

  async function copyText(text: string, message: string) {
    await navigator.clipboard.writeText(text).catch(() => window.prompt('Copy this text:', text));
    setIntakeMsg(message);
    window.setTimeout(() => setIntakeMsg(''), 3500);
  }

  async function publishIntakeOrganogram(response: OrganogramIntakeResponse) {
    const raw = organogramDrafts[response.id] || '';
    if (!raw.trim()) {
      setIntakeMsg('Paste the organogram JSON from ChatGPT or Claude before publishing.');
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      setIntakeMsg('The pasted organogram is not valid JSON.');
      return;
    }

    const organogram = parsed && typeof parsed === 'object' && 'organogram' in parsed
      ? (parsed as { organogram?: unknown }).organogram
      : parsed;
    if (!isOrganogramDraft(organogram)) {
      setIntakeMsg('JSON must include organogram.nodes and organogram.links arrays.');
      return;
    }

    setPublishingResponseId(response.id);
    try {
      const result = await apiFetch<{ message: string }>(`/organogram-intake-responses/${response.id}/publish`, {
        method: 'POST',
        body: JSON.stringify({ organogram }),
      });
      setIntakeMsg(result.message || 'Organogram published.');
      await loadIntakeResponses();
    } catch (error) {
      setIntakeMsg(getErrorMessage(error, 'Unable to publish organogram.'));
    } finally {
      setPublishingResponseId('');
    }
  }

  return (
    <div className="border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-teal-600">Standalone organogram form</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">Create a client-specific intake link</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Select an organisation you already created, copy the link, and send it to the CEO or HR lead. Their response will appear below for AI conversion and publishing.
          </p>
        </div>
        <Link
          href="/organisations/new"
          className="inline-flex items-center justify-center border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
        >
          Create organisation
        </Link>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(220px,360px)_auto_1fr] lg:items-end">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Organisation</span>
          <select
            value={selectedOrganisationId}
            onChange={(event) => { setSelectedOrganisationId(event.target.value); setIntakeLink(''); }}
            className="w-full border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          >
            <option value="">Select organisation</option>
            {organisations.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={createIntakeLink}
          disabled={!selectedOrganisationId}
          className="bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50"
        >
          Generate copy link
        </button>
        {intakeLink && (
          <div className="flex min-w-0 gap-2 border border-teal-100 bg-teal-50 p-2">
            <input readOnly value={intakeLink} className="min-w-0 flex-1 bg-transparent px-2 text-xs font-semibold text-teal-900 outline-none" />
            <button type="button" onClick={() => copyText(intakeLink, 'Link copied.')} className="bg-white px-3 py-1.5 text-xs font-bold text-teal-700">
              Copy
            </button>
          </div>
        )}
      </div>

      {intakeMsg && (
        <div className="mt-4 border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {intakeMsg}
        </div>
      )}

      <div className="mt-6 border-t border-slate-100 pt-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Submitted organogram responses</h3>
            <p className="text-sm text-slate-500">Copy the AI prompt, paste the generated organogram JSON back here, then publish to the organisation account.</p>
          </div>
          <button type="button" onClick={loadIntakeResponses} className="border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
            Refresh
          </button>
        </div>

        {intakeLoading ? (
          <div className="border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">Loading responses...</div>
        ) : intakeResponses.length === 0 ? (
          <div className="border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">No submitted organogram responses yet.</div>
        ) : (
          <div className="space-y-4">
            {intakeResponses.map((response) => (
              <div key={response.id} className="border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{response.organisationName}</p>
                    <p className="text-xs text-slate-500">
                      Submitted {new Date(response.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {response.submittedBy?.name ? ` by ${response.submittedBy.name}` : ''}
                      {response.submittedBy?.role ? ` (${response.submittedBy.role})` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {response.publishedAt && <span className="bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Published</span>}
                    <button type="button" onClick={() => copyText(JSON.stringify(response.intake, null, 2), 'Raw response copied.')} className="border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">
                      Copy response
                    </button>
                    <button type="button" onClick={() => copyText(response.prompt, 'AI prompt copied. Paste it into ChatGPT or Claude.')} className="bg-blue-600 px-3 py-2 text-xs font-bold text-white">
                      Copy response + prompt
                    </button>
                  </div>
                </div>
                <textarea
                  value={organogramDrafts[response.id] ?? ''}
                  onChange={(event) => setOrganogramDrafts(prev => ({ ...prev, [response.id]: event.target.value }))}
                  rows={7}
                  placeholder='Paste ChatGPT/Claude JSON here, e.g. {"organogram":{"nodes":[...],"links":[...]}}'
                  className="w-full border border-slate-200 bg-white p-3 font-mono text-xs text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => publishIntakeOrganogram(response)}
                    disabled={publishingResponseId === response.id}
                    className="bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {publishingResponseId === response.id ? 'Publishing...' : 'Publish organogram to organisation'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
