'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { apiFetch } from '@/lib/api';

interface Organisation {
  id: string;
  name: string;
}

interface UserSummary {
  id: string;
  organisation: Organisation;
}

interface Evaluation {
  id: string;
  title: string;
  status: string;
  startDate: string | null;
  createdAt: string;
  organisation: Organisation;
  _count: { forms: number };
}

interface ResponseItem {
  id: string;
  questionCount: number;
  completionPercentage: number;
  respondent: { id: string };
  form: { id: string; title: string; evaluation: { id: string; organisation: Organisation } | null };
}

interface Diagnosis {
  id: string;
  evaluation: { id: string; title: string };
}

interface GapSummary {
  id: string;
  evaluation: { id: string };
}

interface PublishedAnalysis {
  id: string;
  publishedAt: string;
  summary: string;
  evaluationId?: string | null;
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-3">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">{icon}</span>
      </div>
      <p className="text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [userOrg, setUserOrg] = useState<Organisation | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [gapSummaries, setGapSummaries] = useState<GapSummary[]>([]);
  const [publishedAnalyses, setPublishedAnalyses] = useState<PublishedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Unable to load dashboard metrics. Please sign in again.');
        setLoading(false);
        return;
      }

      let userId = '';
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
      } catch {
        setError('Unable to read current user session. Please sign in again.');
        setLoading(false);
        return;
      }

      try {
        const [user, allEvaluations, allResponses, allDiagnoses, allGaps, allPublished] = await Promise.all([
          apiFetch<UserSummary>(`/users/${userId}`),
          apiFetch<Evaluation[]>('/evaluations'),
          apiFetch<ResponseItem[]>('/responses'),
          apiFetch<Diagnosis[]>('/diagnoses'),
          apiFetch<GapSummary[]>('/gap-analysis'),
          apiFetch<PublishedAnalysis[]>('/published-analyses'),
        ]);

        setUserOrg(user.organisation);
        setEvaluations(allEvaluations);
        setResponses(allResponses);
        setDiagnoses(allDiagnoses);
        setGapSummaries(allGaps);
        setPublishedAnalyses(allPublished);
      } catch (fetchError: any) {
        setError(fetchError?.message || 'Unable to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const companyEvaluations = useMemo(() => {
    if (!userOrg) return [];
    return evaluations.filter((evaluation) => evaluation.organisation?.id === userOrg.id);
  }, [evaluations, userOrg]);

  const companyResponses = useMemo(() => {
    if (!userOrg) return [];
    return responses.filter((response) => response.form.evaluation?.organisation?.id === userOrg.id);
  }, [responses, userOrg]);

  const companyDiagnoses = useMemo(() => {
    if (!userOrg) return [];
    const evaluationIds = new Set(companyEvaluations.map((evaluation) => evaluation.id));
    return diagnoses.filter((diagnosis) => evaluationIds.has(diagnosis.evaluation.id));
  }, [diagnoses, companyEvaluations]);

  const companyGaps = useMemo(() => {
    if (!userOrg) return [];
    const evaluationIds = new Set(companyEvaluations.map((evaluation) => evaluation.id));
    return gapSummaries.filter((gap) => evaluationIds.has(gap.evaluation.id));
  }, [gapSummaries, companyEvaluations]);

  const activeEvaluations = companyEvaluations.filter((evaluation) => evaluation.status !== 'ARCHIVED');
  const latestPublished = publishedAnalyses[0] || null;

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        <p className="mt-4 text-sm text-slate-600">Loading dashboard metrics…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-1 text-sm">Active evaluations, response coverage, gap detection, and latest published insights.</p>
          </div>
          {userOrg && (
            <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm">
              <span className="font-semibold">Organisation:</span> {userOrg.name}
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 mb-6">{error}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
            <StatCard label="Active Evaluations" value={activeEvaluations.length} icon="📋" />
            <StatCard label="Responses Collected" value={companyResponses.length} icon="💬" />
            <StatCard label="Gaps Identified" value={companyGaps.length} icon="🔍" />
            <StatCard label="Reports Generated" value={publishedAnalyses.length} icon="📄" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr] mb-6">
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Active evaluations</h2>
                  <p className="text-sm text-slate-500">Click any evaluation to open the detail page.</p>
                </div>
                <span className="text-sm font-medium text-slate-500">{activeEvaluations.length} active</span>
              </div>
              {activeEvaluations.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">No active evaluations are available yet.</div>
              ) : (
                <div className="space-y-4">
                  {activeEvaluations.map((evaluation) => (
                    <Link
                      key={evaluation.id}
                      href={`/evaluations/${evaluation.id}`}
                      className="block rounded-3xl border border-slate-200 p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-slate-900">{evaluation.title}</h3>
                          <p className="text-sm text-slate-500">
                            Started {evaluation.startDate ? new Date(evaluation.startDate).toLocaleDateString() : new Date(evaluation.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">{evaluation.status.replace('_', ' ')}</div>
                      </div>
                      <div className="mt-3 text-sm text-slate-600">{evaluation._count.forms} form{evaluation._count.forms !== 1 ? 's' : ''} linked</div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Latest published insight</h2>
              {latestPublished ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{latestPublished.summary || 'Published insight'}</p>
                      <p className="text-xs text-slate-500">Published {new Date(latestPublished.publishedAt).toLocaleDateString()}</p>
                    </div>
                    {latestPublished.evaluationId ? (
                      <Link
                        href={`/evaluations/${latestPublished.evaluationId}/diagnosis`}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-blue-50 transition"
                      >
                        View report
                      </Link>
                    ) : null}
                  </div>
                  <p className="text-sm text-slate-700 line-clamp-4">{latestPublished.summary || 'No summary available.'}</p>
                </div>
              ) : (
                <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">No published reports have been shared to your account yet.</div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
