'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
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
      <div className="rounded-2xl border border-border bg-gradient-to-r from-primary/5 via-accent/5 to-transparent p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-lg shadow-lg shadow-primary/20">
              📊
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{published.summary || 'Latest published evaluation'}</p>
              <p className="text-xs text-muted mt-0.5">
                Published {new Date(published.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} by {published.publishedBy || 'Superadmin'}
              </p>
              {evaluation ? (
                <Link href={`/evaluations/${evaluation.id}/diagnosis`} className="text-xs font-semibold text-primary hover:text-primary-light mt-1 inline-block transition-colors">
                  Open evaluation diagnosis →
                </Link>
              ) : null}
            </div>
          </div>
          <Pill label={published.recipientName ? `For ${published.recipientName}` : 'Shared insight'} color="blue" />
        </div>
      </div>

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
          <div className="grid gap-4">
            {analysis.charts.map((chart, chartIndex) => (
              <div key={chartIndex} className="rounded-xl border border-border bg-surface-muted p-4">
                <p className="font-semibold text-foreground mb-3">{chart.title || `Chart ${chartIndex + 1}`}</p>
                {chart.data?.map((row, rowIndex) => {
                  const value = Math.min(100, Math.max(0, Number(row.value || 0)));
                  return (
                    <div key={rowIndex} className="mb-3 last:mb-0">
                      <div className="flex justify-between text-xs text-muted mb-1.5">
                        <span className="font-medium">{row.label}</span>
                        <span className="font-bold">{value}%</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out"
                          style={{ width: `${value}%` }}
                        />
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

  const totalResponses = companyResponses.length;
  const totalAnswers = companyResponses.reduce((sum, response) => sum + Math.round((response.completionPercentage * response.questionCount) / 100), 0);
  const averageCompletion = companyResponses.length > 0
    ? Math.round(companyResponses.reduce((sum, response) => sum + response.completionPercentage, 0) / companyResponses.length)
    : 0;
  const totalRespondents = useMemo(() => new Set(companyResponses.map((response) => response.respondent.id)).size, [companyResponses]);
  const activeEvaluations = companyEvaluations.filter((evaluation) => evaluation.status !== 'ARCHIVED');
  const latestPublished = publishedAnalyses[0] || null;
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
    <div className={mounted ? 'animate-fade-in' : ''}>
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-8">
            <StatCard label="Submitted responses" value={totalResponses} icon="✅" color="blue" delay={0} />
            <StatCard label="Total answers" value={totalAnswers} icon="✍️" color="green" delay={50} />
            <StatCard label="Avg completion" value={`${averageCompletion}%`} icon="📈" color="slate" delay={100} />
          </div>

          {/* ── Main content grid ── */}
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] mb-6">
            {/* Active evaluations */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Active evaluations</h2>
                  <p className="text-sm text-muted mt-0.5">Click into each evaluation for the full diagnosis and form progress.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">{activeEvaluations.length}</span>
                  <span className="text-[11px] text-muted font-medium uppercase tracking-wider">Active</span>
                </div>
              </div>
              {activeEvaluations.length === 0 ? (
                <EmptyDashboard message="No active evaluations are available yet. Create one to get started." />
              ) : (
                <div className="space-y-3">
                  {activeEvaluations.map((evaluation, idx) => (
                    <Link
                      key={evaluation.id}
                      href={`/evaluations/${evaluation.id}`}
                      className="group block rounded-xl border border-border p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-sm hover:-translate-y-0.5"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-sm shadow-sm">
                            📋
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{evaluation.title}</h3>
                            <p className="text-xs text-muted mt-0.5">
                              Started {evaluation.startDate ? new Date(evaluation.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date(evaluation.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted bg-surface-muted px-3 py-1.5 rounded-lg border border-border">
                            {evaluation.status.replace('_', ' ')}
                          </span>
                          <span className="text-muted group-hover:text-primary transition-colors text-sm">→</span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          {evaluation._count.forms} form{evaluation._count.forms !== 1 ? 's' : ''} linked
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

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
