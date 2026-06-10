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
  email: string;
  name: string;
  role: string;
  organisation: Organisation;
}

interface Evaluation {
  id: string;
  title: string;
  status: string;
  startDate?: string | null;
  createdAt: string;
  organisation: Organisation;
  _count: { forms: number };
}

interface ResponseItem {
  id: string;
  form: {
    id: string;
    title: string;
    evaluation: {
      id: string;
      title: string;
      organisation: Organisation;
    } | null;
  };
  respondent: { id: string; name: string; email: string };
  status: 'DRAFT' | 'SUBMITTED' | 'PARTIAL';
  completionPercentage: number;
  questionCount: number;
  submittedAt?: string;
  createdAt: string;
}

interface Diagnosis {
  id: string;
  evaluation: { id: string; title: string };
  status: string;
  isAiGenerated: boolean;
  sections: {
    executiveSummary: string;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    recommendations: string[];
    actionPlan: Array<{ who: string; what: string; how: string; when: string }>;
  };
  createdAt: string;
}

interface GapSummary {
  id: string;
  category: string;
  severity: string;
  evaluation: { id: string; title: string };
  recommendedAction: string;
  who: string;
  how: string;
  when: string;
}

interface PublishedAnalysis {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  recipientId: string;
  recipientName?: string;
  evaluationId?: string | null;
  summary: string;
  analysis: {
    executiveSummary?: string;
    strengths?: string[];
    weaknesses?: string[];
    opportunities?: string[];
    recommendations?: string[];
    actionPlan?: Array<{ who?: string; what?: string; how?: string; when?: string }>;
  } | null;
}

