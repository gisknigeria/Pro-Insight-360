'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { apiFetch } from '@/lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

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
    charts?: Array<{ title?: string; data?: Array<{ label?: string; value?: number }> }>;
  } | null;
}

interface GapSummary {
  id: string;
  category: string;
  severity: string;
  evaluation: { id: string; title: string };
  recommendedAction: string;
  who: string;
  when: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<string, { label: string; bg: string; text: string; ring: string; dot: string }> = {
  CRITICAL: { label: 'Critical', bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200', dot: 'bg-red-500' },
  HIGH: { label: 'High', bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200', dot: 'bg-orange-500' },
  MEDIUM: { label: 'Medium', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', dot: 'bg-amber-400' },
  LOW: { label: 'Low', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', dot: 'bg-emerald-500' },
};

function SeverityBadge({ severity }: { severity: string }) {
  const cfg = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.MEDIUM;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-slate-100 text-slate-600' },
  ACTIVE: { label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
  CLOSED: { label: 'Closed', color: 'bg-orange-100 text-orange-700' },
  ARCHIVED: { label: 'Archived', color: 'bg-slate-100 text-slate-400' },
};

function CompletionBar({ pct, color = '#2563eb' }: { pct: number; color?: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }} />
    </div>
  );
}

// ─── Chart colours ────────────────────────────────────────────────────────────

const CHART_COLORS = ['#2563eb', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#f97316'];

// ─── Analysis card ────────────────────────────────────────────────────────────

function AnalysisCard({ published, evaluation }: { published: PublishedAnalysis; evaluation?: Evaluation }) {
  const [expanded, setExpanded] = useState(false);
  const analysis = published.analysis;

  return (
    <div className={`rounded-3xl border transition-all ${expanded ? 'border-primary/30 shadow-lg' : 'border-slate-200 shadow-sm'} bg-white overflow-hidden`}>
      {/* Header */}
      <button
        type="button"
        className="flex w-full items-start gap-4 p-5 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-lg">
          📊
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="text-sm font-bold text-slate-900 truncate">
              {evaluation?.title ?? published.summary ?? 'Published analysis'}
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
              ✓ Published
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {new Date(published.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            {published.publishedBy ? ` · By ${published.publishedBy}` : ''}
          </p>
          {analysis?.executiveSummary && !expanded && (
            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{analysis.executiveSummary}</p>
          )}
        </div>
        <span className="text-slate-400 text-sm shrink-0 mt-1">{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Expanded body */}
      {expanded && analysis && (
        <div className="border-t border-slate-100 p-5 space-y-5">
          {analysis.executiveSummary && (
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Executive summary</p>
              <p className="text-sm leading-relaxed text-slate-700">{analysis.executiveSummary}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            {analysis.strengths && analysis.strengths.length > 0 && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-3">Strengths</p>
                <ul className="space-y-2">
                  {analysis.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-emerald-500 shrink-0">✓</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.weaknesses && analysis.weaknesses.length > 0 && (
              <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-red-700 mb-3">Weaknesses</p>
                <ul className="space-y-2">
                  {analysis.weaknesses.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-red-400 shrink-0">!</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.opportunities && analysis.opportunities.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3">Opportunities</p>
                <ul className="space-y-2">
                  {analysis.opportunities.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-amber-500 shrink-0">→</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Recommendations</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {analysis.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-xl bg-slate-50 border border-slate-200 p-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <p className="text-xs text-slate-700">{r}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.actionPlan && analysis.actionPlan.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Action plan</p>
              <div className="space-y-3">
                {analysis.actionPlan.map((item, i) => (
                  <div key={i} className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-900 mb-1.5">{item.what}</p>
                    <div className="grid gap-1 text-xs text-slate-600 sm:grid-cols-3">
                      <span><strong>Who:</strong> {item.who || 'TBD'}</span>
                      <span><strong>When:</strong> {item.when || 'TBD'}</span>
                      <span><strong>How:</strong> {item.how || '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.charts && analysis.charts.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Charts</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {analysis.charts.map((chart, ci) => {
                  const data = Array.isArray(chart.data)
                    ? chart.data.filter((r) => r).map((r) => ({ name: String(r.label ?? ''), value: Number(r.value ?? 0) }))
                    : [];
                  return data.length === 0 ? null : (
                    <div key={ci} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-700 mb-3">{chart.title}</p>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={45} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                            <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                              {data.map((_, di) => <Cell key={di} fill={CHART_COLORS[di % CHART_COLORS.length]} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {evaluation && (
            <div className="flex justify-end">
              <Link
                href={`/evaluations/${evaluation.id}/diagnosis`}
                className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
              >
                View full diagnosis →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InsightPage() {
  const [userOrg, setUserOrg] = useState<Organisation | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [publishedAnalyses, setPublishedAnalyses] = useState<PublishedAnalysis[]>([]);
  const [gapSummaries, setGapSummaries] = useState<GapSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'evaluations'>('overview');

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('accessToken');
      if (!token) { setError('Please sign in.'); setLoading(false); return; }

      let userId = '';
      try {
        userId = JSON.parse(atob(token.split('.')[1])).sub;
      } catch {
        setError('Session error. Please sign in again.');
        setLoading(false);
        return;
      }

      try {
        const [user, allEvals, allResponses, allPublished, allGaps] = await Promise.all([
          apiFetch<UserSummary>(`/users/${userId}`),
          apiFetch<Evaluation[]>('/evaluations'),
          apiFetch<ResponseItem[]>('/responses'),
          apiFetch<PublishedAnalysis[]>('/published-analyses'),
          apiFetch<GapSummary[]>('/gap-analysis').catch(() => [] as GapSummary[]),
        ]);

        setUserOrg(user.organisation);
        setEvaluations(allEvals);
        setResponses(allResponses);
        setPublishedAnalyses(allPublished);
        setGapSummaries(allGaps);
      } catch (err: any) {
        setError(err?.message || 'Unable to load insights.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Filtered data ─────────────────────────────────────────────────────────

  const orgEvals = useMemo(() =>
    userOrg ? evaluations.filter((e) => e.organisation?.id === userOrg.id) : [],
    [evaluations, userOrg],
  );

  const orgEvalIds = useMemo(() => new Set(orgEvals.map((e) => e.id)), [orgEvals]);

  const orgResponses = useMemo(() =>
    responses.filter((r) => r.form.evaluation?.organisation?.id === userOrg?.id),
    [responses, userOrg],
  );

  const orgGaps = useMemo(() =>
    gapSummaries.filter((g) => orgEvalIds.has(g.evaluation.id)),
    [gapSummaries, orgEvalIds],
  );

  // ── Stats ─────────────────────────────────────────────────────────────────

  const totalRespondents = useMemo(() =>
    new Set(orgResponses.map((r) => r.respondent.id)).size,
    [orgResponses],
  );
  const totalAnswers = useMemo(() =>
    orgResponses.reduce((sum, r) => sum + (r.questionCount || 0), 0),
    [orgResponses],
  );
  const avgCompletion = useMemo(() => {
    const submitted = orgResponses.filter((r) => r.status === 'SUBMITTED');
    return submitted.length > 0
      ? Math.round(submitted.reduce((s, r) => s + r.completionPercentage, 0) / submitted.length)
      : 0;
  }, [orgResponses]);

  const submittedCount = useMemo(() =>
    orgResponses.filter((r) => r.status === 'SUBMITTED').length,
    [orgResponses],
  );

  // Form-level summary for chart
  const formCompletionData = useMemo(() => {
    const map = new Map<string, { title: string; total: number; sum: number; respondents: Set<string> }>();
    orgResponses.forEach((r) => {
      const existing = map.get(r.form.id) ?? { title: r.form.title, total: 0, sum: 0, respondents: new Set() };
      existing.total++;
      existing.sum += r.completionPercentage;
      existing.respondents.add(r.respondent.id);
      map.set(r.form.id, existing);
    });
    return Array.from(map.values()).map((f) => ({
      name: f.title.length > 22 ? f.title.slice(0, 22) + '…' : f.title,
      completion: f.total > 0 ? Math.round(f.sum / f.total) : 0,
      respondents: f.respondents.size,
    }));
  }, [orgResponses]);

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-4" />
        <p className="text-sm text-slate-500">Loading your insights…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Client Admin · Insights</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Company insights</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Response stats, published analyses, and evaluation progress for your organisation.
            </p>
          </div>
          {userOrg && (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-sm font-semibold text-slate-800">{userOrg.name}</span>
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>
      ) : (
        <>
          {/* ── KPI cards ── */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Evaluations', value: orgEvals.length, icon: '📋', sub: `${orgEvals.filter((e) => e.status === 'ACTIVE').length} active`, gradient: 'from-blue-500 to-indigo-600' },
              { label: 'Respondents', value: totalRespondents, icon: '👥', sub: `${submittedCount} submissions`, gradient: 'from-emerald-400 to-green-600' },
              { label: 'Total answers', value: totalAnswers, icon: '✏️', sub: 'across all forms', gradient: 'from-amber-400 to-orange-500' },
              { label: 'Published reports', value: publishedAnalyses.length, icon: '📊', sub: 'from super admin', gradient: 'from-violet-500 to-purple-600' },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${kpi.gradient} text-lg shadow-md`}>
                  {kpi.icon}
                </div>
                <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">{kpi.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Tabs ── */}
          <div className="mb-6 border-b border-slate-200">
            <nav className="flex gap-1">
              {([
                { id: 'overview', label: 'Overview', icon: '📈' },
                { id: 'reports', label: 'Published reports', icon: '📋', badge: publishedAnalyses.length },
                { id: 'evaluations', label: 'Evaluations', icon: '🏢', badge: orgEvals.length },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                  {'badge' in tab && tab.badge > 0 && (
                    <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full px-1 text-xs font-bold ${
                      activeTab === tab.id ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* ── Overview tab ── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Response summary + chart */}
              <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-base font-bold text-slate-900 mb-5">Response summary</h2>
                  <div className="grid gap-4 sm:grid-cols-3 mb-6">
                    {[
                      { label: 'Submitted responses', value: submittedCount, color: 'bg-emerald-50 text-emerald-700' },
                      { label: 'Avg completion', value: `${avgCompletion}%`, color: 'bg-amber-50 text-amber-700' },
                      { label: 'Unique respondents', value: totalRespondents, color: 'bg-blue-50 text-blue-700' },
                    ].map((s) => (
                      <div key={s.label} className={`rounded-2xl p-4 ${s.color}`}>
                        <p className="text-2xl font-bold">{s.value}</p>
                        <p className="text-xs font-medium mt-1 opacity-80">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Completion bars per form */}
                  {formCompletionData.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Form completion rates</p>
                      {formCompletionData.map((f, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-700 font-medium truncate max-w-[70%]">{f.name}</span>
                            <span className="text-slate-500">{f.respondents} resp · {f.completion}%</span>
                          </div>
                          <CompletionBar pct={f.completion} color={f.completion < 50 ? '#f59e0b' : f.completion < 75 ? '#3b82f6' : '#10b981'} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No response data yet.</p>
                  )}
                </div>

                {/* Completion chart */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-base font-bold text-slate-900 mb-5">Completion by form</h2>
                  {formCompletionData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={formCompletionData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={55} />
                          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} domain={[0, 100]} />
                          <Tooltip
                            formatter={(v) => [`${v}%`, 'Completion']}
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                          />
                          <Bar dataKey="completion" radius={[8, 8, 0, 0]}>
                            {formCompletionData.map((entry, i) => (
                              <Cell key={i} fill={entry.completion < 50 ? '#f59e0b' : entry.completion < 75 ? '#3b82f6' : '#10b981'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-400">
                      No form data available yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Gap summary */}
              {orgGaps.length > 0 && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Identified gaps</h2>
                      <p className="text-sm text-slate-500">Areas flagged for improvement in your evaluations.</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 ring-1 ring-red-200">
                      {orgGaps.length} gaps
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {orgGaps.slice(0, 6).map((gap) => (
                      <div key={gap.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="text-sm font-semibold text-slate-900">{gap.category}</p>
                          <SeverityBadge severity={gap.severity} />
                        </div>
                        <p className="text-xs text-slate-600 mb-1">{gap.recommendedAction}</p>
                        <p className="text-xs text-slate-400">Owner: {gap.who} · {gap.when}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Latest published report preview */}
              {publishedAnalyses.length > 0 && (
                <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-base">📊</span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Latest published analysis</p>
                      <p className="text-xs text-slate-500">
                        Received {new Date(publishedAnalyses[0].publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('reports')}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-white px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/5 transition-colors"
                    >
                      See all reports →
                    </button>
                  </div>
                  {publishedAnalyses[0].analysis?.executiveSummary && (
                    <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">
                      {publishedAnalyses[0].analysis.executiveSummary}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Reports tab ── */}
          {activeTab === 'reports' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Published analyses</h2>
                  <p className="text-sm text-slate-500">Reports published to your account by the super admin.</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {publishedAnalyses.length} report{publishedAnalyses.length !== 1 ? 's' : ''}
                </span>
              </div>

              {publishedAnalyses.length === 0 ? (
                <EmptyState
                  icon="📊"
                  title="No published reports yet"
                  description="When the super admin publishes an analysis to your account, it will appear here."
                />
              ) : (
                publishedAnalyses.map((pa) => (
                  <AnalysisCard
                    key={pa.id}
                    published={pa}
                    evaluation={orgEvals.find((e) => e.id === pa.evaluationId)}
                  />
                ))
              )}
            </div>
          )}

          {/* ── Evaluations tab ── */}
          {activeTab === 'evaluations' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Your evaluations</h2>
                  <p className="text-sm text-slate-500">All evaluations linked to {userOrg?.name ?? 'your organisation'}.</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {orgEvals.length} evaluation{orgEvals.length !== 1 ? 's' : ''}
                </span>
              </div>

              {orgEvals.length === 0 ? (
                <EmptyState
                  icon="📋"
                  title="No evaluations yet"
                  description="Once an evaluation is created for your organisation, it will appear here."
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {orgEvals.map((ev) => {
                    const statusCfg = STATUS_CONFIG[ev.status] ?? STATUS_CONFIG.DRAFT;
                    const evResponses = orgResponses.filter((r) => r.form.evaluation?.id === ev.id);
                    const evSubmitted = evResponses.filter((r) => r.status === 'SUBMITTED').length;
                    const evRespondents = new Set(evResponses.map((r) => r.respondent.id)).size;

                    return (
                      <div key={ev.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/evaluations/${ev.id}`}
                              className="text-sm font-bold text-slate-900 hover:text-primary transition-colors truncate block"
                            >
                              {ev.title}
                            </Link>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {ev.startDate
                                ? `Started ${new Date(ev.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                : `Created ${new Date(ev.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
                              }
                            </p>
                          </div>
                          <span className={`shrink-0 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusCfg.color}`}>
                            {statusCfg.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {[
                            { label: 'Forms', value: ev._count.forms },
                            { label: 'Respondents', value: evRespondents },
                            { label: 'Submitted', value: evSubmitted },
                          ].map((stat) => (
                            <div key={stat.label} className="rounded-2xl bg-slate-50 p-3 text-center">
                              <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                              <p className="text-xs text-slate-500">{stat.label}</p>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Link
                            href={`/evaluations/${ev.id}/diagnosis`}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
                          >
                            🔍 View diagnosis
                          </Link>
                          <Link
                            href={`/evaluations/${ev.id}`}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-3 py-2 text-xs font-bold text-white shadow-sm hover:shadow-md transition-all"
                          >
                            View →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
