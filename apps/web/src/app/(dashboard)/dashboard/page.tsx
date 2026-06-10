'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import OrgChart from '@/components/organogram/OrgChart';
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

interface GapSummary {
  id: string;
  evaluation: { id: string };
}

interface PublishedAnalysis {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  recipientName?: string;
  summary: string;
  evaluationId?: string | null;
  analysis?: {
    executiveSummary?: string;
    strengths?: string[];
    weaknesses?: string[];
    opportunities?: string[];
    recommendations?: string[];
    actionPlan?: Array<{ who?: string; what?: string; how?: string; when?: string }>;
    charts?: Array<{ title?: string; data?: Array<{ label?: string; value?: number }> }>;
    organogram?: { nodes?: Array<{ id?: string; label?: string; group?: string }>; links?: Array<{ source?: string; target?: string; relation?: string }> };
  };
}

function StatCard({ label, value, icon, color = 'blue' }: { label: string; value: string | number; icon: string; color?: 'blue' | 'green' | 'yellow' | 'slate' }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    yellow: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-3">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${colorClasses[color]}`}>{icon}</span>
      </div>
      <p className="text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Pill({ label }: { label: string }) {
  return <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{label}</span>;
}

function buildOrgRows(published: PublishedAnalysis | null) {
  if (!published?.analysis?.organogram?.nodes) return [];
  const nodes = published.analysis.organogram.nodes;
  const links = published.analysis.organogram.links || [];
  const rows: Array<{ name: string; title: string; reportsTo: string }> = [];

  nodes.forEach((node) => {
    rows.push({ name: node.label || node.id || 'Unknown', title: node.group || 'Team member', reportsTo: '' });
  });

  links.forEach((link) => {
    const source = rows.find((row) => row.name === link.source);
    if (source && link.target) {
      source.reportsTo = link.target;
    }
  });

  return rows;
}

