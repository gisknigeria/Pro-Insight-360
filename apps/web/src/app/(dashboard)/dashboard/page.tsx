'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import OrgChart from '@/components/organogram/OrgChart';
import ConsultantDashboard from '@/components/dashboards/ConsultantDashboard';
import HODDashboard from '@/components/dashboards/HODDashboard';
import RespondentDashboard from '@/components/dashboards/RespondentDashboard';
import { apiFetch } from '@/lib/api';
import { getUserRole } from '@/lib/auth';

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

interface DiagnosisResponseMetrics {
  totalResponses: number;
  totalAnswers: number;
  averageCompletion: number;
  questionCount?: number;
  sampleAnswers?: any[];
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

/* ═══════════════════════════════════════════
   ✨ Premium StatCard with glow & animation
   ═══════════════════════════════════════════ */
function StatCard({ label, value, icon, color = 'blue', delay = 0 }: { label: string; value: string | number; icon: string; color?: 'blue' | 'green' | 'yellow' | 'slate'; delay?: number }) {
  const colorConfig: Record<string, { bg: string; text: string; glow: string; ring: string }> = {
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50 group-hover:from-blue-100 group-hover:to-blue-200/50',
      text: 'text-blue-600',
      glow: 'glow-blue',
      ring: 'ring-blue-500/20',
    },
    green: {
      bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 group-hover:from-emerald-100 group-hover:to-emerald-200/50',
      text: 'text-emerald-600',
      glow: 'glow-green',
      ring: 'ring-emerald-500/20',
    },
    yellow: {
      bg: 'bg-gradient-to-br from-amber-50 to-amber-100/50 group-hover:from-amber-100 group-hover:to-amber-200/50',
      text: 'text-amber-600',
      glow: 'glow-amber',
      ring: 'ring-amber-500/20',
    },
    slate: {
      bg: 'bg-gradient-to-br from-slate-50 to-slate-100/50 group-hover:from-slate-100 group-hover:to-slate-200/50',
      text: 'text-slate-600',
      glow: '',
      ring: 'ring-slate-500/20',
    },
  };

  const cfg = colorConfig[color];

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 card-hover animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {/* Decorative gradient overlay */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${cfg.bg}`} />

      <div className="relative">
        <div className="flex items-center justify-between gap-4 mb-3">
          <span className="text-sm font-semibold text-muted tracking-tight">{label}</span>
          <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${cfg.bg} ${cfg.text} text-lg shadow-sm ring-1 ${cfg.ring} transition-transform duration-300 group-hover:scale-110 group-hover:${cfg.glow}`}>
            {icon}
          </span>
        </div>
        <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>

        {/* Decorative sparkle */}
        <div className="absolute -bottom-1 -right-1 w-16 h-16 opacity-0 group-hover:opacity-10 transition-opacity duration-500">
          <svg viewBox="0 0 100 100" fill="currentColor" className="text-primary">
            <circle cx="50" cy="50" r="50" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Pill({ label, color = 'slate' }: { label: string; color?: 'slate' | 'blue' | 'green' | 'amber' }) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-50 text-blue-700 ring-1 ring-blue-500/20',
    green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20',
    amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-500/20',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${colors[color]}`}>
      {label}
    </span>
  );
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

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-11 w-11 rounded-xl" />
      </div>
      <div className="skeleton h-9 w-20" />
    </div>
  );
}

/* ═══════════════════════════════════════════
   ✨ Latest Published Analysis — Premium Panel
   ═══════════════════════════════════════════ */
