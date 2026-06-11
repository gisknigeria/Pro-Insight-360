'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RadarChart from '@/components/charts/RadarChart';
import OrgChart from '@/components/organogram/OrgChart';
import { EmptyState } from '@/components/ui/empty-state';
import { isClientAdmin } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { evaluationApiEndpoints } from '@/lib/apiEndpoints';
import { useEvaluationDiagnosis } from '@/lib/useEvaluationDiagnosis';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Tab = 'analysis' | 'gaps' | 'responses';

export default function EvaluationDiagnosisPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>('analysis');
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState('');
  const [allResponses, setAllResponses] = useState<any[] | null>(null);
  const [allResponsesLoading, setAllResponsesLoading] = useState(false);
  const [showAllResponses, setShowAllResponses] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.replace('/login');
      return;
    }

    if (isClientAdmin()) {
      router.replace('/dashboard');
      return;
    }

    setHasAccess(true);
  }, [router]);

  const shouldFetch = hasAccess === true;
  const { responsesApi, diagnosisApi } = useEvaluationDiagnosis(id, shouldFetch);

  const diagnosis = diagnosisApi.data?.diagnosis ?? null;
  const chartData = Array.isArray(diagnosis?.sections?.charts) ? diagnosis.sections.charts : [];
  const orgRows = useMemo(() => {
    const organogram = diagnosis?.sections?.organogram;
    if (!organogram || !Array.isArray(organogram.nodes) || !Array.isArray(organogram.links)) {
      return [];
    }

    const map = new Map<string, { name: string; title: string; reportsTo: string }>();
    organogram.nodes.forEach((node: any) => {
      const name = String(node.label || node.id || 'Unknown');
      map.set(name, {
        name,
        title: String(node.group || 'Team'),
        reportsTo: '',
      });
    });

    organogram.links.forEach((link: any) => {
      const sourceName = String(link.source || link.sourceLabel || link.sourceId || '');
      const targetName = String(link.target || link.targetLabel || link.targetId || '');
      const source = map.get(sourceName);
      if (source) {
        source.reportsTo = targetName;
      }
    });

    return Array.from(map.values());
  }, [diagnosis?.sections?.organogram]);

  const readinessRadarData = useMemo(() => {
    if (!chartData || chartData.length === 0) return null;
    const readinessChart = chartData.find((chart: any) => /readiness/i.test(String(chart.title || '')));
    if (readinessChart && Array.isArray(readinessChart.data)) {
      return readinessChart.data
        .filter((item: any) => item != null && (typeof item.value === 'number' || !Number.isNaN(Number(item.value))))
        .map((item: any) => ({
          category: String(item.label || item.name || 'Metric'),
          score: Number(item.value ?? item.count ?? 0),
          fullMark: 100,
        }));
    }

    if (!diagnosis) return null;
    const counts = {
      strengths: Array.isArray(diagnosis.sections?.strengths) ? diagnosis.sections.strengths.length : 0,
      weaknesses: Array.isArray(diagnosis.sections?.weaknesses) ? diagnosis.sections.weaknesses.length : 0,
      opportunities: Array.isArray(diagnosis.sections?.opportunities) ? diagnosis.sections.opportunities.length : 0,
      recommendations: Array.isArray(diagnosis.sections?.recommendations) ? diagnosis.sections.recommendations.length : 0,
      actionPlan: Array.isArray(diagnosis.sections?.actionPlan) ? diagnosis.sections.actionPlan.length : 0,
    };
    return [
      { category: 'Strengths', score: Math.min(100, counts.strengths * 15 + 20), fullMark: 100 },
      { category: 'Weaknesses', score: Math.max(24, 100 - counts.weaknesses * 15), fullMark: 100 },
      { category: 'Opportunities', score: Math.min(100, counts.opportunities * 15 + 20), fullMark: 100 },
      { category: 'Recommendations', score: Math.min(100, counts.recommendations * 12 + 20), fullMark: 100 },
      { category: 'Action Plan', score: Math.min(100, counts.actionPlan * 15 + 20), fullMark: 100 },
    ];
  }, [chartData, diagnosis]);

  if (hasAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 text-sm">Checking access…</p>
      </div>
    );
  }

  const responses = responsesApi.data;
  const responsesLoading = responsesApi.loading;
  const pageError = responsesApi.error || diagnosisApi.error;

  async function runDiagnosis() {
    setRunning(true);
    setRunMsg('');

    try {
      await apiFetch<void>(evaluationApiEndpoints.score(id), {
        method: 'POST',
      });
      responsesApi.refresh();
      diagnosisApi.refresh();
      setRunMsg('Diagnosis complete. Results refreshed.');
    } catch {
      setRunMsg('Diagnosis failed. Please try again.');
    } finally {
      setRunning(false);
    }
  }

  async function loadAllResponses() {
    if (allResponses || allResponsesLoading) {
      setShowAllResponses(true);
      return allResponses || [];
    }

    setAllResponsesLoading(true);
    setCopyMessage('');

    try {
      const payload = await apiFetch<{ responses?: any[] }>(evaluationApiEndpoints.responsesFull(id));
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
    { id: 'analysis', label: 'Analysis', icon: '🧠' },
    { id: 'responses', label: 'Responses', icon: '💬' },
  ];


  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Diagnosis Engine</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Saved analysis, gap review, and response insights for this evaluation.
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
        <p className="mt-1">Run the diagnosis to refresh the latest gap analysis and saved evaluation diagnosis.</p>
      </div>

    

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
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {activeTab === 'analysis' && (
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-4">Saved Analysis</h2>
            {!diagnosis ? (
              <EmptyState
                icon="🧠"
                title="No saved analysis yet"
                description="Publish or generate a diagnosis to show the saved analysis content here."
                actionLabel="Run Diagnosis"
                onAction={runDiagnosis}
              />
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">Executive summary</p>
                    <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{diagnosis.sections?.executiveSummary || 'No summary available.'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">Diagnosis status</p>
                    <p className="mt-2 text-sm text-slate-700">{diagnosis.status}</p>
                    <p className="mt-2 text-xs text-slate-500">Updated {diagnosis.generatedAt ? new Date(diagnosis.generatedAt).toLocaleString() : 'Unknown'}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">Strengths</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      {Array.isArray(diagnosis.sections?.strengths) && diagnosis.sections.strengths.length > 0 ? (
                        diagnosis.sections.strengths.map((item: string, idx: number) => (
                          <li key={idx} className="flex gap-2"><span className="text-green-600">✓</span>{item}</li>
                        ))
                      ) : (
                        <li className="text-slate-500">No strengths provided.</li>
                      )}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">Weaknesses</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      {Array.isArray(diagnosis.sections?.weaknesses) && diagnosis.sections.weaknesses.length > 0 ? (
                        diagnosis.sections.weaknesses.map((item: string, idx: number) => (
                          <li key={idx} className="flex gap-2"><span className="text-orange-600">⚠️</span>{item}</li>
                        ))
                      ) : (
                        <li className="text-slate-500">No weaknesses provided.</li>
                      )}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">Opportunities</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      {Array.isArray(diagnosis.sections?.opportunities) && diagnosis.sections.opportunities.length > 0 ? (
                        diagnosis.sections.opportunities.map((item: string, idx: number) => (
                          <li key={idx} className="flex gap-2"><span className="text-blue-600">→</span>{item}</li>
                        ))
                      ) : (
                        <li className="text-slate-500">No opportunities provided.</li>
                      )}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">Recommendations</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      {Array.isArray(diagnosis.sections?.recommendations) && diagnosis.sections.recommendations.length > 0 ? (
                        diagnosis.sections.recommendations.map((item: string, idx: number) => (
                          <li key={idx} className="flex gap-2"><span className="text-slate-500">•</span>{item}</li>
                        ))
                      ) : (
                        <li className="text-slate-500">No recommendations provided.</li>
                      )}
                    </ul>
                  </div>
                </div>

                {Array.isArray(diagnosis.sections?.actionPlan) && diagnosis.sections.actionPlan.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Action plan</h3>
                    <div className="space-y-4">
                      {diagnosis.sections.actionPlan.map((item: any, idx: number) => (
                        <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-900">{item.what}</p>
                          <p className="text-sm text-slate-600 mt-2">Who: {item.who || 'N/A'} • When: {item.when || 'TBD'}</p>
                          <p className="text-sm text-slate-700 mt-2">How: {item.how || 'No details provided.'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {readinessRadarData && readinessRadarData.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <RadarChart data={readinessRadarData} title="Readiness overview" height={320} showLegend={false} />
                  </div>
                )}

                {chartData.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">Supporting charts</h3>
                      <p className="text-sm text-slate-600">Visual interpretations saved with the diagnosis.</p>
                    </div>
                    <div className="space-y-4">
                      {chartData.map((chart: any, chartIndex: number) => (
                        <div key={chartIndex} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-sm font-semibold text-slate-900 mb-3">{chart.title || 'Chart'}</p>
                          <div className="h-60">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={Array.isArray(chart.data) ? chart.data.map((row: any) => ({ name: String(row.label || row.name || ''), value: Number(row.value ?? row.count ?? 0) })) : []}>
                                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={50} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                                <Tooltip cursor={{ fill: 'rgba(148,163,184,0.1)' }} />
                                <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {orgRows.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 overflow-x-auto">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">Organogram</h3>
                      <p className="text-sm text-slate-600">Saved organisational structure from the diagnosis report.</p>
                    </div>
                    <div className="min-w-[1000px]">
                      <OrgChart rows={orgRows as any} />
                    </div>
                  </div>
                )}
              </div>
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