function LatestPublishedAnalysis({ published, evaluation }: { published: PublishedAnalysis; evaluation?: Evaluation }) {
  const analysis = published.analysis;
  const orgRows = buildOrgRows(published);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">{published.summary || 'Latest published evaluation'}</p>
            <p className="text-xs text-slate-500">
              Published {new Date(published.publishedAt).toLocaleDateString()} by {published.publishedBy || 'Superadmin'}
            </p>
            {evaluation ? (
              <Link href={`/evaluations/${evaluation.id}/diagnosis`} className="text-xs text-blue-600 hover:underline">
                Open evaluation diagnosis
              </Link>
            ) : null}
          </div>
          <Pill label={published.recipientName ? `For ${published.recipientName}` : 'Shared insight'} />
        </div>
      </div>

      {analysis?.executiveSummary ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Executive summary</h3>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{analysis.executiveSummary}</p>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {analysis?.strengths ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Top strengths</h4>
            <ul className="space-y-2 text-sm text-slate-700">
              {analysis.strengths.map((item, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-green-600">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {analysis?.weaknesses ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Key weaknesses</h4>
            <ul className="space-y-2 text-sm text-slate-700">
              {analysis.weaknesses.map((item, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-orange-600">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {analysis?.opportunities ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Primary opportunities</h4>
          <ul className="space-y-2 text-sm text-slate-700">
            {analysis.opportunities.map((item, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-blue-600">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {analysis?.recommendations ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Recommendations</h4>
          <ul className="space-y-2 text-sm text-slate-700">
            {analysis.recommendations.map((item, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-slate-600">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {analysis?.actionPlan?.length ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Action plan</h4>
          <div className="space-y-3 text-sm text-slate-700">
            {analysis.actionPlan.map((item, idx) => (
              <div key={idx} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{item.what || 'Action item'}</p>
                <p className="text-slate-600 mt-1">Who: {item.who || 'TBD'} • When: {item.when || 'TBD'}</p>
                <p className="text-slate-700 mt-2">{item.how}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {analysis?.charts?.length ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <h4 className="text-sm font-semibold text-slate-900 mb-4">Supporting charts</h4>
          <div className="grid gap-4">
            {analysis.charts.map((chart, chartIndex) => (
              <div key={chartIndex} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900 mb-3">{chart.title || `Chart ${chartIndex + 1}`}</p>
                {chart.data?.map((row, rowIndex) => {
                  const value = Math.min(100, Math.max(0, Number(row.value || 0)));
                  return (
                    <div key={rowIndex} className="mb-3">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>{row.label}</span>
                        <span>{value}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-blue-600" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {orgRows.length > 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h4 className="text-sm font-semibold text-slate-900">Organogram</h4>
            <span className="text-xs text-slate-500">Leadership structure</span>
          </div>
          <div className="overflow-auto rounded-3xl border border-slate-200 bg-slate-50 p-3">
            <OrgChart rows={orgRows} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function DashboardPage() {
  const [userOrg, setUserOrg] = useState<Organisation | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [gapSummaries, setGapSummaries] = useState<GapSummary[]>([]);
  const [publishedAnalyses, setPublishedAnalyses] = useState<PublishedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboardData() {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Please sign in to view dashboard data.');
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
        const [user, allEvaluations, allResponses, allGaps, allPublishedAnalyses] = await Promise.all([
          apiFetch<UserSummary>(`/users/${userId}`),
          apiFetch<Evaluation[]>('/evaluations'),
          apiFetch<ResponseItem[]>('/responses'),
          apiFetch<GapSummary[]>('/gap-analysis'),
          apiFetch<PublishedAnalysis[]>('/published-analyses'),
        ]);

        setUserOrg(user.organisation);
        setEvaluations(allEvaluations);
        setResponses(allResponses);
        setGapSummaries(allGaps);
        setPublishedAnalyses(allPublishedAnalyses);
      } catch (fetchError: any) {
        setError(fetchError?.message || 'Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const companyEvaluations = useMemo(() => {
    if (!userOrg) return [];
    return evaluations.filter((evaluation) => evaluation.organisation?.id === userOrg.id);
  }, [evaluations, userOrg]);

  const companyResponses = useMemo(() => {
    if (!userOrg) return [];
    return responses.filter((response) => response.form.evaluation?.organisation?.id === userOrg.id);
  }, [responses, userOrg]);

  const companyGaps = useMemo(() => {
    if (!userOrg) return [];
    const evaluationIds = new Set(companyEvaluations.map((evaluation) => evaluation.id));
    return gapSummaries.filter((gap) => evaluationIds.has(gap.evaluation.id));
  }, [gapSummaries, companyEvaluations]);

  const totalQuestions = companyResponses.reduce((sum, response) => sum + (response.questionCount || 0), 0);
  const totalRespondents = useMemo(() => new Set(companyResponses.map((response) => response.respondent.id)).size, [companyResponses]);
  const activeEvaluations = companyEvaluations.filter((evaluation) => evaluation.status !== 'ARCHIVED');
  const latestPublished = publishedAnalyses[0] || null;
  const latestPublishedEvaluation = latestPublished ? companyEvaluations.find((evaluation) => evaluation.id === latestPublished.evaluationId) : undefined;

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        <p className="mt-4 text-sm text-slate-600">Loading dashboard data…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Client Admin Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Live evaluation metrics and your latest published AI insight.</p>
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
            <StatCard label="Total evaluations" value={companyEvaluations.length} icon="📋" color="blue" />
            <StatCard label="Total questions asked" value={totalQuestions} icon="❓" color="green" />
            <StatCard label="Total respondents" value={totalRespondents} icon="👥" color="yellow" />
            <StatCard label="Gaps identified" value={companyGaps.length} icon="🔍" color="slate" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] mb-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Active evaluations</h2>
                  <p className="text-sm text-slate-500">Click into each evaluation for the full diagnosis and form progress.</p>
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
                          <p className="text-sm text-slate-500">Started {evaluation.startDate ? new Date(evaluation.startDate).toLocaleDateString() : new Date(evaluation.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">{evaluation.status.replace('_', ' ')}</div>
                      </div>
                      <div className="mt-3 text-sm text-slate-600">{evaluation._count.forms} form{evaluation._count.forms !== 1 ? 's' : ''} linked</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Latest published insight</h2>
                  <p className="text-sm text-slate-500">Your most recent AI diagnosis report delivered by the superadmin.</p>
                </div>
                <span className="text-sm font-medium text-slate-500">{publishedAnalyses.length} reports</span>
              </div>
              {latestPublished ? (
                <LatestPublishedAnalysis published={latestPublished} evaluation={latestPublishedEvaluation} />
              ) : (
                <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">No published AI insights have been shared with your account yet.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