function StatCard({ label, value, icon, color = 'blue' }: { label: string; value: string | number; icon: string; color?: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    slate: 'bg-slate-50 text-slate-700',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-3">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${colorClasses[color] || colorClasses.blue}`}>
          {icon}
        </span>
      </div>
      <p className="text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Pill({ label }: { label: string }) {
  return <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{label}</span>;
}

export default function InsightPage() {
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
        setError('Unable to load insight data. Please sign in and try again.');
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
        const [user, allEvaluations, allResponses, allDiagnoses, allGaps, allPublishedAnalyses] = await Promise.all([
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
        setPublishedAnalyses(allPublishedAnalyses);
      } catch (fetchError: any) {
        setError(fetchError?.message || 'Unable to load insights at this time.');
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
    return responses.filter(
      (response) => response.form.evaluation?.organisation?.id === userOrg.id,
    );
  }, [responses, userOrg]);

  const companyDiagnoses = useMemo(() => {
    if (!userOrg) return [];
    const evaluationIds = new Set(companyEvaluations.map((evaluation) => evaluation.id));
    return diagnoses.filter((diagnosis) => evaluationIds.has(diagnosis.evaluation.id));
  }, [diagnoses, companyEvaluations, userOrg]);

  const companyGaps = useMemo(() => {
    if (!userOrg) return [];
    const evaluationIds = new Set(companyEvaluations.map((evaluation) => evaluation.id));
    return gapSummaries.filter((gap) => evaluationIds.has(gap.evaluation.id));
  }, [gapSummaries, companyEvaluations, userOrg]);

  const totalRespondents = useMemo(() => new Set(companyResponses.map((response) => response.respondent.id)).size, [companyResponses]);
  const totalResponses = companyResponses.length;
  const totalQuestions = companyResponses.reduce((sum, response) => sum + (response.questionCount || 0), 0);
  const averageCompletion = totalResponses > 0
    ? Math.round(companyResponses.reduce((sum, response) => sum + response.completionPercentage, 0) / totalResponses)
    : 0;

  const formSummaries = useMemo(() => {
    const summaryMap = new Map<string, { title: string; totalResponses: number; totalCompletion: number; uniqueRespondents: Set<string> }>();

    companyResponses.forEach((response) => {
      const existing = summaryMap.get(response.form.id) ?? {
        title: response.form.title,
        totalResponses: 0,
        totalCompletion: 0,
        uniqueRespondents: new Set<string>(),
      };
      existing.totalResponses += 1;
      existing.totalCompletion += response.completionPercentage;
      existing.uniqueRespondents.add(response.respondent.id);
      summaryMap.set(response.form.id, existing);
    });

    return Array.from(summaryMap.entries()).map(([formId, summary]) => ({
      formId,
      title: summary.title,
      averageCompletion: summary.totalResponses > 0 ? Math.round(summary.totalCompletion / summary.totalResponses) : 0,
      totalResponses: summary.totalResponses,
      respondentCount: summary.uniqueRespondents.size,
    })).sort((a, b) => a.averageCompletion - b.averageCompletion);
  }, [companyResponses]);

  const lowCompletionForms = formSummaries.filter((form) => form.averageCompletion < 70).slice(0, 4);
  const topDiagnoses = companyDiagnoses.slice(0, 3);
  const topPublishedAnalyses = publishedAnalyses.slice(0, 3);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        <p className="mt-4 text-sm text-slate-600">Loading company insights…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Company insights</h1>
            <p className="text-sm text-slate-500 mt-1">
              High-level evaluation, respondent, question and gap metrics for your organisation.
            </p>
          </div>
          {userOrg && (
            <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm">
              <span className="font-semibold">Organisation:</span> {userOrg.name}
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-4 mb-6">
            <StatCard label="Active evaluations" value={companyEvaluations.length} icon="📋" color="blue" />
            <StatCard label="Total respondents" value={totalRespondents} icon="👥" color="green" />
            <StatCard label="Total responses" value={totalResponses} icon="💬" color="yellow" />
            <StatCard label="Avg question completion" value={`${averageCompletion}%`} icon="📈" color="slate" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr] mb-6">
            <div className="space-y-6">
              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Question and response summary</h2>
                    <p className="text-sm text-slate-500">Track how many questions were answered and where completion gaps exist.</p>
                  </div>
                  <Pill label={`${totalQuestions} questions captured`} />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Average completion</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{averageCompletion}%</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Unique respondents</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{totalRespondents}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Responses</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{totalResponses}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Company evaluations</h2>
                    <p className="text-sm text-slate-500">All evaluations linked to your organisation.</p>
                  </div>
                  <span className="text-sm font-medium text-slate-500">{companyEvaluations.length} total</span>
                </div>
                {companyEvaluations.length === 0 ? (
                  <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">No evaluations have been created for your organisation yet.</div>
                ) : (
                  <div className="grid gap-4">
                    {companyEvaluations.map((evaluation) => (
                      <div key={evaluation.id} className="rounded-3xl border border-slate-200 p-4 hover:border-blue-300 transition-colors">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <Link href={`/evaluations/${evaluation.id}`} className="font-semibold text-slate-900 hover:text-blue-600 transition-colors text-sm block">
                              {evaluation.title}
                            </Link>
                            <p className="text-sm text-slate-500">Started {evaluation.startDate ? new Date(evaluation.startDate).toLocaleDateString() : new Date(evaluation.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Pill label={evaluation.status.replace('_', ' ')} />
                            <Pill label={`${evaluation._count.forms} form${evaluation._count.forms !== 1 ? 's' : ''}`} />
                            <Link
                              href={`/evaluations/${evaluation.id}/diagnosis`}
                              className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-blue-50 transition"
                            >
                              View diagnosis
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Gap summary</h2>
                <p className="text-sm text-slate-500 mb-5">
                  Identifies the most important areas where response completion and evaluation readiness are under target.
                </p>
                {lowCompletionForms.length === 0 ? (
                  <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">No major question completion gaps detected yet.</div>
                ) : (
                  <div className="space-y-4">
                    {lowCompletionForms.map((form) => (
                      <div key={form.formId} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold text-slate-900">{form.title}</p>
                            <p className="text-sm text-slate-500">{form.respondentCount} respondents</p>
                          </div>
                          <span className="text-sm font-semibold text-amber-700">{form.averageCompletion}%</span>
                        </div>
                        <div className="mt-3 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full rounded-full bg-amber-500" style={{ width: `${form.averageCompletion}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">AI-generated insights</h2>
                <p className="text-sm text-slate-500 mb-5">Latest diagnoses and recommendations generated for your organisation.</p>
                {topDiagnoses.length === 0 ? (
                  <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">No AI insights have been generated yet.</div>
                ) : (
                  <div className="space-y-4">
                    {topDiagnoses.map((diagnosis) => (
                      <div key={diagnosis.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-slate-900">{diagnosis.evaluation.title}</h3>
                            <p className="text-xs text-slate-500">Generated {new Date(diagnosis.createdAt).toLocaleDateString()}</p>
                          </div>
                          <Pill label={diagnosis.isAiGenerated ? 'AI insight' : diagnosis.status} />
                        </div>
                        <p className="mt-3 text-sm text-slate-700 line-clamp-3">{diagnosis.sections.executiveSummary || 'Summary not available.'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Published reports</h2>
                    <p className="text-sm text-slate-500">Reports and insights shared with you from the diagnosis workflow.</p>
                  </div>
                  <span className="text-sm font-medium text-slate-500">{publishedAnalyses.length} delivered</span>
                </div>
                {publishedAnalyses.length === 0 ? (
                  <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">No published insights have been shared with your account yet.</div>
                ) : (
                  <div className="space-y-4">
                    {topPublishedAnalyses.map((item) => (
                      <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 hover:border-blue-300 transition-colors">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900 text-sm">{item.summary ? item.summary.slice(0, 80) : 'Published insight'}</h3>
                            <p className="text-xs text-slate-500">Published {new Date(item.publishedAt).toLocaleDateString()} by {item.publishedBy || 'consultant'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.evaluationId ? (
                              <Link
                                href={`/evaluations/${item.evaluationId}/diagnosis`}
                                className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-blue-50 transition"
                              >
                                View evaluation report
                              </Link>
                            ) : null}
                            <Pill label={item.recipientName ? `For ${item.recipientName}` : 'Shared insight'} />
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-slate-700 line-clamp-3">
                          {item.analysis?.executiveSummary || item.summary || 'No summary available.'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Question detail overview</h2>
                <p className="text-sm text-slate-500">Drill into the forms and question completion progress for your organisation.</p>
              </div>
              <span className="text-sm text-slate-500">{formSummaries.length} tracked forms</span>
            </div>
            {formSummaries.length === 0 ? (
              <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">No question-level response data is available yet.</div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {formSummaries.map((form) => (
                  <div key={form.formId} className="rounded-3xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{form.title}</h3>
                        <p className="text-xs text-slate-500">{form.respondentCount} respondents • {form.totalResponses} submissions</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{form.averageCompletion}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full rounded-full bg-blue-600" style={{ width: `${form.averageCompletion}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
