'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import OrgChart from '@/components/organogram/OrgChart';
import ConsultantDashboard from '@/components/dashboards/ConsultantDashboard';
import HODDashboard from '@/components/dashboards/HODDashboard';
import RespondentDashboard from '@/components/dashboards/RespondentDashboard';
import { apiFetch } from '@/lib/api';
import { getUserRole } from '@/lib/auth';

interface Organisation {
  id: string;
  name: string;
  sector?: string | null;
  status?: string;
  _count?: { users?: number; evaluations?: number };
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
  submittedAt?: string | null;
  createdAt?: string;
  respondent: { id: string };
  form: { id: string; title: string; evaluation: { id: string; organisation: Organisation } | null };
}

interface FormSummary {
  id: string;
  title: string;
  status?: string;
  questionCount: number;
  organisationId?: string | null;
  organisation?: Organisation | null;
  evaluationId?: string | null;
  evaluationTitle?: string;
  unitName?: string | null;
  createdAt?: string;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  organisation: Organisation;
  createdAt?: string;
}

interface ChartDataPoint {
  name: string;
  value: number;
}

interface OrgDashboardSummary {
  id: string;
  name: string;
  sector: string;
  users: number;
  evaluations: number;
  activeEvaluations: number;
  forms: number;
  responses: number;
  answers: number;
  reports: number;
  averageCompletion: number;
  questionBank: number;
  completionLabel: string;
  lastActivity: string | null;
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

type DashboardIconName = 'building' | 'form' | 'chart' | 'insight' | 'activity' | 'check' | 'edit' | 'report' | 'clipboard' | 'bot' | 'arrowRight';

function DashboardIcon({ name, className = 'h-5 w-5' }: { name: DashboardIconName; className?: string }) {
  const paths: Record<DashboardIconName, ReactNode> = {
    building: (
      <>
        <path d="M4 21V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v15" />
        <path d="M18 21V10h2a2 2 0 0 1 2 2v9" />
        <path d="M8 8h4M8 12h4M8 16h4M3 21h20" />
      </>
    ),
    form: (
      <>
        <path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M14 3v5h5M9 13h6M9 17h4" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19V5M4 19h16" />
        <path d="M8 16v-5M12 16V8M16 16v-8" />
      </>
    ),
    insight: (
      <>
        <path d="M12 3a7 7 0 0 0-4 12.74V18h8v-2.26A7 7 0 0 0 12 3Z" />
        <path d="M9 22h6M10 18v-3h4v3" />
      </>
    ),
    activity: <path d="M3 12h4l3-7 4 14 3-7h4" />,
    check: (
      <>
        <path d="M20 6 9 17l-5-5" />
        <path d="M21 12a9 9 0 1 1-3-6.7" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),
    report: (
      <>
        <path d="M5 3h14v18H5Z" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
    clipboard: (
      <>
        <path d="M9 4h6l1 2h3v15H5V6h3Z" />
        <path d="M9 10h6M9 14h6M9 18h3" />
      </>
    ),
    bot: (
      <>
        <path d="M12 8V4M7 8h10a3 3 0 0 1 3 3v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-5a3 3 0 0 1 3-3Z" />
        <path d="M9 13h.01M15 13h.01M10 17h4" />
      </>
    ),
    arrowRight: <path d="M5 12h14M13 5l7 7-7 7" />,
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function iconForStatLabel(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes('org')) return <DashboardIcon name="building" />;
  if (normalized.includes('form')) return <DashboardIcon name="form" />;
  if (normalized.includes('project') || normalized.includes('completion')) return <DashboardIcon name="chart" />;
  if (normalized.includes('response')) return <DashboardIcon name="check" />;
  if (normalized.includes('answer')) return <DashboardIcon name="edit" />;
  if (normalized.includes('report') || normalized.includes('insight')) return <DashboardIcon name="report" />;
  return <DashboardIcon name="activity" />;
}

function iconForModuleTitle(title: string) {
  if (title.includes('Organisations')) return <DashboardIcon name="building" className="h-5 w-5" />;
  if (title.includes('Evaluations')) return <DashboardIcon name="clipboard" className="h-5 w-5" />;
  if (title.includes('Diagnosis')) return <DashboardIcon name="bot" className="h-5 w-5" />;
  return <DashboardIcon name="form" className="h-5 w-5" />;
}

/* ═══════════════════════════════════════════
   ✨ Premium StatCard with glow & animation
   ═══════════════════════════════════════════ */
function StatCard({ label, value, icon, color = 'blue', delay = 0 }: { label: string; value: string | number; icon: ReactNode; color?: 'blue' | 'green' | 'yellow' | 'slate'; delay?: number }) {
  const colorConfig: Record<string, { bg: string; accent: string; text: string; subtext: string; ring: string }> = {
    blue: {
      bg: 'from-slate-900 via-slate-800 to-blue-950',
      accent: 'bg-blue-400/12',
      text: 'text-white',
      subtext: 'text-blue-100/75',
      ring: 'ring-blue-300/15',
    },
    green: {
      bg: 'from-slate-900 via-slate-800 to-emerald-950',
      accent: 'bg-emerald-400/12',
      text: 'text-white',
      subtext: 'text-emerald-100/75',
      ring: 'ring-emerald-300/15',
    },
    yellow: {
      bg: 'from-slate-900 via-slate-800 to-amber-950',
      accent: 'bg-amber-400/12',
      text: 'text-white',
      subtext: 'text-amber-100/75',
      ring: 'ring-amber-300/15',
    },
    slate: {
      bg: 'from-slate-950 via-slate-900 to-zinc-950',
      accent: 'bg-white/12',
      text: 'text-white',
      subtext: 'text-slate-300/80',
      ring: 'ring-white/10',
    },
  };

  const cfg = colorConfig[color];

  return (
    <div
      className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${cfg.bg} p-5 shadow-lg shadow-slate-950/15 ring-1 ${cfg.ring} transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl animate-fade-in-up`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-white/25" />
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full border border-white/10 bg-white/[0.04]" />

      <div className="relative">
        <div className="flex items-center justify-between gap-4 mb-3">
          <span className={`text-sm font-semibold tracking-tight ${cfg.subtext}`}>{label}</span>
          <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${cfg.accent} ${cfg.text} text-lg shadow-sm ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-105`}>
            {typeof icon === 'string' ? iconForStatLabel(label) : icon}
          </span>
        </div>
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        <div className="mt-3 h-px w-full rounded-full bg-white/15">
          <div className="h-px w-2/3 rounded-full bg-white/55" />
        </div>
      </div>
    </div>
  );
}

function Pill({ label, color = 'slate' }: { label: string; color?: 'slate' | 'blue' | 'green' | 'amber' }) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-amber-50 text-amber-800 ring-1 ring-blue-500/20',
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
        <div className="rounded-2xl border border-amber-200/50 bg-gradient-to-br from-blue-50/50 to-surface p-5 shadow-sm">
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
        <DashboardIcon name="chart" className="h-7 w-7 text-primary" />
      </div>
      <p className="text-sm text-muted text-center max-w-md">{message}</p>
    </div>
  );
}

