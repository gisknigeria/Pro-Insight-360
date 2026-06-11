'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { apiFetch } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, RadarChart as RechartRadar, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Organisation { id: string; name: string; }

interface UserSummary {
  id: string; email: string; name: string; role: string; organisation: Organisation;
}

interface Evaluation {
  id: string; title: string; status: string;
  startDate?: string | null; createdAt: string;
  organisation: Organisation; _count: { forms: number };
}

interface EvalMetrics {
  totalResponses: number; totalAnswers: number;
  averageCompletion: number; questionCount: number;
}

interface PublishedAnalysis {
  id: string; publishedAt: string; publishedBy?: string;
  recipientId: string; recipientName?: string;
  evaluationId?: string | null; summary: string;
  analysis: {
    executiveSummary?: string;
    strengths?: string[]; weaknesses?: string[];
    opportunities?: string[]; recommendations?: string[];
    gaps?: string[];
    actionPlan?: Array<{ who?: string; what?: string; how?: string; when?: string }>;
    charts?: Array<{ title?: string; data?: Array<{ label?: string; value?: number }> }>;
  } | null;
}

interface GapItem {
  id: string; category: string; severity: string;
  evaluation: { id: string; title: string };
  recommendedAction: string; who: string; when: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHART_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f97316'];

const SEV_CFG: Record<string, { label: string; bg: string; text: string; dot: string; bar: string }> = {
  CRITICAL: { label: 'Critical', bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500',    bar: '#ef4444' },
  HIGH:     { label: 'High',     bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', bar: '#f97316' },
  MEDIUM:   { label: 'Medium',   bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-400',  bar: '#f59e0b' },
  LOW:      { label: 'Low',      bg: 'bg-emerald-50',text: 'text-emerald-700',dot: 'bg-emerald-500',bar: '#10b981' },
};

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT:    { label: 'Draft',    bg: 'bg-slate-100',  text: 'text-slate-600'   },
  ACTIVE:   { label: 'Active',   bg: 'bg-emerald-100',text: 'text-emerald-700' },
  CLOSED:   { label: 'Closed',   bg: 'bg-orange-100', text: 'text-orange-700'  },
  ARCHIVED: { label: 'Archived', bg: 'bg-slate-100',  text: 'text-slate-400'   },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const cfg = SEV_CFG[severity] ?? SEV_CFG.MEDIUM;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function CompletionBar({ pct }: { pct: number }) {
  const color = pct >= 75 ? '#10b981' : pct >= 50 ? '#2563eb' : '#f59e0b';
  return (
    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }} />
    </div>
  );
}

// ─── Analysis card ────────────────────────────────────────────────────────────

function AnalysisCard({ published, evaluation }: { published: PublishedAnalysis; evaluation?: Evaluation }) {
  const [expanded, setExpanded] = useState(false);
  const a = published.analysis;

  return (
    <div className={`rounded-3xl border transition-all overflow-hidden bg-white ${expanded ? 'border-blue-300 shadow-lg' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}>
      <button type="button" className="flex w-full items-start gap-4 p-5 text-left" onClick={() => setExpanded(v => !v)}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-lg">📊</div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="text-sm font-bold text-slate-900 truncate">{evaluation?.title ?? published.summary ?? 'Published analysis'}</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">✓ Published</span>
          </div>
          <p className="text-xs text-slate-500">
            {new Date(published.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            {published.publishedBy ? ` · ${published.publishedBy}` : ''}
          </p>
          {a?.executiveSummary && !expanded && (
            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{a.executiveSummary}</p>
          )}
        </div>
        <span className="text-slate-400 text-sm shrink-0 mt-1">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && a && (
        <div className="border-t border-slate-100 p-5 space-y-5">
          {a.executiveSummary && (
            <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Executive summary</p>
              <p className="text-sm leading-relaxed text-slate-700">{a.executiveSummary}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            {a.strengths && a.strengths.length > 0 && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-3">Strengths</p>
                <ul className="space-y-2">{a.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700"><span className="text-emerald-500 shrink-0 mt-0.5">✓</span>{s}</li>
                ))}</ul>
              </div>
            )}
            {a.weaknesses && a.weaknesses.length > 0 && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-red-700 mb-3">Weaknesses</p>
                <ul className="space-y-2">{a.weaknesses.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700"><span className="text-red-400 shrink-0 mt-0.5">!</span>{s}</li>
                ))}</ul>
              </div>
            )}
            {a.opportunities && a.opportunities.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3">Opportunities</p>
                <ul className="space-y-2">{a.opportunities.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700"><span className="text-amber-500 shrink-0 mt-0.5">→</span>{s}</li>
                ))}</ul>
              </div>
            )}
          </div>

          {/* Gaps from AI */}
          {a.gaps && a.gaps.length > 0 && (
            <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-red-700 mb-3">Identified gaps</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {a.gaps.map((gap, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-xl bg-white border border-red-100 p-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">{i + 1}</span>
                    <p className="text-xs text-slate-700">{gap}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {a.recommendations && a.recommendations.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Recommendations</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {a.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-xl bg-white border border-slate-200 p-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{i + 1}</span>
                    <p className="text-xs text-slate-700">{r}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {a.actionPlan && a.actionPlan.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Action plan</p>
              <div className="space-y-3">
                {a.actionPlan.map((item, i) => (
                  <div key={i} className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-900 mb-1.5">{item.what}</p>
                    <div className="grid gap-1 text-xs text-slate-600 sm:grid-cols-3">
                      <span><strong className="text-slate-800">Who:</strong> {item.who || 'TBD'}</span>
                      <span><strong className="text-slate-800">When:</strong> {item.when || 'TBD'}</span>
                      <span><strong className="text-slate-800">How:</strong> {item.how || '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts from AI */}
          {a.charts && a.charts.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Analysis charts</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {a.charts.map((chart, ci) => {
                  const data = Array.isArray(chart.data)
                    ? chart.data.filter(Boolean).map(r => ({ name: String(r.label ?? ''), value: Number(r.value ?? 0) }))
                    : [];
                  if (data.length === 0) return null;
                  return (
                    <div key={ci} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-700 mb-3">{chart.title}</p>
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 35 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={45} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} />
                            <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                            <Bar dataKey="value" radius={[5, 5, 0, 0]}>
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
              <Link href={`/evaluations/${evaluation.id}/diagnosis`}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm">
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
  const [userOrg, setUserOrg]         = useState<Organisation | null>(null);
  const [orgEvals, setOrgEvals]       = useState<Evaluation[]>([]);
  const [evalMetrics, setEvalMetrics] = useState<Map<string, EvalMetrics>>(new Map());
  const [publishedAnalyses, setPublishedAnalyses] = useState<PublishedAnalysis[]>([]);
  const [gapItems, setGapItems]       = useState<GapItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [activeTab, setActiveTab]     = useState<'overview' | 'reports' | 'evaluations'>('overview');

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('accessToken');
      if (!token) { setError('Please sign in.'); setLoading(false); return; }

      let userId = '';
      try { userId = JSON.parse(atob(token.split('.')[1])).sub; }
      catch { setError('Session error.'); setLoading(false); return; }

      try {
        const [user, allEvals, allPublished, allGaps] = await Promise.all([
          apiFetch<UserSummary>(`/users/${userId}`),
          apiFetch<Evaluation[]>('/evaluations'),
          apiFetch<PublishedAnalysis[]>('/published-analyses'),
          apiFetch<GapItem[]>('/gap-analysis').catch(() => [] as GapItem[]),
        ]);

        const org = user.organisation;
        setUserOrg(org);

        // Filter evals to this org
        const myEvals = allEvals.filter(e => e.organisation?.id === org.id);
        setOrgEvals(myEvals);
        setPublishedAnalyses(allPublished);

        const myEvalIds = new Set(myEvals.map(e => e.id));
        setGapItems(allGaps.filter(g => myEvalIds.has(g.evaluation.id)));

        // Fetch live metrics per evaluation in parallel
        const metricEntries = await Promise.all(
          myEvals.map(async (ev) => {
            try {
              const m = await apiFetch<EvalMetrics>(`/diagnosis/evaluations/${ev.id}/responses`);
              return [ev.id, m] as [string, EvalMetrics];
            } catch { return null; }
          }),
        );
        const map = new Map<string, EvalMetrics>();
        metricEntries.forEach(entry => { if (entry) map.set(entry[0], entry[1]); });
        setEvalMetrics(map);
      } catch (err: any) {
        setError(err?.message || 'Unable to load insights.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Aggregate stats across all evals ─────────────────────────────────────

  const aggregated = useMemo(() => {
    let totalResponses = 0, totalAnswers = 0, completionSum = 0, count = 0;
    const formData: { name: string; responses: number; completion: number }[] = [];

    orgEvals.forEach(ev => {
      const m = evalMetrics.get(ev.id);
      if (!m) return;
      totalResponses += m.totalResponses;
      totalAnswers   += m.totalAnswers;
      completionSum  += m.averageCompletion;
      count++;
      formData.push({
        name: ev.title.length > 20 ? ev.title.slice(0, 20) + '…' : ev.title,
        responses: m.totalResponses,
        completion: m.averageCompletion,
      });
    });

    return {
      totalResponses,
      totalAnswers,
      avgCompletion: count > 0 ? Math.round(completionSum / count) : 0,
      formData,
    };
  }, [orgEvals, evalMetrics]);

  // ── Gap severity chart ────────────────────────────────────────────────────

  const gapSeverityData = useMemo(() => {
    const counts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    gapItems.forEach(g => { if (counts[g.severity] !== undefined) counts[g.severity]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value, fill: SEV_CFG[name]?.bar ?? '#94a3b8' }));
  }, [gapItems]);

  // ── AI gaps from published analyses ──────────────────────────────────────

  const aiGaps = useMemo(() => {
    const all: string[] = [];
    publishedAnalyses.forEach(pa => {
      if (pa.analysis?.gaps) all.push(...pa.analysis.gaps);
    });
    return [...new Set(all)];
  }, [publishedAnalyses]);

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin mb-4" />
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
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Client Admin · Insights</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Company insights</h1>
            <p className="mt-1.5 text-sm text-slate-500">Real-time response stats, gap analysis, and published reports for your organisation.</p>
          </div>
          {userOrg && (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-slate-800">{userOrg.name}</span>
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 font-medium">{error}</div>
      ) : (
        <>
          {/* ── KPI cards ── */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Evaluations',      value: orgEvals.length,                icon: '📋', grad: 'from-blue-500 to-indigo-600',   sub: `${orgEvals.filter(e => e.status === 'ACTIVE').length} active` },
              { label: 'Submitted',        value: aggregated.totalResponses,      icon: '👥', grad: 'from-emerald-500 to-teal-600',   sub: 'total responses' },
              { label: 'Total answers',    value: aggregated.totalAnswers,        icon: '✏️', grad: 'from-amber-500 to-orange-600',   sub: 'across all forms' },
              { label: 'Avg completion',   value: `${aggregated.avgCompletion}%`, icon: '📈', grad: 'from-violet-500 to-purple-600',  sub: 'across evaluations' },
            ].map(kpi => (
              <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${kpi.grad} text-lg shadow-md`}>
                  {kpi.icon}
                </div>
                <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">{kpi.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Tabs ── */}
          <div className="mb-6 border-b border-slate-200">
            <nav className="flex gap-1">
              {([
                { id: 'overview',     label: 'Overview',          icon: '📈' },
                { id: 'reports',      label: 'Published reports',  icon: '📋', badge: publishedAnalyses.length },
                { id: 'evaluations',  label: 'Evaluations',        icon: '🏢', badge: orgEvals.length },
              ] as const).map(tab => (
                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                  {'badge' in tab && tab.badge > 0 && (
                    <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full px-1 text-[10px] font-bold ${
                      activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>{tab.badge}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* ─────────────────── OVERVIEW ─────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Response stats + completion chart */}
              <div className="grid gap-6 xl:grid-cols-2">
                {/* Left: per-evaluation metrics */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-bold text-slate-900">Response summary</h2>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Live data</span>
                  </div>

                  {/* Aggregate stat pills */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      { label: 'Submitted responses', value: aggregated.totalResponses, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                      { label: 'Avg completion',       value: `${aggregated.avgCompletion}%`, bg: 'bg-amber-50 text-amber-700 border-amber-200' },
                      { label: 'Unique respondents',   value: aggregated.totalResponses, bg: 'bg-blue-50 text-blue-700 border-blue-200' },
                    ].map(s => (
                      <div key={s.label} className={`rounded-2xl border p-4 ${s.bg}`}>
                        <p className="text-2xl font-bold">{s.value}</p>
                        <p className="text-xs font-medium mt-1 opacity-80 leading-tight">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Per-evaluation completion bars */}
                  {aggregated.formData.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Completion by evaluation</p>
                      {aggregated.formData.map((f, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-700 font-medium truncate max-w-[65%]">{f.name}</span>
                            <span className="text-slate-500 font-semibold">{f.responses} responses · {f.completion}%</span>
                          </div>
                          <CompletionBar pct={f.completion} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 text-center">
                      <p className="text-sm text-slate-400">Loading evaluation data…</p>
                    </div>
                  )}
                </div>

                {/* Right: bar chart */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-bold text-slate-900">Completion by evaluation</h2>
                  </div>
                  {aggregated.formData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={aggregated.formData} margin={{ top: 5, right: 5, left: -15, bottom: 50 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} />
                          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 100]} />
                          <Tooltip formatter={v => [`${v}%`, 'Completion']} contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                          <Bar dataKey="completion" radius={[8, 8, 0, 0]}>
                            {aggregated.formData.map((entry, i) => (
                              <Cell key={i} fill={entry.completion < 50 ? '#f59e0b' : entry.completion < 75 ? '#2563eb' : '#10b981'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-400">
                      No data yet — evaluations are loading.
                    </div>
                  )}

                  {/* Responses bar chart */}
                  {aggregated.formData.some(f => f.responses > 0) && (
                    <div className="mt-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Responses per evaluation</p>
                      <div className="h-36">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={aggregated.formData} margin={{ top: 0, right: 5, left: -15, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={40} />
                            <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                            <Tooltip formatter={v => [v, 'Responses']} contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                            <Bar dataKey="responses" radius={[6, 6, 0, 0]}>
                              {aggregated.formData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Gaps section ── */}
              {(gapItems.length > 0 || aiGaps.length > 0) && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Identified gaps</h2>
                      <p className="text-sm text-slate-500">Improvement areas flagged by scoring and AI analysis.</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                      {gapItems.length + aiGaps.length} gaps
                    </span>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
                    <div className="space-y-4">
                      {/* Score-based gaps */}
                      {gapItems.length > 0 && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Score-based gaps</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {gapItems.slice(0, 6).map(gap => (
                              <div key={gap.id} className={`rounded-2xl border p-4 ${SEV_CFG[gap.severity]?.bg ?? 'bg-slate-50'} border-slate-200`}>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <p className="text-sm font-bold text-slate-900">{gap.category}</p>
                                  <SeverityBadge severity={gap.severity} />
                                </div>
                                <p className="text-xs text-slate-600 mb-1.5">{gap.recommendedAction}</p>
                                <p className="text-xs text-slate-400">Owner: <strong>{gap.who}</strong> · {gap.when}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI-generated gaps */}
                      {aiGaps.length > 0 && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">AI-identified gaps</p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {aiGaps.map((gap, i) => (
                              <div key={i} className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 p-3">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-200 text-xs font-bold text-red-800">{i + 1}</span>
                                <p className="text-xs text-slate-700">{gap}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Gap severity chart */}
                    {gapItems.length > 0 && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Gap severity</p>
                        <div className="h-44">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={gapSeverityData} layout="vertical" margin={{ top: 0, right: 10, left: 5, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                              <XAxis type="number" allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                              <YAxis type="category" dataKey="name" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} width={65} />
                              <Tooltip formatter={v => [v, 'Gaps']} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                {gapSeverityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Latest published report preview */}
              {publishedAnalyses.length > 0 && (
                <div className="rounded-3xl border border-blue-200 bg-blue-50/50 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-base shadow-md">📊</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">Latest published analysis</p>
                      <p className="text-xs text-slate-500">
                        Received {new Date(publishedAnalyses[0].publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <button type="button" onClick={() => setActiveTab('reports')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm">
                      See all →
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

          {/* ─────────────────── REPORTS ─────────────────── */}
          {activeTab === 'reports' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Published analyses</h2>
                  <p className="text-sm text-slate-500">Reports published to your account by the super admin.</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-white">
                  {publishedAnalyses.length} report{publishedAnalyses.length !== 1 ? 's' : ''}
                </span>
              </div>
              {publishedAnalyses.length === 0 ? (
                <EmptyState icon="📊" title="No published reports yet" description="When the super admin publishes an analysis to your account, it will appear here." />
              ) : (
                publishedAnalyses.map(pa => (
                  <AnalysisCard key={pa.id} published={pa} evaluation={orgEvals.find(e => e.id === pa.evaluationId)} />
                ))
              )}
            </div>
          )}

          {/* ─────────────────── EVALUATIONS ─────────────────── */}
          {activeTab === 'evaluations' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Your evaluations</h2>
                  <p className="text-sm text-slate-500">All evaluations linked to {userOrg?.name ?? 'your organisation'}.</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-white">
                  {orgEvals.length}
                </span>
              </div>
              {orgEvals.length === 0 ? (
                <EmptyState icon="📋" title="No evaluations yet" description="Evaluations created for your organisation will appear here." />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {orgEvals.map(ev => {
                    const m = evalMetrics.get(ev.id);
                    const sc = STATUS_CFG[ev.status] ?? STATUS_CFG.DRAFT;
                    const pct = m?.averageCompletion ?? 0;
                    return (
                      <div key={ev.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-base">📋</div>
                            <div className="min-w-0">
                              <Link href={`/evaluations/${ev.id}`} className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors truncate block">
                                {ev.title}
                              </Link>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {ev.startDate ? new Date(ev.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No start date'}
                              </p>
                            </div>
                          </div>
                          <span className={`shrink-0 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${sc.bg} ${sc.text}`}>{sc.label}</span>
                        </div>

                        {m ? (
                          <>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              {[
                                { label: 'Responses', value: m.totalResponses },
                                { label: 'Answers',   value: m.totalAnswers },
                                { label: 'Completion',value: `${m.averageCompletion}%` },
                              ].map(s => (
                                <div key={s.label} className="rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-center">
                                  <p className="text-base font-bold text-slate-900">{s.value}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
                                </div>
                              ))}
                            </div>
                            <CompletionBar pct={pct} />
                          </>
                        ) : (
                          <div className="space-y-2">
                            <div className="h-8 animate-pulse rounded-xl bg-slate-100" />
                          </div>
                        )}

                        <div className="flex gap-2 mt-4">
                          <Link href={`/evaluations/${ev.id}/diagnosis`}
                            className="flex-1 inline-flex items-center justify-center rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 transition-colors">
                            🔍 Diagnosis
                          </Link>
                          <Link href={`/evaluations/${ev.id}`}
                            className="flex-1 inline-flex items-center justify-center rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors">
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
