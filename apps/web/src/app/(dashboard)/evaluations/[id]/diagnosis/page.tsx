'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ScoreCard } from '@/components/diagnosis/score-card';
import { ConflictsPanel } from '@/components/diagnosis/conflicts-panel';
import { GapAnalysisPanel } from '@/components/diagnosis/gap-analysis-panel';
import { EmptyState } from '@/components/ui/empty-state';

type Tab = 'scores' | 'conflicts' | 'gaps' | 'responses';

function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setLoading(true);
    setError('');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const payload = await res.json().catch(() => null);
        if (!res.ok) {
          const message = typeof payload?.message === 'string'
            ? payload.message
            : 'Failed to load data.';
          setError(message);
          setData(null);
          return;
        }
        setData(payload as T);
      })
      .catch(() => {
        setError('Failed to load data.');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [url, refreshKey]);

  return {
    data,
    loading,
    error,
    refresh: () => setRefreshKey((current) => current + 1),
  };
}

export default function EvaluationDiagnosisPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>('scores');
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState('');
  const [allResponses, setAllResponses] = useState<any[] | null>(null);
  const [allResponsesLoading, setAllResponsesLoading] = useState(false);
  const [showAllResponses, setShowAllResponses] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

  const scoresApi = useApi<any[]>(`/diagnosis/evaluations/${id}/scores`);
  const conflictsApi = useApi<any[]>(`/diagnosis/evaluations/${id}/conflicts`);
  const gapsApi = useApi<any>(`/diagnosis/evaluations/${id}/gaps`);
  const responsesApi = useApi<any>(`/diagnosis/evaluations/${id}/responses`);

  const scores = scoresApi.data;
  const conflicts = conflictsApi.data;
  const gaps = gapsApi.data as any[] | null;
  const responses = responsesApi.data;
  const scoresLoading = scoresApi.loading;
  const conflictsLoading = conflictsApi.loading;
  const gapsLoading = gapsApi.loading;
  const responsesLoading = responsesApi.loading;
  const pageError = scoresApi.error || conflictsApi.error || gapsApi.error || responsesApi.error;

  function buildGapSummary(gapsData: any[] | null) {
    if (!gapsData) return null;

    const bySeverity = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const byCategory: Record<string, any[]> = {};

    for (const gap of gapsData) {
      const severity = (gap.severity || 'low').toLowerCase();
      if (severity in bySeverity) {
        bySeverity[severity as keyof typeof bySeverity] += 1;
      }

      const category = gap.category || 'Other';
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(gap);
    }

    return {
      total: gapsData.length,
      bySeverity,
      byCategory,
      gaps: gapsData,
    };
  }

  const gapSummary = buildGapSummary(gaps);

  async function runDiagnosis() {
    setRunning(true);
    setRunMsg('');
    const token = localStorage.getItem('accessToken');
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/diagnosis/evaluations/${id}/score`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/diagnosis/evaluations/${id}/detect-conflicts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      scoresApi.refresh();
      conflictsApi.refresh();
      gapsApi.refresh();
      responsesApi.refresh();
      setRunMsg('Diagnosis complete. Results refreshed.');
    } catch {
      setRunMsg('Diagnosis failed. Please try again.');
    } finally {
      setRunning(false);
    }
  }

  async function resolveConflict(conflictId: string, note: string) {
    const token = localStorage.getItem('accessToken');
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/diagnosis/conflicts/${conflictId}/resolve`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resolutionNote: note }),
    });
  }

  async function loadAllResponses() {
    if (allResponses || allResponsesLoading) {
      setShowAllResponses(true);
      return allResponses || [];
    }

    setAllResponsesLoading(true);
    setCopyMessage('');
    const token = localStorage.getItem('accessToken');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/diagnosis/evaluations/${id}/responses/full`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setAllResponses([]);
        return [];
      }
      const payload = await response.json();
      const responsesPayload = payload.responses || [];
      setAllResponses(responsesPayload);
      setShowAllResponses(true);
      return responsesPayload;
    } catch {
      setAllResponses([]);
      return [];
    } finally {
      setAllResponsesLoading(false);
    }
  }

  async function copyAllResponses() {
    let responsesToCopy = allResponses;
    if (!responsesToCopy) {
      responsesToCopy = await loadAllResponses();
    }
    if (!responsesToCopy || responsesToCopy.length === 0) {
      setCopyMessage('No responses available to copy.');
      window.setTimeout(() => setCopyMessage(''), 3000);
      return;
    }

    const formatted = responsesToCopy.map((response) => {
      const submittedAt = response.submittedAt
        ? `Submitted: ${new Date(response.submittedAt).toLocaleString()}`
        : 'Submitted: Unknown';
      const answersText = response.answers
        .map((answer: any) => `Question: ${answer.question}\nAnswer: ${answer.answer}`)
        .join('\n');
      return `Respondent: ${response.respondent}\n${submittedAt}\n${answersText}`;
    }).join('\n\n---\n\n');

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(formatted);
      setCopyMessage('All response answers copied to clipboard.');
      window.setTimeout(() => setCopyMessage(''), 3000);
    }
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'scores', label: 'Readiness Scores', icon: '📊' },
    { id: 'conflicts', label: 'Conflicts', icon: '⚠️' },
    { id: 'gaps', label: 'Gap Analysis', icon: '🔍' },
    { id: 'responses', label: 'Responses', icon: '💬' },
  ];

  // Extract key scores from the scores array
  const digitalScore = scores?.find((s: any) => s.scoreType === 'DIGITAL_READINESS' && !s.category);
  const gisScore = scores?.find((s: any) => s.scoreType === 'GIS_READINESS');
  const infraScore = scores?.find((s: any) => s.scoreType === 'INFRASTRUCTURE');
  const dimensionScores = scores?.filter((s: any) => s.scoreType === 'DIMENSION') ?? [];
  const categoryScores = scores?.filter((s: any) => s.scoreType === 'CATEGORY') ?? [];

  const unresolvedConflicts = conflicts?.filter((c: any) => !c.isResolved).length ?? 0;


  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Diagnosis Engine</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Aggregated scores, conflict detection, and gap analysis for this evaluation.
          </p>
        </div>
        <button
          onClick={runDiagnosis}
          disabled={running}
          className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
          aria-busy={running}
        >
          {running ? '⏳ Running…' : '▶ Run Diagnosis'}
        </button>
      </div>

      {runMsg && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg">
          {runMsg}
        </div>
      )}

      {pageError && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <p className="font-semibold">Unable to load diagnosis data</p>
          <p>{pageError}</p>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <p className="font-medium text-slate-900">Diagnosis summary</p>
        <p className="mt-1">Run the diagnosis to refresh scores, check conflicts, and update gap analysis for this evaluation.</p>
      </div>

      {/* Quick stats */}
      {digitalScore && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <ScoreCard
            label="Digital Readiness"
            score={Number(digitalScore.score)}
            band={digitalScore.band}
            icon="💻"
          />
          {gisScore && (
            <ScoreCard
              label="GIS Readiness"
              score={Number(gisScore.score)}
              band={gisScore.band}
              icon="🗺️"
            />
          )}
          {infraScore && (
            <ScoreCard
              label="Infrastructure"
              score={Number(infraScore.score)}
              band={infraScore.band}
              icon="🏗️"
            />
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex gap-1" aria-label="Diagnosis sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <span aria-hidden="true">{tab.icon}</span>
              {tab.label}
              {tab.id === 'conflicts' && unresolvedConflicts > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                  {unresolvedConflicts}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {activeTab === 'scores' && (
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-4">Readiness Scores</h2>
            {scoresLoading ? (
              <p className="text-slate-400 text-sm">Loading scores…</p>
            ) : !scores || scores.length === 0 ? (
              <EmptyState
                icon="📊"
                title="No scores yet"
                description="Run the diagnosis to compute readiness scores for this evaluation."
                actionLabel="Run Diagnosis"
                onAction={runDiagnosis}
              />
            ) : (
              <div className="space-y-6">
                {/* Dimension scores */}
                {dimensionScores.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-600 mb-3">Evaluation Dimensions</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {dimensionScores.map((s: any) => (
                        <ScoreCard
                          key={s.id}
                          label={s.category}
                          score={Number(s.score)}
                          band={s.band}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Category scores */}
                {categoryScores.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-600 mb-3">Digital Readiness Categories</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categoryScores.map((s: any) => (
                        <ScoreCard
                          key={s.id}
                          label={s.category}
                          score={Number(s.score)}
                          band={s.band}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'conflicts' && (
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-4">Response Conflicts</h2>
            {conflictsLoading ? (
              <p className="text-slate-400 text-sm">Loading conflicts…</p>
            ) : (
              <ConflictsPanel
                conflicts={conflicts ?? []}
                onResolve={resolveConflict}
              />
            )}
          </div>
        )}

        {activeTab === 'gaps' && (
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-4">Gap Analysis</h2>
            {gapsLoading ? (
              <p className="text-slate-400 text-sm">Loading gap analysis…</p>
            ) : (
              <GapAnalysisPanel summary={gapSummary} />
            )}
          </div>
        )}

        {activeTab === 'responses' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Response Aggregation</h2>
                <p className="mt-1 text-sm text-slate-500">
                  View aggregated response metrics and copy all submitted answers for this evaluation.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={loadAllResponses}
                  disabled={allResponsesLoading}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  {allResponsesLoading ? 'Loading…' : 'Show all responses'}
                </button>
                <button
                  type="button"
                  onClick={copyAllResponses}
                  disabled={allResponsesLoading}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                >
                  Copy all answers
                </button>
              </div>
            </div>

            {copyMessage && (
              <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
                {copyMessage}
              </div>
            )}

            {responsesLoading ? (
              <p className="text-slate-400 text-sm">Loading response summary…</p>
            ) : responses ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Submitted responses</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">{responses.totalResponses}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Total answers</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">{responses.totalAnswers}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Avg completion</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">{responses.averageCompletion}%</p>
                  </div>
                </div>

                {responses.sampleAnswers && responses.sampleAnswers.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900">Sample answers used for diagnosis</h3>
                    <div className="space-y-3">
                      {responses.sampleAnswers.map((item: any, index: number) => (
                        <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-xs text-slate-500">{item.respondent}</p>
                          <p className="text-sm font-semibold text-slate-900 mt-1">{item.question}</p>
                          <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{item.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon="💬"
                    title="No submitted responses yet"
                    description="Once responses are submitted, this tab will show actual answers that drive the diagnosis."
                  />
                )}

                {showAllResponses && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900">All submitted responses</h3>
                    {allResponsesLoading ? (
                      <p className="text-slate-400 text-sm">Loading all responses…</p>
                    ) : allResponses && allResponses.length > 0 ? (
                      <div className="space-y-4">
                        {allResponses.map((response, index) => (
                          <div key={response.id || index} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                              <div>
                                <p className="text-xs text-slate-500">Respondent</p>
                                <p className="font-semibold text-slate-900">{response.respondent}</p>
                              </div>
                              <div className="text-xs text-slate-500">
                                {response.submittedAt ? new Date(response.submittedAt).toLocaleString() : 'Submitted date unknown'}
                              </div>
                            </div>
                            <div className="mt-4 space-y-3">
                              {response.answers.map((answer: any, answerIndex: number) => (
                                <div key={answerIndex} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                  <p className="text-xs text-slate-500">{answer.question}</p>
                                  <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{answer.answer}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm">No full response details are available.</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                icon="💬"
                title="No submitted responses yet"
                description="Once responses are submitted, this tab will show actual answers that drive the diagnosis."
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