function SuperAdminDashboard() {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [reports, setReports] = useState<PublishedAnalysis[]>([]);
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState('ALL');
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadStats() {
      try {
        const [orgData, evaluationData, formData, reportData, responseData, userData] = await Promise.all([
          apiFetch<Organisation[]>('/organisations').catch(() => []),
          apiFetch<Evaluation[]>('/evaluations').catch(() => []),
          apiFetch<FormSummary[]>('/forms').catch(() => []),
          apiFetch<PublishedAnalysis[]>('/published-analyses/all').catch(() => []),
          apiFetch<ResponseItem[]>('/responses').catch(() => []),
          apiFetch<UserItem[]>('/users').catch(() => []),
        ]);
        if (!active) return;
        setOrganisations(orgData);
        setEvaluations(evaluationData);
        setForms(formData);
        setReports(reportData);
        setResponses(responseData);
        setUsers(userData);
      } finally {
        if (active) setLoadingStats(false);
      }
    }
    loadStats();
    return () => { active = false; };
  }, []);

  const orgSummaries = useMemo<OrgDashboardSummary[]>(() => {
    return organisations.map((org) => {
      const orgEvaluations = evaluations.filter((evaluation) => evaluation.organisation?.id === org.id);
      const evaluationIds = new Set(orgEvaluations.map((evaluation) => evaluation.id));
      const orgForms = forms.filter((form) => form.organisationId === org.id || form.organisation?.id === org.id || (form.evaluationId ? evaluationIds.has(form.evaluationId) : false));
      const orgResponses = responses.filter((response) => response.form.evaluation?.organisation?.id === org.id);
      const orgUsers = users.filter((user) => user.organisation?.id === org.id);
      const orgReports = reports.filter((report) => report.evaluationId ? evaluationIds.has(report.evaluationId) : false);
      const answers = orgResponses.reduce((sum, response) => sum + Math.round((response.completionPercentage * response.questionCount) / 100), 0);
      const averageCompletion = orgResponses.length
        ? Math.round(orgResponses.reduce((sum, response) => sum + response.completionPercentage, 0) / orgResponses.length)
        : 0;
      const lastDates = [
        ...orgEvaluations.map((evaluation) => evaluation.createdAt),
        ...orgReports.map((report) => report.publishedAt),
        ...orgResponses.map((response) => response.submittedAt || response.createdAt),
      ].filter(Boolean) as string[];
      const lastActivity = lastDates.length
        ? lastDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
        : null;

      return {
        id: org.id,
        name: org.name,
        sector: org.sector || 'Unclassified',
        users: orgUsers.length || org._count?.users || 0,
        evaluations: orgEvaluations.length,
        activeEvaluations: orgEvaluations.filter((evaluation) => evaluation.status === 'ACTIVE').length,
        forms: orgForms.length,
        responses: orgResponses.length,
        answers,
        reports: orgReports.length,
        averageCompletion,
        questionBank: orgForms.reduce((sum, form) => sum + (form.questionCount || 0), 0),
        completionLabel: averageCompletion >= 75 ? 'Strong' : averageCompletion >= 50 ? 'Moderate' : averageCompletion > 0 ? 'Needs push' : 'No responses',
        lastActivity,
      };
    }).sort((a, b) => b.responses - a.responses || b.evaluations - a.evaluations);
  }, [evaluations, forms, organisations, reports, responses, users]);

  const selectedSummary = useMemo<OrgDashboardSummary>(() => {
    if (selectedOrgId !== 'ALL') {
      return orgSummaries.find((summary) => summary.id === selectedOrgId) || {
        id: selectedOrgId,
        name: 'Selected organisation',
        sector: 'Unclassified',
        users: 0,
        evaluations: 0,
        activeEvaluations: 0,
        forms: 0,
        responses: 0,
        answers: 0,
        reports: 0,
        averageCompletion: 0,
        questionBank: 0,
        completionLabel: 'No responses',
        lastActivity: null,
      };
    }

    const totals = orgSummaries.reduce((acc, summary) => ({
      ...acc,
      users: acc.users + summary.users,
      evaluations: acc.evaluations + summary.evaluations,
      activeEvaluations: acc.activeEvaluations + summary.activeEvaluations,
      forms: acc.forms + summary.forms,
      responses: acc.responses + summary.responses,
      answers: acc.answers + summary.answers,
      reports: acc.reports + summary.reports,
      questionBank: acc.questionBank + summary.questionBank,
    }), {
      id: 'ALL',
      name: 'General overview',
      sector: 'All sectors',
      users: 0,
      evaluations: 0,
      activeEvaluations: 0,
      forms: 0,
      responses: 0,
      answers: 0,
      reports: 0,
      averageCompletion: 0,
      questionBank: 0,
      completionLabel: 'Portfolio',
      lastActivity: null,
    });
    const weightedCompletion = orgSummaries.reduce((sum, summary) => sum + (summary.averageCompletion * summary.responses), 0);
    totals.averageCompletion = totals.responses ? Math.round(weightedCompletion / totals.responses) : 0;
    totals.lastActivity = orgSummaries.map((summary) => summary.lastActivity).filter(Boolean).sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime())[0] || null;
    return totals;
  }, [orgSummaries, selectedOrgId]);

  const scopedEvaluationIds = useMemo(() => {
    if (selectedOrgId === 'ALL') return new Set(evaluations.map((evaluation) => evaluation.id));
    return new Set(evaluations.filter((evaluation) => evaluation.organisation?.id === selectedOrgId).map((evaluation) => evaluation.id));
  }, [evaluations, selectedOrgId]);

  const scopedResponses = useMemo(() => {
    if (selectedOrgId === 'ALL') return responses;
    return responses.filter((response) => response.form.evaluation?.organisation?.id === selectedOrgId);
  }, [responses, selectedOrgId]);

  const scopedForms = useMemo(() => {
    if (selectedOrgId === 'ALL') return forms;
    return forms.filter((form) => form.organisationId === selectedOrgId || form.organisation?.id === selectedOrgId || (form.evaluationId ? scopedEvaluationIds.has(form.evaluationId) : false));
  }, [forms, scopedEvaluationIds, selectedOrgId]);

  const scopedEvaluations = useMemo(() => {
    if (selectedOrgId === 'ALL') return evaluations;
    return evaluations.filter((evaluation) => evaluation.organisation?.id === selectedOrgId);
  }, [evaluations, selectedOrgId]);

  const scopedReports = useMemo(() => {
    if (selectedOrgId === 'ALL') return reports;
    return reports.filter((report) => report.evaluationId ? scopedEvaluationIds.has(report.evaluationId) : false);
  }, [reports, scopedEvaluationIds, selectedOrgId]);

  const statusData = useMemo<ChartDataPoint[]>(() => {
    const counts = scopedEvaluations.reduce<Record<string, number>>((acc, evaluation) => {
      const status = evaluation.status ? evaluation.status.replace(/_/g, ' ') : 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [scopedEvaluations]);

  const completionDistribution = useMemo<ChartDataPoint[]>(() => {
    const buckets = [
      { name: '0-25%', min: 0, max: 25, value: 0 },
      { name: '26-50%', min: 26, max: 50, value: 0 },
      { name: '51-75%', min: 51, max: 75, value: 0 },
      { name: '76-100%', min: 76, max: 100, value: 0 },
    ];
    scopedResponses.forEach((response) => {
      const bucket = buckets.find((item) => response.completionPercentage >= item.min && response.completionPercentage <= item.max);
      if (bucket) bucket.value += 1;
    });
    return buckets.map(({ name, value }) => ({ name, value }));
  }, [scopedResponses]);

  const monthlyTrendData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        name: date.toLocaleDateString(undefined, { month: 'short' }),
        responses: 0,
        projects: 0,
        reports: 0,
      };
    });
    const byKey = Object.fromEntries(months.map((month) => [month.key, month]));
    scopedResponses.forEach((response) => {
      const rawDate = response.submittedAt || response.createdAt;
      if (!rawDate) return;
      const date = new Date(rawDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (byKey[key]) byKey[key].responses += 1;
    });
    scopedEvaluations.forEach((evaluation) => {
      const date = new Date(evaluation.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (byKey[key]) byKey[key].projects += 1;
    });
    scopedReports.forEach((report) => {
      const date = new Date(report.publishedAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (byKey[key]) byKey[key].reports += 1;
    });
    return months;
  }, [scopedEvaluations, scopedReports, scopedResponses]);

  const orgComparisonData = useMemo(() => {
    return orgSummaries.slice(0, 8).map((summary) => ({
      name: summary.name.length > 16 ? `${summary.name.slice(0, 16)}...` : summary.name,
      responses: summary.responses,
      projects: summary.evaluations,
      completion: summary.averageCompletion,
    }));
  }, [orgSummaries]);

  const sectorData = useMemo<ChartDataPoint[]>(() => {
    const source = selectedOrgId === 'ALL' ? orgSummaries : orgSummaries.filter((summary) => summary.id === selectedOrgId);
    const counts = source.reduce<Record<string, number>>((acc, summary) => {
      acc[summary.sector] = (acc[summary.sector] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orgSummaries, selectedOrgId]);

  const formDepthData = useMemo(() => {
    return scopedForms
      .slice()
      .sort((a, b) => (b.questionCount || 0) - (a.questionCount || 0))
      .slice(0, 7)
      .map((form) => ({
        name: form.title.length > 18 ? `${form.title.slice(0, 18)}...` : form.title,
        questions: form.questionCount || 0,
        responses: scopedResponses.filter((response) => response.form.id === form.id).length,
      }));
  }, [scopedForms, scopedResponses]);

  const maturityRadarData = useMemo(() => {
    const activeRate = selectedSummary.evaluations ? Math.round((selectedSummary.activeEvaluations / selectedSummary.evaluations) * 100) : 0;
    const responseDepth = selectedSummary.forms ? Math.min(100, Math.round((selectedSummary.responses / selectedSummary.forms) * 20)) : 0;
    const reportCoverage = selectedSummary.evaluations ? Math.min(100, Math.round((selectedSummary.reports / selectedSummary.evaluations) * 100)) : 0;
    const userCoverage = selectedSummary.users ? Math.min(100, selectedSummary.users * 10) : 0;

    return [
      { subject: 'Completion', score: selectedSummary.averageCompletion },
      { subject: 'Response depth', score: responseDepth },
      { subject: 'Active work', score: activeRate },
      { subject: 'Insight coverage', score: reportCoverage },
      { subject: 'User coverage', score: userCoverage },
    ];
  }, [selectedSummary]);

  const moduleData = useMemo(() => [
    { name: 'Organisations', value: selectedOrgId === 'ALL' ? orgSummaries.length : 1 },
    { name: 'Users', value: selectedSummary.users },
    { name: 'Forms', value: selectedSummary.forms },
    { name: 'Projects', value: selectedSummary.evaluations },
    { name: 'Responses', value: selectedSummary.responses },
    { name: 'Reports', value: selectedSummary.reports },
  ], [orgSummaries.length, selectedOrgId, selectedSummary]);

  const leaderRows = selectedOrgId === 'ALL'
    ? orgSummaries.slice(0, 6)
    : orgSummaries.filter((summary) => summary.id === selectedOrgId);
  const pieColors = ['#0f766e', '#2563eb', '#f97316', '#7c3aed', '#dc2626', '#0891b2'];
  const viewLabel = selectedOrgId === 'ALL' ? 'General overview' : selectedSummary.name;

  return (
    <div className="super-admin-dashboard space-y-5">
      <div className="border border-slate-900 bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/10">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Super Admin</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Executive Portfolio Dashboard</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Switch from the full platform picture into any client organisation and compare activity, completion, form depth, report coverage, and response quality in one view.
            </p>
          </div>
          <label className="min-w-[280px] text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            Dashboard scope
            <select
              value={selectedOrgId}
              onChange={(event) => setSelectedOrgId(event.target.value)}
              className="mt-2 w-full border border-slate-700 bg-slate-900 px-3 py-3 text-sm font-semibold normal-case tracking-normal text-white outline-none focus:border-cyan-300"
            >
              <option value="ALL">General overview - all organisations</option>
              {organisations.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Client organisations" value={loadingStats ? '...' : selectedOrgId === 'ALL' ? orgSummaries.length : 1} icon={<DashboardIcon name="building" />} color="blue" delay={0} />
        <StatCard label="Responses captured" value={loadingStats ? '...' : selectedSummary.responses} icon={<DashboardIcon name="check" />} color="green" delay={50} />
        <StatCard label="Avg completion" value={loadingStats ? '...' : `${selectedSummary.averageCompletion}%`} icon={<DashboardIcon name="chart" />} color="yellow" delay={100} />
        <StatCard label="Published insights" value={loadingStats ? '...' : selectedSummary.reports} icon={<DashboardIcon name="insight" />} color="slate" delay={150} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="dashboard-panel border-slate-300 p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-950">Activity trend for {viewLabel}</h2>
              <p className="text-xs text-slate-500">Responses, projects, and published insight output across the last six months.</p>
            </div>
            <Pill label="Timeline" color="green" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyTrendData} margin={{ top: 12, right: 18, left: -8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#475569', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 0, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="responses" fill="#0f766e" fillOpacity={0.18} stroke="#0f766e" strokeWidth={2} />
                <Bar dataKey="projects" fill="#2563eb" radius={[0, 0, 0, 0]} />
                <Line type="monotone" dataKey="reports" stroke="#f97316" strokeWidth={3} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-panel border-slate-300 p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-950">Portfolio maturity signal</h2>
              <p className="text-xs text-slate-500">A practical proxy from completion, coverage, active work, and user footprint.</p>
            </div>
            <Pill label={selectedSummary.completionLabel} color="amber" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={maturityRadarData} outerRadius={92}>
                <PolarGrid stroke="#cbd5e1" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.22} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 0, fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="dashboard-panel border-slate-300 p-5">
          <h2 className="text-base font-bold text-slate-950">What exists in scope</h2>
          <p className="mb-4 text-xs text-slate-500">Record volume by operational object.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moduleData} margin={{ top: 8, right: 10, left: -12, bottom: 35 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={52} />
                <YAxis allowDecimals={false} tick={{ fill: '#475569', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 0, fontSize: 12 }} />
                <Bar dataKey="value" fill="#0891b2" radius={[0, 0, 0, 0]}>
                  {moduleData.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-panel border-slate-300 p-5">
          <h2 className="text-base font-bold text-slate-950">Evaluation status mix</h2>
          <p className="mb-4 text-xs text-slate-500">Shows where active delivery attention is sitting.</p>
          {statusData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={46} outerRadius={86} paddingAngle={0}>
                    {statusData.map((entry, index) => (
                      <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 0, fontSize: 12 }} />
                  <Legend iconType="square" wrapperStyle={{ color: '#334155', fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">No project status data yet.</div>
          )}
        </div>

        <div className="dashboard-panel border-slate-300 p-5">
          <h2 className="text-base font-bold text-slate-950">Completion distribution</h2>
          <p className="mb-4 text-xs text-slate-500">Response quality split by submitted completion band.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={completionDistribution} margin={{ top: 8, right: 10, left: -12, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#475569', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 0, fontSize: 12 }} />
                <Area type="monotone" dataKey="value" stroke="#f97316" fill="#fed7aa" fillOpacity={0.75} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="dashboard-panel border-slate-300 p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-950">Organisation comparison</h2>
              <p className="text-xs text-slate-500">Which clients are generating responses, projects, and stronger completion.</p>
            </div>
            <Pill label="Ranked" color="blue" />
          </div>
          {selectedOrgId === 'ALL' ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={orgComparisonData} margin={{ top: 12, right: 16, left: -8, bottom: 45 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={62} />
                  <YAxis yAxisId="left" allowDecimals={false} tick={{ fill: '#475569', fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: '#475569', fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 0, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="responses" fill="#0f766e" radius={[0, 0, 0, 0]} />
                  <Bar yAxisId="left" dataKey="projects" fill="#2563eb" radius={[0, 0, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="completion" stroke="#dc2626" strokeWidth={3} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Users onboarded', selectedSummary.users],
                ['Forms deployed', selectedSummary.forms],
                ['Question bank', selectedSummary.questionBank],
                ['Answers collected', selectedSummary.answers],
                ['Active projects', selectedSummary.activeEvaluations],
                ['Latest activity', selectedSummary.lastActivity ? new Date(selectedSummary.lastActivity).toLocaleDateString() : 'None'],
              ].map(([label, value]) => (
                <div key={label} className="border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-panel border-slate-300 p-5">
          <h2 className="text-base font-bold text-slate-950">Sector footprint</h2>
          <p className="mb-4 text-xs text-slate-500">Client portfolio spread by recorded sector.</p>
          {sectorData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sectorData} dataKey="value" nameKey="name" outerRadius={94}>
                    {sectorData.map((entry, index) => (
                      <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 0, fontSize: 12 }} />
                  <Legend iconType="square" wrapperStyle={{ color: '#334155', fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">No sector data yet.</div>
          )}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="dashboard-panel border-slate-300 p-5">
          <h2 className="text-base font-bold text-slate-950">Form depth and uptake</h2>
          <p className="mb-4 text-xs text-slate-500">Largest instruments compared with responses received.</p>
          {formDepthData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formDepthData} layout="vertical" margin={{ top: 8, right: 16, left: 25, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: '#475569', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} width={90} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 0, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="questions" fill="#7c3aed" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="responses" fill="#0f766e" radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">No form data yet.</div>
          )}
        </div>

        <div className="dashboard-panel border-slate-300 p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-950">Organisation summaries</h2>
              <p className="text-xs text-slate-500">Fast scan of the portfolio or selected organisation.</p>
            </div>
            <Pill label={selectedOrgId === 'ALL' ? 'All clients' : 'Selected'} color="green" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-3 pr-4 font-bold">Organisation</th>
                  <th className="py-3 pr-4 font-bold">Sector</th>
                  <th className="py-3 pr-4 font-bold">Projects</th>
                  <th className="py-3 pr-4 font-bold">Responses</th>
                  <th className="py-3 pr-4 font-bold">Completion</th>
                  <th className="py-3 pr-4 font-bold">Reports</th>
                </tr>
              </thead>
              <tbody>
                {leaderRows.map((summary) => (
                  <tr key={summary.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-bold text-slate-950">{summary.name}</td>
                    <td className="py-3 pr-4 text-slate-500">{summary.sector}</td>
                    <td className="py-3 pr-4 text-slate-700">{summary.evaluations}</td>
                    <td className="py-3 pr-4 text-slate-700">{summary.responses}</td>
                    <td className="py-3 pr-4">
                      <span className="font-bold text-slate-950">{summary.averageCompletion}%</span>
                      <span className="ml-2 text-xs text-slate-500">{summary.completionLabel}</span>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{summary.reports}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Browse organisations', '/organisations', 'building'],
          ['Review evaluations', '/evaluations', 'clipboard'],
          ['Open AI diagnosis', '/ai-diagnosis', 'bot'],
          ['Manage forms', '/forms', 'form'],
        ].map(([label, href, icon]) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center justify-between border border-slate-300 bg-white px-4 py-4 text-sm font-bold text-slate-900 shadow-sm transition hover:border-slate-950"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-slate-950 text-white">
                <DashboardIcon name={icon as DashboardIconName} className="h-4 w-4" />
              </span>
              {label}
            </span>
            <DashboardIcon name="arrowRight" className="h-4 w-4 text-teal-700" />
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ✨ Per-evaluation live response stats card
   ═══════════════════════════════════════════ */
function EvaluationStatCard({ evaluation }: { evaluation: Evaluation }) {
  const [metrics, setMetrics] = useState<DiagnosisResponseMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    apiFetch<DiagnosisResponseMetrics>(`/diagnosis/evaluations/${evaluation.id}/responses`)
      .then(setMetrics)
      .catch(() => setMetrics(null))
      .finally(() => setLoadingMetrics(false));
  }, [evaluation.id]);

  const completion = metrics?.averageCompletion ?? 0;
  const barColor = completion >= 75 ? '#10b981' : completion >= 50 ? '#2563eb' : '#f59e0b';

  return (
    <div className="dashboard-panel rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm text-white">
            <DashboardIcon name="clipboard" className="h-4 w-4" />
          </div>
          <p className="text-sm font-semibold text-foreground truncate">{evaluation.title}</p>
        </div>
        <span className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full ${
          evaluation.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
        }`}>{evaluation.status}</span>
      </div>

      {loadingMetrics ? (
        <div className="grid grid-cols-3 gap-2">
          {[1,2,3].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}
        </div>
      ) : metrics ? (
        <>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Responses', value: metrics.totalResponses },
              { label: 'Answers',   value: metrics.totalAnswers },
              { label: 'Completion',value: `${metrics.averageCompletion}%` },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-center">
                <p className="text-base font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, metrics.averageCompletion)}%`, backgroundColor: barColor }}
            />
          </div>
        </>
      ) : (
        <p className="text-xs text-muted">No response data yet.</p>
      )}
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
    const evaluationIds = new Set(companyEvaluations.map((evaluation) => evaluation.id));
    return gapSummaries.filter((gap) => evaluationIds.has(gap.evaluation.id));
  }, [companyEvaluations, gapSummaries]);

  const completionDistribution = useMemo<ChartDataPoint[]>(() => {
    const buckets = [
      { name: '0-25%', min: 0, max: 25, value: 0 },
      { name: '26-50%', min: 26, max: 50, value: 0 },
      { name: '51-75%', min: 51, max: 75, value: 0 },
      { name: '76-100%', min: 76, max: 100, value: 0 },
    ];

    for (const response of companyResponses) {
      const bucket = buckets.find((bucketItem) => response.completionPercentage >= bucketItem.min && response.completionPercentage <= bucketItem.max);
      if (bucket) bucket.value += 1;
    }

    return buckets.map(({ name, value }) => ({ name, value }));
  }, [companyResponses]);

  const evaluationResponseCounts = useMemo<ChartDataPoint[]>(() => {
    const counts: Record<string, number> = {};
    const titles: Record<string, string> = {};
    const titleMap = Object.fromEntries(companyEvaluations.map((evaluation) => [evaluation.id, evaluation.title]));

    companyResponses.forEach((response) => {
      const evaluationId = response.form.evaluation?.id;
      if (!evaluationId) return;
      counts[evaluationId] = (counts[evaluationId] || 0) + 1;
      if (!titles[evaluationId]) {
        titles[evaluationId] = titleMap[evaluationId] || `Evaluation ${evaluationId.slice(0, 6)}`;
      }
    });

    return Object.entries(counts)
      .map(([id, value]) => ({ name: titles[id] || `Evaluation ${id.slice(0, 6)}`, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [companyResponses, companyEvaluations]);

  const projectStatusData = useMemo<ChartDataPoint[]>(() => {
    const counts: Record<string, number> = {};
    companyEvaluations.forEach((evaluation) => {
      counts[evaluation.status || 'UNKNOWN'] = (counts[evaluation.status || 'UNKNOWN'] || 0) + 1;
    });
    const entries = Object.entries(counts).map(([name, value]) => ({ name, value }));
    return entries.length > 0 ? entries : [{ name: 'No projects', value: 0 }];
  }, [companyEvaluations]);

  const workspaceSummaryData = useMemo<ChartDataPoint[]>(
    () => [
      { name: 'Projects', value: companyEvaluations.length },
      { name: 'Responses', value: companyResponses.length },
      { name: 'Reports', value: publishedAnalyses.length },
      { name: 'Gaps', value: companyGaps.length },
    ],
    [companyEvaluations.length, companyGaps.length, companyResponses.length, publishedAnalyses.length],
  );

  const primaryChartData = completionDistribution.some((item) => item.value > 0)
    ? completionDistribution
    : projectStatusData;
  const primaryChartTitle = completionDistribution.some((item) => item.value > 0)
    ? 'Completion distribution'
    : 'Project status';
  const secondaryChartData = evaluationResponseCounts.length > 0
    ? evaluationResponseCounts
    : workspaceSummaryData;
  const secondaryChartTitle = evaluationResponseCounts.length > 0
    ? 'Top evaluations'
    : 'Workspace overview';

  const totalResponses = companyResponses.length;
  const totalAnswers = companyResponses.reduce((sum, response) => sum + Math.round((response.completionPercentage * response.questionCount) / 100), 0);
  const averageCompletion = companyResponses.length > 0
    ? Math.round(companyResponses.reduce((sum, response) => sum + response.completionPercentage, 0) / companyResponses.length)
    : 0;
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
    <div className={`${mounted ? 'animate-fade-in' : ''} mx-auto max-w-screen-2xl space-y-6`}>
      {/* ── Header ── */}
      <div className="dashboard-card-dark rounded-2xl p-6 text-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">Client Admin Dashboard</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-[11px] font-semibold text-teal-700 ring-1 ring-teal-200">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-300 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-300" />
                </span>
                Live
              </span>
            </div>
            <p className="text-sm text-slate-500">Live evaluation metrics and your latest published GISKonsult insight.</p>
          </div>
          {userOrg && (
            <div className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm">
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-success" />
              <span className="font-bold">Organisation:</span>
              <span className="text-slate-500">{userOrg.name}</span>
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
          {/* ── Stat cards — 2 cols on mobile, 4 on xl ── */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard label="Responses" value={totalResponses} icon={<DashboardIcon name="check" />} color="blue" delay={0} />
            <StatCard label="Total answers" value={totalAnswers} icon={<DashboardIcon name="edit" />} color="green" delay={50} />
            <StatCard label="Avg completion" value={`${averageCompletion}%`} icon={<DashboardIcon name="chart" />} color="yellow" delay={100} />
            <StatCard label="Reports" value={publishedAnalyses.length} icon={<DashboardIcon name="report" />} color="slate" delay={150} />
          </div>


  {/* ── Only show charts if there is real data ── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="dashboard-panel rounded-2xl p-5">
              <div className="flex items-center justify-between gap-4 mb-4">
                <p className="text-sm font-semibold text-foreground">{primaryChartTitle}</p>
                <span className="text-xs uppercase tracking-[0.24em] text-muted">Live</span>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={primaryChartData} margin={{ top: 8, right: 8, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: '#475569', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12 }} />
                    <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="dashboard-panel rounded-2xl p-5">
              <div className="flex items-center justify-between gap-4 mb-4">
                <p className="text-sm font-semibold text-foreground">{secondaryChartTitle}</p>
                <span className="text-xs uppercase tracking-[0.24em] text-muted">Latest</span>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={secondaryChartData} margin={{ top: 8, right: 8, left: -10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-25} textAnchor="end" height={55} />
                    <YAxis allowDecimals={false} tick={{ fill: '#475569', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12 }} />
                    <Bar dataKey="value" fill="#16a34a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* ── Evaluation response stats per evaluation ── */}
          {companyEvaluations.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {companyEvaluations.slice(0, 4).map((ev) => (
                <EvaluationStatCard key={ev.id} evaluation={ev} />
              ))}
            </div>
          )}

        

          {selectedEvaluationForMetrics ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              Overall metrics from <span className="font-semibold text-slate-950">{selectedEvaluationForMetrics.title}</span>.
            </div>
          ) : null}

          {/* ── Latest published insight ── */}
          <div className="dashboard-panel rounded-2xl p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">Latest published insight</h2>
                <p className="text-sm text-muted mt-0.5">Your most recent GISKonsult analysis delivered by our team.</p>
              </div>
              <span className="text-2xl font-bold text-accent">{publishedAnalyses.length}</span>
            </div>
            {latestPublished ? (
              <LatestPublishedAnalysis published={latestPublished} evaluation={latestPublishedEvaluation} />
            ) : (
              <EmptyDashboard message="No published GISKonsult insights have been shared with your account yet." />
            )}
          </div>
        </>
      )}
    </div>
  );
}
