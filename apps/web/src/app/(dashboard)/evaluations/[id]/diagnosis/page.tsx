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
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, LabelList, Cell,
} from 'recharts';

type Tab = 'analysis' | 'responses';

// ─── Constants ────────────────────────────────────────────────────────────────

const CHART_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4', '#84cc16'];

const SEV_STYLES: Record<string, { bg: string; border: string; badge: string; dot: string; text: string; bar: string }> = {
  CRITICAL: { bg: 'bg-red-50',     border: 'border-red-200',     badge: 'bg-red-600 text-white',     dot: 'bg-red-500',     text: 'text-red-800',     bar: '#ef4444' },
  HIGH:     { bg: 'bg-orange-50',  border: 'border-orange-200',  badge: 'bg-orange-500 text-white',  dot: 'bg-orange-500',  text: 'text-orange-800',  bar: '#f97316' },
  MEDIUM:   { bg: 'bg-amber-50',   border: 'border-amber-200',   badge: 'bg-amber-400 text-white',   dot: 'bg-amber-400',   text: 'text-amber-800',   bar: '#f59e0b' },
  LOW:      { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-500 text-white', dot: 'bg-emerald-500', text: 'text-emerald-800', bar: '#10b981' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseGap(text: string): { sev: string; text: string } {
  const u = text.toUpperCase();
  let sev = 'MEDIUM';
  if (u.startsWith('CRITICAL')) sev = 'CRITICAL';
  else if (u.startsWith('HIGH')) sev = 'HIGH';
  else if (u.startsWith('LOW')) sev = 'LOW';
  return { sev, text: text.replace(/^(CRITICAL|HIGH|MEDIUM|LOW)[:\s—\-]+/i, '').trim() };
}

function DiagnosisChartCard({ chart }: { chart: any }) {
  const data = Array.isArray(chart?.data)
    ? chart.data
        .filter((r: any) => r && (typeof r.label === 'string' || typeof r.name === 'string'))
        .map((r: any) => ({ name: String(r.label ?? r.name), value: Number(r.value ?? r.count ?? 0) }))
    : [];
  const avg = data.length > 0 ? data.reduce((s: number, d: any) => s + d.value, 0) / data.length : 0;
  const maxVal = data.length > 0 ? Math.max(...data.map((d: any) => d.value)) : 100;
  const yMax = maxVal <= 100 ? 100 : undefined;

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-900 mb-3">{chart.title || 'Chart'}</p>
        <div className="flex h-44 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">No data</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900 mb-3">{chart.title || 'Chart'}</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={yMax ? [0, yMax] : ['auto', 'auto']} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '11px' }} />
            <ReferenceLine y={avg} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'avg', position: 'right', fill: '#f59e0b', fontSize: 10 }} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {data.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              <LabelList dataKey="value" position="top" fill="#1e40af" fontSize={10} fontWeight="600" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

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
  const [canRunDiagnosis, setCanRunDiagnosis] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.replace('/login'); return; }
    setCanRunDiagnosis(!isClientAdmin());
    setHasAccess(true);
  }, [router]);

  const shouldFetch = hasAccess === true;
  const { responsesApi, diagnosisApi } = useEvaluationDiagnosis(id, shouldFetch);

  const diagnosis = diagnosisApi.data?.diagnosis ?? null;
  const s: any = diagnosis?.sections ?? {};

  const chartData: any[] = Array.isArray(s.charts) ? s.charts : [];

  const parsedGaps = useMemo(
    () => (Array.isArray(s.gaps) ? (s.gaps as string[]) : []).map(parseGap),
    [s.gaps],
  );

  const gapSevCounts = useMemo(() => {
    const counts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    parsedGaps.forEach((g: { sev: string; text: string }) => { if (counts[g.sev] !== undefined) counts[g.sev]++; });
    return counts;
  }, [parsedGaps]);

  const orgRows = useMemo(() => {
    const organogram = s.organogram;
    if (!organogram || !Array.isArray(organogram.nodes)) return [];
    const map = new Map<string, { name: string; title: string; reportsTo: string }>();
    organogram.nodes.forEach((node: any) => {
      const name = String(node.label || node.id || 'Unknown');
      map.set(name, { name, title: String(node.group || 'Team'), reportsTo: '' });
    });
    (organogram.links ?? []).forEach((link: any) => {
      const src = String(link.source || '');
      const tgt = String(link.target || '');
      // source/target can be label strings or IDs — resolve IDs via nodes
      const idToLabel = new Map<string, string>(
        organogram.nodes.map((n: any): [string, string] => [String(n.id ?? ''), String(n.label ?? n.id ?? '')])
      );
      const srcName: string = idToLabel.get(src) ?? src;
      const tgtName: string = idToLabel.get(tgt) ?? tgt;
      const row = map.get(srcName);
      if (row) row.reportsTo = tgtName;
    });
    return Array.from(map.values());
  }, [s.organogram]);

  const readinessRadarData = useMemo(() => {
    if (chartData.length > 0) {
      const rc = chartData.find((c: any) => /overall|readiness/i.test(String(c.title || '')));
      if (rc && Array.isArray(rc.data)) {
        return rc.data
          .filter((it: any) => it != null)
          .map((it: any) => ({ category: String(it.label || it.name || 'Metric'), score: Number(it.value ?? 0), fullMark: 100 }));
      }
    }
    if (!diagnosis) return null;
    const counts = {
      strengths: Array.isArray(s.strengths) ? s.strengths.length : 0,
      weaknesses: Array.isArray(s.weaknesses) ? s.weaknesses.length : 0,
      opportunities: Array.isArray(s.opportunities) ? s.opportunities.length : 0,
      recommendations: Array.isArray(s.recommendations) ? s.recommendations.length : 0,
      actionPlan: Array.isArray(s.actionPlan) ? s.actionPlan.length : 0,
    };
    return [
      { category: 'Strengths',       score: Math.min(100, counts.strengths * 15 + 20),       fullMark: 100 },
      { category: 'Weaknesses',      score: Math.max(24,  100 - counts.weaknesses * 15),      fullMark: 100 },
      { category: 'Opportunities',   score: Math.min(100, counts.opportunities * 15 + 20),    fullMark: 100 },
      { category: 'Recommendations', score: Math.min(100, counts.recommendations * 12 + 20),  fullMark: 100 },
      { category: 'Action Plan',     score: Math.min(100, counts.actionPlan * 15 + 20),        fullMark: 100 },
    ];
  }, [chartData, diagnosis, s]);

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
    setRunning(true); setRunMsg('');
    try {
      await apiFetch<void>(evaluationApiEndpoints.score(id), { method: 'POST' });
      responsesApi.refresh(); diagnosisApi.refresh();
      setRunMsg('Diagnosis complete. Results refreshed.');
    } catch { setRunMsg('Diagnosis failed. Please try again.'); }
    finally { setRunning(false); }
  }

  async function loadAllResponses() {
    if (allResponses || allResponsesLoading) { setShowAllResponses(true); return allResponses || []; }
    setAllResponsesLoading(true); setCopyMessage('');
    try {
      const payload = await apiFetch<{ responses?: any[] }>(evaluationApiEndpoints.responsesFull(id));
      const r = payload.responses || [];
      setAllResponses(r); setShowAllResponses(true); return r;
    } catch { setAllResponses([]); return []; }
    finally { setAllResponsesLoading(false); }
  }

  async function copyAllResponses() {
    let r = allResponses;
    if (!r) r = await loadAllResponses();
    if (!r || r.length === 0) { setCopyMessage('No responses available to copy.'); setTimeout(() => setCopyMessage(''), 3000); return; }
    const text = r.map((res: any) => {
      const answers = res.answers.map((a: any) => `Question: ${a.question}\nAnswer: ${a.answer}`).join('\n');
      return `Respondent: ${res.respondent}\nSubmitted: ${res.submittedAt ? new Date(res.submittedAt).toLocaleString() : 'Unknown'}\n${answers}`;
    }).join('\n\n---\n\n');
    if (navigator?.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopyMessage('All response answers copied to clipboard.');
      setTimeout(() => setCopyMessage(''), 3000);
    }
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'analysis',  label: 'Analysis',   icon: '🧠' },
    { id: 'responses', label: 'Responses',  icon: '💬' },
  ];

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Diagnosis Engine</h1>
          <p className="text-slate-500 mt-1 text-sm">Saved analysis, gap review, and response insights for this evaluation.</p>
        </div>
        {canRunDiagnosis && (
          <button onClick={runDiagnosis} disabled={running}
            className="px-4 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark disabled:bg-amber-300 rounded-lg transition-colors" aria-busy={running}>
            {running ? 'Running...' : 'Run Diagnosis'}
          </button>
        )}
      </div>

      {runMsg && <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg">{runMsg}</div>}
      {pageError && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <p className="font-semibold">Unable to load diagnosis data</p><p>{pageError}</p>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <p className="font-medium text-slate-900">Diagnosis summary</p>
        <p className="mt-1">Run the diagnosis to refresh the latest gap analysis and saved evaluation diagnosis.</p>
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex gap-1" aria-label="Diagnosis sections">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`} aria-current={activeTab === tab.id ? 'page' : undefined}>
              <span aria-hidden="true">{tab.icon}</span>{tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab content ── */}
      <div className="space-y-6">

        {/* ════ ANALYSIS TAB ════ */}
        {activeTab === 'analysis' && (
          !diagnosis ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <EmptyState icon="🧠" title="No saved analysis yet"
                description="Publish or generate a diagnosis to show the saved analysis content here."
                actionLabel={canRunDiagnosis ? 'Run Diagnosis' : undefined}
                onAction={canRunDiagnosis ? runDiagnosis : undefined} />
            </div>
          ) : (
            <>
              {/* ── Metric strip ── */}
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 xl:grid-cols-7">
                {[
                  { label: 'Strengths',       value: Array.isArray(s.strengths)       ? s.strengths.length       : 0, color: 'from-emerald-400 to-green-600' },
                  { label: 'Weaknesses',      value: Array.isArray(s.weaknesses)      ? s.weaknesses.length      : 0, color: 'from-red-400 to-rose-600' },
                  { label: 'Opportunities',   value: Array.isArray(s.opportunities)   ? s.opportunities.length   : 0, color: 'from-amber-400 to-orange-500' },
                  { label: 'Gaps',            value: parsedGaps.length,                                               color: 'from-rose-400 to-red-600' },
                  { label: 'Recommendations', value: Array.isArray(s.recommendations) ? s.recommendations.length : 0, color: 'from-blue-400 to-indigo-600' },
                  { label: 'Action Items',    value: Array.isArray(s.actionPlan)      ? s.actionPlan.length      : 0, color: 'from-violet-400 to-purple-600' },
                  { label: 'Q&As',            value: Array.isArray(s.questions)       ? s.questions.length       : 0, color: 'from-slate-400 to-slate-600' },
                ].map(m => (
                  <div key={m.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className={`mb-2 h-1.5 w-10 rounded-full bg-gradient-to-r ${m.color}`} />
                    <p className="text-2xl font-bold text-slate-900">{m.value}</p>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* ── Executive summary + Radar ── */}
              <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">Executive Summary</p>
                  <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {s.executiveSummary || 'No summary available.'}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      diagnosis.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                      diagnosis.status === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {diagnosis.status?.replace('_', ' ')}
                    </span>
                    <span>·</span>
                    <span>{diagnosis.generatedAt ? new Date(diagnosis.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date unknown'}</span>
                  </div>
                </div>
                {readinessRadarData && readinessRadarData.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Readiness Radar</p>
                    <div className="h-[260px]">
                      <RadarChart data={readinessRadarData} height={260} showLegend={false} />
                    </div>
                  </div>
                )}
              </div>

              {/* ── S / W / O ── */}
              <div className="grid gap-4 xl:grid-cols-3">
                {[
                  { key: 'strengths',    title: 'Strengths',     icon: '✓', color: 'emerald', items: s.strengths     },
                  { key: 'weaknesses',   title: 'Weaknesses',    icon: '!', color: 'red',     items: s.weaknesses    },
                  { key: 'opportunities',title: 'Opportunities', icon: '→', color: 'amber',   items: s.opportunities },
                ].map(({ key, title, icon, color, items }) => (
                  <div key={key} className={`rounded-2xl border border-${color}-200 bg-${color}-50/60 p-5 shadow-sm`}>
                    <h3 className={`text-sm font-bold text-${color}-800 mb-4 flex items-center gap-2`}>
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full bg-${color}-500 text-xs text-white`}>{icon}</span>
                      {title}
                    </h3>
                    <div className="space-y-2">
                      {Array.isArray(items) && items.length > 0 ? items.map((item: string, i: number) => (
                        <div key={i} className={`rounded-xl bg-white border border-${color}-100 px-4 py-3`}>
                          <p className="text-sm text-slate-700">{item}</p>
                        </div>
                      )) : <p className="text-xs text-slate-400">None provided.</p>}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Gaps ── */}
              {parsedGaps.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <h3 className="text-base font-bold text-slate-900">Identified Gaps</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(gapSevCounts).filter(([, v]) => v > 0).map(([sev, count]) => {
                        const st = SEV_STYLES[sev] ?? SEV_STYLES.MEDIUM;
                        return (
                          <span key={sev} className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold ${st.bg} ${st.text} border ${st.border}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />{sev}: {count}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  {/* Severity bar chart */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Gap severity distribution</p>
                    <div className="h-28">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Object.entries(gapSevCounts).map(([name, value]) => ({ name, value, fill: SEV_STYLES[name]?.bar ?? '#94a3b8' }))} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                          <XAxis type="number" allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                          <YAxis type="category" dataKey="name" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} width={65} />
                          <Tooltip formatter={(v) => [v, 'Gaps']} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                          <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                            {Object.entries(gapSevCounts).map(([name]) => <Cell key={name} fill={SEV_STYLES[name]?.bar ?? '#94a3b8'} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  {/* Gap cards by severity */}
                  <div className="space-y-4">
                    {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(sev => {
                      const items = parsedGaps.filter((g: { sev: string; text: string }) => g.sev === sev);
                      if (items.length === 0) return null;
                      const st = SEV_STYLES[sev];
                      return (
                        <div key={sev}>
                          <p className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${st.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />{sev} ({items.length})
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {items.map((g: { sev: string; text: string }, i: number) => (
                              <div key={i} className={`flex items-start gap-2.5 rounded-xl border p-3 ${st.bg} ${st.border}`}>
                                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${st.badge}`}>{i + 1}</span>
                                <p className="text-xs text-slate-700 leading-relaxed">{g.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Recommendations ── */}
              {Array.isArray(s.recommendations) && s.recommendations.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 mb-4">Recommendations</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {s.recommendations.map((item: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-1 ring-primary/20">{i + 1}</span>
                        <p className="text-sm text-slate-700 leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Action Plan ── */}
              {Array.isArray(s.actionPlan) && s.actionPlan.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 mb-5">Action Plan</h3>
                  <div className="space-y-4">
                    {s.actionPlan.map((item: any, i: number) => (
                      <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-bold text-white">{i + 1}</span>
                          <p className="text-sm font-bold text-slate-900 leading-snug">{item.what}</p>
                        </div>
                        <div className="ml-10 grid gap-2 text-xs sm:grid-cols-3">
                          <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                            <p className="font-bold text-blue-700 mb-0.5">Who</p>
                            <p className="text-slate-600">{item.who || 'TBD'}</p>
                          </div>
                          <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                            <p className="font-bold text-amber-700 mb-0.5">When</p>
                            <p className="text-slate-600">{item.when || 'TBD'}</p>
                          </div>
                          <div className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2">
                            <p className="font-bold text-slate-600 mb-0.5">How</p>
                            <p className="text-slate-600 leading-relaxed">{item.how || '—'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Charts ── */}
              {chartData.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <h3 className="text-base font-bold text-slate-900">Supporting Charts</h3>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                      {chartData.length} chart{chartData.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-2">
                    {chartData.map((chart: any, ci: number) => <DiagnosisChartCard key={ci} chart={chart} />)}
                  </div>
                </div>
              )}

              {/* ── Organogram ── */}
              {orgRows.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm overflow-x-auto">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <h3 className="text-base font-bold text-slate-900">Organogram</h3>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-200">
                      {orgRows.length} roles
                    </span>
                  </div>
                  <div className="min-w-[1000px]">
                    <OrgChart rows={orgRows as any} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[...new Set(s.organogram?.nodes?.map((n: any) => n.group).filter(Boolean))].map((dept: any, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">🏢 {dept}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Survey Q&As ── */}
              {Array.isArray(s.questions) && s.questions.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <h3 className="text-base font-bold text-slate-900">Survey Responses</h3>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {s.questions.length} Q&As
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {s.questions.map((q: any, i: number) => (
                      <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Q{i + 1}</p>
                        <p className="text-sm font-semibold text-slate-900 mb-2">{q.question}</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{q.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )
        )}

        {/* ════ RESPONSES TAB ════ */}
        {activeTab === 'responses' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Response Aggregation</h2>
                <p className="mt-1 text-sm text-slate-500">View aggregated response metrics and copy all submitted answers for this evaluation.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={loadAllResponses} disabled={allResponsesLoading}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
                  {allResponsesLoading ? 'Loading…' : 'Show all responses'}
                </button>
                <button type="button" onClick={copyAllResponses} disabled={allResponsesLoading}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition">
                  Copy all answers
                </button>
              </div>
            </div>

            {copyMessage && (
              <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">{copyMessage}</div>
            )}

            {responsesLoading ? (
              <p className="text-slate-400 text-sm">Loading response summary…</p>
            ) : responses ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Submitted responses', value: responses.totalResponses },
                    { label: 'Total answers', value: responses.totalAnswers },
                    { label: 'Avg completion', value: `${responses.averageCompletion}%` },
                  ].map(s => (
                    <div key={s.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">{s.label}</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900">{s.value}</p>
                    </div>
                  ))}
                </div>

                {responses.sampleAnswers?.length > 0 ? (
                  <div className="space-y-3">
                    {responses.sampleAnswers.map((item: any, i: number) => (
                      <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs text-slate-500">{item.respondent}</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1">{item.question}</p>
                        <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon="💬" title="No submitted responses yet" description="Once responses are submitted, this tab will show actual answers." />
                )}

                {showAllResponses && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900">All submitted responses</h3>
                    {allResponsesLoading ? <p className="text-slate-400 text-sm">Loading…</p> :
                      allResponses && allResponses.length > 0 ? (
                        <div className="space-y-4">
                          {allResponses.map((response: any, i: number) => (
                            <div key={response.id || i} className="rounded-2xl border border-slate-200 bg-white p-4">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
                                <div>
                                  <p className="text-xs text-slate-500">Respondent</p>
                                  <p className="font-semibold text-slate-900">{response.respondent}</p>
                                </div>
                                <p className="text-xs text-slate-500">{response.submittedAt ? new Date(response.submittedAt).toLocaleString() : 'Unknown'}</p>
                              </div>
                              <div className="space-y-3">
                                {response.answers.map((a: any, ai: number) => (
                                  <div key={ai} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <p className="text-xs text-slate-500">{a.question}</p>
                                    <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{a.answer}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-slate-500 text-sm">No full response details available.</p>
                    }
                  </div>
                )}
              </div>
            ) : (
              <EmptyState icon="💬" title="No submitted responses yet" description="Once responses are submitted, this tab will show actual answers." />
            )}
          </div>
        )}
      </div>
    </div>
  );
}


