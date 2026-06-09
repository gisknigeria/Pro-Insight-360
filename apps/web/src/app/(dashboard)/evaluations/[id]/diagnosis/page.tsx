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
    fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError('Failed to load data.'))
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

  const scoresApi = useApi<any[]>(`/diagnosis/evaluations/${id}/scores`);
  const conflictsApi = useApi<any[]>(`/diagnosis/evaluations/${id}/conflicts`);
  const gapsApi = useApi<any>(`/diagnosis/evaluations/${id}/gaps`);

  const scores = scoresApi.data;
  const conflicts = conflictsApi.data;
  const gaps = gapsApi.data as any[] | null;
  const scoresLoading = scoresApi.loading;
  const conflictsLoading = conflictsApi.loading;
  const gapsLoading = gapsApi.loading;

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
            <h2 className="text-base font-semibold text-slate-900 mb-4">Response Aggregation</h2>
            <EmptyState
              icon="💬"
              title="Response aggregation"
              description="Detailed response charts are not yet available here. They will be added in a future dashboard release."
            />
          </div>
        )}
      </div>
    </div>
  );
}