function LatestPublishedAnalysis({ published, evaluation }: { published: PublishedAnalysis; evaluation?: Evaluation }) {
  const analysis = published.analysis;
  const orgRows = buildOrgRows(published);

  return (
    <div className="space-y-4">
      {/* Summary card */}
      

      {analysis?.executiveSummary ? (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Executive summary
          </h3>
          <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{analysis.executiveSummary}</p>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {analysis?.strengths ? (
          <div className="rounded-2xl border border-green-200/50 bg-gradient-to-br from-green-50/50 to-surface p-5 shadow-sm">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-green-500">✦</span>
              Top strengths
            </h4>
            <ul className="space-y-2 text-sm text-muted">
              {analysis.strengths.map((item, idx) => (
                <li key={idx} className="flex gap-2.5 items-start">
                  <span className="flex-shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {analysis?.weaknesses ? (
          <div className="rounded-2xl border border-orange-200/50 bg-gradient-to-br from-orange-50/50 to-surface p-5 shadow-sm">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-orange-500">⚠</span>
              Key weaknesses
            </h4>
            <ul className="space-y-2 text-sm text-muted">
              {analysis.weaknesses.map((item, idx) => (
                <li key={idx} className="flex gap-2.5 items-start">
                  <span className="flex-shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-orange-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {analysis?.opportunities ? (
        <div className="rounded-2xl border border-blue-200/50 bg-gradient-to-br from-blue-50/50 to-surface p-5 shadow-sm">
          <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <span className="text-blue-500">✦</span>
            Primary opportunities
          </h4>
          <ul className="space-y-2 text-sm text-muted">
            {analysis.opportunities.map((item, idx) => (
              <li key={idx} className="flex gap-2.5 items-start">
                <span className="flex-shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {analysis?.recommendations ? (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Recommendations
          </h4>
          <ul className="space-y-2 text-sm text-muted">
            {analysis.recommendations.map((item, idx) => (
              <li key={idx} className="flex gap-2.5 items-start">
                <span className="flex-shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {analysis?.actionPlan?.length ? (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            Action plan
          </h4>
          <div className="space-y-3 text-sm text-muted">
            {analysis.actionPlan.map((item, idx) => (
              <div key={idx} className="rounded-xl bg-surface-muted p-4 border border-border transition-all hover:border-primary/30 hover:shadow-sm">
                <p className="font-bold text-foreground">{item.what || 'Action item'}</p>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                    Who: {item.who || 'TBD'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                    When: {item.when || 'TBD'}
                  </span>
                </div>
                {item.how && <p className="text-sm text-muted mt-2 leading-relaxed">{item.how}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {analysis?.charts?.length ? (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Supporting charts
          </h4>
          <div className="grid gap-4 xl:grid-cols-2">
            {analysis.charts.map((chart, chartIndex) => (
              <AnalysisChartCard key={chartIndex} chart={chart} />
            ))}
          </div>
        </div>
      ) : null}

      {orgRows.length > 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Organogram
            </h4>
            <span className="text-[11px] text-muted font-medium uppercase tracking-wider">Leadership structure</span>
          </div>
          <div className="overflow-auto rounded-xl border border-border bg-surface-muted p-4">
            <OrgChart rows={orgRows} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AnalysisChartCard({ chart }: { chart: { title?: string; data?: Array<{ label?: string; name?: string; value?: number; count?: number }>; }; }) {
  const chartData = Array.isArray(chart.data)
    ? chart.data.map((row, rowIndex) => ({
        name: String(row.label ?? row.name ?? `Item ${rowIndex + 1}`),
        value: Number(row.value ?? row.count ?? 0),
      }))
    : [];

  return (
    <div className="rounded-xl border border-border bg-surface-muted p-4 min-w-0">
      <p className="font-semibold text-foreground mb-3">{chart.title || 'Supporting chart'}</p>
      {chartData.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-surface p-5 text-sm text-muted">No chart data available.</div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#475569', fontSize: 11 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   ✨ Loading skeleton for dashboard
   ═══════════════════════════════════════════ */
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="skeleton h-8 w-64 mb-2" />
        <div className="skeleton h-4 w-96" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="skeleton h-6 w-40 mb-2" />
          <div className="skeleton h-4 w-64 mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-20 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="skeleton h-6 w-48 mb-2" />
          <div className="skeleton h-4 w-56 mb-6" />
          <div className="skeleton h-40 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ✨ Empty state component
   ═══════════════════════════════════════════ */
function EmptyDashboard({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-3xl mb-4 shadow-lg shadow-primary/5">
        📊
      </div>
      <p className="text-sm text-muted text-center max-w-md">{message}</p>
    </div>
  );
}

function SuperAdminDashboard() {
  const cards = [
    {
      title: 'Organisations',
      description: 'View and manage client organisations, sectors, and evaluation memberships.',
      href: '/organisations',
      icon: '🏢',
    },
    {
      title: 'Evaluations',
      description: 'Track evaluation progress, status, and AI review readiness across clients.',
      href: '/evaluations',
      icon: '📋',
    },
    {
      title: 'AI Diagnosis',
      description: 'Launch or review AI diagnosis workflows and monitor analysis health.',
      href: '/ai-diagnosis',
      icon: '🤖',
    },
    {
      title: 'Forms & Templates',
      description: 'Manage form templates and assessment designs for client rollouts.',
      href: '/forms',
      icon: '📝',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Super Admin Dashboard</h1>
            <p className="text-sm text-muted max-w-2xl mt-1">
              Central platform overview for managing organisations, evaluations, AI diagnosis workflows, and access controls.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-3xl border border-border bg-surface p-6 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl text-primary mb-4">
              {card.icon}
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">{card.title}</h2>
            <p className="text-sm text-muted leading-relaxed">{card.description}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Quick actions</h2>
            <p className="text-sm text-muted mt-1">Jump straight into the sections you use most as a platform administrator.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/organisations"
            className="rounded-2xl border border-border bg-surface-muted px-4 py-4 text-sm font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-white"
          >
            Browse organisations
          </Link>
          <Link
            href="/evaluations"
            className="rounded-2xl border border-border bg-surface-muted px-4 py-4 text-sm font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-white"
          >
            Review evaluations
          </Link>
          <Link
            href="/ai-diagnosis"
            className="rounded-2xl border border-border bg-surface-muted px-4 py-4 text-sm font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-white"
          >
            Open AI diagnosis
          </Link>
          <Link
            href="/forms"
            className="rounded-2xl border border-border bg-surface-muted px-4 py-4 text-sm font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-white"
          >
            Manage forms
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ✨ Main Dashboard Page
   ═══════════════════════════════════════════ */
export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [userOrg, setUserOrg] = useState<Organisation | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [gapSummaries, setGapSummaries] = useState<GapSummary[]>([]);
  const [publishedAnalyses, setPublishedAnalyses] = useState<PublishedAnalysis[]>([]);
  const [latestResponseMetrics, setLatestResponseMetrics] = useState<DiagnosisResponseMetrics | null>(null);
  const [selectedEvaluationForMetrics, setSelectedEvaluationForMetrics] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const rawRole = getUserRole();
    setRole(rawRole?.trim().toUpperCase() ?? null);

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

        const orgEvaluations = allEvaluations.filter((evaluation) => evaluation.organisation?.id === user.organisation.id);
        const publishedForOrg = allPublishedAnalyses
          .filter((analysis) => analysis.evaluationId && orgEvaluations.some((evaluation) => evaluation.id === analysis.evaluationId))
          .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

        const latestPublished = publishedForOrg[0];
        const latestOrgEvaluation = orgEvaluations.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        const selectedEvaluation = latestPublished && latestPublished.evaluationId
          ? orgEvaluations.find((evaluation) => evaluation.id === latestPublished.evaluationId) || latestOrgEvaluation
          : latestOrgEvaluation;

        setSelectedEvaluationForMetrics(selectedEvaluation || null);

        if (selectedEvaluation) {
          const metrics = await apiFetch<DiagnosisResponseMetrics>(`/diagnosis/evaluations/${selectedEvaluation.id}/responses`);
          setLatestResponseMetrics(metrics);
        }
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

  const totalResponses = latestResponseMetrics?.totalResponses ?? companyResponses.length;
  const totalAnswers = latestResponseMetrics?.totalAnswers ?? companyResponses.reduce((sum, response) => sum + Math.round((response.completionPercentage * response.questionCount) / 100), 0);
  const averageCompletion = latestResponseMetrics?.averageCompletion ?? (companyResponses.length > 0
    ? Math.round(companyResponses.reduce((sum, response) => sum + response.completionPercentage, 0) / companyResponses.length)
    : 0);
  const filteredPublishedAnalyses = publishedAnalyses
    .filter((analysis) => analysis.evaluationId && companyEvaluations.some((evaluation) => evaluation.id === analysis.evaluationId))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const latestPublished = filteredPublishedAnalyses[0] || null;
  const latestPublishedEvaluation = latestPublished ? companyEvaluations.find((evaluation) => evaluation.id === latestPublished.evaluationId) : undefined;

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-muted">Preparing dashboard…</p>
      </div>
    );
  }

  if (role && role !== 'CLIENT_ADMIN') {
    if (role === 'SUPER_ADMIN') {
      return <SuperAdminDashboard />;
    }
    if (role === 'CONSULTANT') {
      return <ConsultantDashboard />;
    }
    if (role === 'HOD') {
      return <HODDashboard />;
    }
    if (role === 'RESPONDENT') {
      return <RespondentDashboard />;
    }

    return <EmptyDashboard message="Your dashboard is being prepared. Please check back shortly." />;
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className={`${mounted ? 'animate-fade-in' : ''} max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8`}>
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Client Admin Dashboard</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary ring-1 ring-primary/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                </span>
                Live
              </span>
            </div>
            <p className="text-sm text-muted">Live evaluation metrics and your latest published AI insight.</p>
          </div>
          {userOrg && (
            <div className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 px-4 py-3 text-sm text-foreground border border-border shadow-sm">
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-success" />
              <span className="font-bold">Organisation:</span>
              <span className="text-muted">{userOrg.name}</span>
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200/50 bg-gradient-to-r from-red-50 to-red-100/50 p-5 text-sm text-red-700 mb-6 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      ) : (
        <>
          {/* ── Stat cards ── */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-4">
            <StatCard label="Submitted responses" value={totalResponses} icon="✅" color="blue" delay={0} />
            <StatCard label="Total answers" value={totalAnswers} icon="✍️" color="green" delay={50} />
            <StatCard label="Avg completion" value={`${averageCompletion}%`} icon="📈" color="slate" delay={100} />
          </div>

          {selectedEvaluationForMetrics ? (
            <div className="mb-6 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted">
              Metrics are sourced from the latest {filteredPublishedAnalyses.length > 0 ? 'published' : 'available'} evaluation: <span className="font-semibold text-foreground">{selectedEvaluationForMetrics.title}</span>.
            </div>
          ) : null}

          {/* ── Main content grid ── */}
          <div className="grid gap-6 mb-6">
            {/* Latest published insight */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Latest published insight</h2>
                  <p className="text-sm text-muted mt-0.5">Your most recent AI diagnosis report delivered by the superadmin.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-accent">{publishedAnalyses.length}</span>
                  <span className="text-[11px] text-muted font-medium uppercase tracking-wider">Reports</span>
                </div>
              </div>
              {latestPublished ? (
                <LatestPublishedAnalysis published={latestPublished} evaluation={latestPublishedEvaluation} />
              ) : (
                <EmptyDashboard message="No published AI insights have been shared with your account yet." />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
