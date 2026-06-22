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
import { AppIcon, type AppIconName } from '@/components/ui/app-icons';
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
    gaps?: string[];
    actionPlan?: Array<{ who?: string; what?: string; how?: string; when?: string }>;
    charts?: Array<{ title?: string; data?: Array<{ label?: string; name?: string; value?: number; count?: number }> }>;
    organogram?: { nodes?: Array<{ id?: string; label?: string; group?: string }>; links?: Array<{ source?: string; target?: string; relation?: string }> };
  };
}

type DashboardIconName = 'building' | 'form' | 'chart' | 'insight' | 'activity' | 'check' | 'edit' | 'report' | 'clipboard' | 'bot' | 'arrowRight';

function DashboardIcon({ name, className = 'h-5 w-5' }: { name: DashboardIconName; className?: string }) {
  const iconMap: Record<DashboardIconName, AppIconName> = {
    building: 'building',
    form: 'form',
    chart: 'chart',
    insight: 'info',
    activity: 'activity',
    check: 'check',
    edit: 'edit',
    report: 'file',
    clipboard: 'clipboard',
    bot: 'bot',
    arrowRight: 'chevronRight',
  };
  return <AppIcon name={iconMap[name]} className={className} />;
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
      className={`group relative overflow-hidden  bg-gradient-to-br ${cfg.bg} p-5 shadow-lg shadow-slate-950/15 ring-1 ${cfg.ring} transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl animate-fade-in-up`}
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

function parseAnalysisGap(gapText: string): { severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'; text: string } {
  const upper = gapText.toUpperCase();
  if (upper.startsWith('CRITICAL:') || upper.startsWith('CRITICAL -') || upper.startsWith('CRITICAL —')) {
    return { severity: 'CRITICAL', text: gapText.replace(/^CRITICAL[:\s—-]+/i, '').trim() };
  }
  if (upper.startsWith('HIGH:') || upper.startsWith('HIGH -') || upper.startsWith('HIGH —')) {
    return { severity: 'HIGH', text: gapText.replace(/^HIGH[:\s—-]+/i, '').trim() };
  }
  if (upper.startsWith('LOW:') || upper.startsWith('LOW -') || upper.startsWith('LOW —')) {
    return { severity: 'LOW', text: gapText.replace(/^LOW[:\s—-]+/i, '').trim() };
  }
  return {
    severity: upper.startsWith('MEDIUM') ? 'MEDIUM' : 'MEDIUM',
    text: gapText.replace(/^MEDIUM[:\s—-]+/i, '').trim(),
  };
}

function normalizeAnalysisChartData(chart: { data?: Array<{ label?: string; name?: string; value?: number; count?: number }> }) {
  return Array.isArray(chart.data)
    ? chart.data
      .map((row, index) => ({
        name: String(row.label ?? row.name ?? `Item ${index + 1}`),
        value: Number(row.value ?? row.count ?? 0),
      }))
      .filter((row) => Number.isFinite(row.value))
    : [];
}

function cleanChartTitle(title?: string) {
  return String(title || 'Supporting chart')
    .replace(/\s*\((?:0\s*[–-]\s*100|score\s*0\s*[–-]\s*100|scores?\s*0\s*[–-]\s*100)\)\s*/gi, '')
    .replace(/\s*0\s*[–-]\s*100\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
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
      {analysis?.charts?.length ? (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Supporting charts
          </h4>
          <div className="grid gap-4 xl:grid-cols-2">
            {analysis.charts.map((chart, chartIndex) => (
              <AnalysisChartCard key={chartIndex} chart={chart} />
            ))}
          </div>
        </div>
      ) : null}

      {analysis?.executiveSummary ? (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Executive summary
          </h3>
          <p className="line-clamp-3 text-sm leading-relaxed text-muted">{analysis.executiveSummary}</p>
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
              <AppIcon name="alert" className="h-4 w-4 text-orange-500" />
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

function LatestReportBriefChart({ published, evaluation }: { published: PublishedAnalysis; evaluation?: Evaluation }) {
  const analysis = published.analysis;
  const briefText = analysis?.executiveSummary || published.summary || 'Latest published report is available for review.';
  const metricData = [
    { name: 'Gaps', value: analysis?.gaps?.length ?? analysis?.weaknesses?.length ?? 0, fill: '#ef4444' },
    { name: 'Recommendations', value: analysis?.recommendations?.length ?? 0, fill: '#10b981' },
    { name: 'Charts', value: analysis?.charts?.length ?? 0, fill: '#2563eb' },
    { name: 'Actions', value: analysis?.actionPlan?.length ?? 0, fill: '#7c3aed' },
  ];
  const totalSignals = metricData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="bg-slate-950 p-5 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">Latest shared report</p>
        <h3 className="mt-3 text-lg font-black leading-tight text-white">{evaluation?.title || published.summary || 'Published insight'}</h3>
        <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-slate-200">{briefText}</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          {metricData.map((item) => (
            <div key={item.name} className="bg-white/10 p-3 ring-1 ring-white/10">
              <p className="text-xl font-black text-white">{item.value}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">{item.name}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-sm font-black text-slate-950">Report signal mix</p>
          <span className="bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-800 ring-1 ring-cyan-100">{totalSignals} signals</span>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={metricData} margin={{ top: 12, right: 14, left: -8, bottom: 14 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fill: '#475569', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="value" radius={[0, 0, 0, 0]}>
                {metricData.map((item) => <Cell key={item.name} fill={item.fill} />)}
              </Bar>
              <Line type="monotone" dataKey="value" stroke="#0f172a" strokeWidth={3} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function AnalysisChartCard({ chart }: { chart: { title?: string; data?: Array<{ label?: string; name?: string; value?: number; count?: number }>; }; }) {
  const chartData = normalizeAnalysisChartData(chart);

  return (
    <div className="rounded-xl border border-border bg-surface-muted p-4 min-w-0">
      <p className="font-semibold text-foreground mb-3">{cleanChartTitle(chart.title)}</p>
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

function OrganizationInsightCharts({
  publishedAnalyses,
  evaluations,
  completionDistribution,
  projectStatusData,
  workspaceSummaryData,
}: {
  publishedAnalyses: PublishedAnalysis[];
  evaluations: Evaluation[];
  completionDistribution: ChartDataPoint[];
  projectStatusData: ChartDataPoint[];
  workspaceSummaryData: ChartDataPoint[];
}) {
  const evaluationTitleById = useMemo(
    () => Object.fromEntries(evaluations.map((evaluation) => [evaluation.id, evaluation.title])),
    [evaluations],
  );

  const gapRows = useMemo(() => {
    return publishedAnalyses.flatMap((published) => {
      const reportName = published.evaluationId ? evaluationTitleById[published.evaluationId] : published.summary;
      return (published.analysis?.gaps ?? []).map((gap) => ({
        ...parseAnalysisGap(gap),
        report: reportName || published.summary || 'Published analysis',
        publishedAt: published.publishedAt,
      }));
    });
  }, [evaluationTitleById, publishedAnalyses]);

  const severityData = useMemo(() => {
    const counts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    gapRows.forEach((gap) => { counts[gap.severity] += 1; });
    return [
      { name: 'Critical', value: counts.CRITICAL, fill: '#dc2626' },
      { name: 'High', value: counts.HIGH, fill: '#f97316' },
      { name: 'Medium', value: counts.MEDIUM, fill: '#f59e0b' },
      { name: 'Low', value: counts.LOW, fill: '#10b981' },
    ];
  }, [gapRows]);

  const reportHealthData = useMemo(() => {
    return publishedAnalyses.map((published, index) => {
      const reportName = published.evaluationId ? evaluationTitleById[published.evaluationId] : published.summary;
      return {
        name: reportName ? (reportName.length > 18 ? `${reportName.slice(0, 18)}...` : reportName) : `Report ${index + 1}`,
        gaps: published.analysis?.gaps?.length ?? 0,
        recommendations: published.analysis?.recommendations?.length ?? 0,
        charts: published.analysis?.charts?.length ?? 0,
      };
    });
  }, [evaluationTitleById, publishedAnalyses]);

  const analysisCharts = useMemo(() => {
    return publishedAnalyses.flatMap((published, reportIndex) => {
      const reportName = published.evaluationId ? evaluationTitleById[published.evaluationId] : published.summary;
      return (published.analysis?.charts ?? []).map((chart, chartIndex) => ({
        chart,
        title: cleanChartTitle(chart.title || `${reportName || `Report ${reportIndex + 1}`} chart ${chartIndex + 1}`),
        reportName: reportName || published.summary || `Report ${reportIndex + 1}`,
      }));
    }).filter((item) => normalizeAnalysisChartData(item.chart).length > 0);
  }, [evaluationTitleById, publishedAnalyses]);

  const analysisShowcases: Array<{
    id: string;
    name: string;
    publishedAt: string;
    summary?: string;
    strengths: string[];
    gaps: string[];
    opportunities: string[];
    recommendations: string[];
    actionPlan: Array<{ who?: string; what?: string; how?: string; when?: string }>;
    chartCount: number;
  }> = [];

  if (publishedAnalyses.length === 0) {
    const completionHasData = completionDistribution.some((item) => item.value > 0);
    const radarData = [
      { subject: 'Projects', score: Math.min(100, evaluations.length * 20) },
      { subject: 'Responses', score: Math.min(100, workspaceSummaryData.find((item) => item.name === 'Responses')?.value ?? 0) },
      { subject: 'Completion', score: completionHasData ? completionDistribution.reduce((sum, item, index) => sum + item.value * [15, 40, 65, 90][index], 0) / Math.max(1, completionDistribution.reduce((sum, item) => sum + item.value, 0)) : 0 },
      { subject: 'Reports', score: 0 },
      { subject: 'Gaps known', score: 0 },
    ];

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_32px_rgba(15,23,42,0.08)]">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Company insight preview</h2>
            <p className="text-sm text-muted">No published analysis yet, so this uses available activity data to show what the company should watch.</p>
          </div>
          <Pill label="No analysis yet" color="amber" />
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="mb-1 text-sm font-bold text-slate-950">Readiness signal</h3>
            <p className="mb-4 text-xs text-slate-500">Estimated from projects, responses, and completion shape.</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius={82}>
                  <PolarGrid stroke="#cbd5e1" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Radar dataKey="score" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.24} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="mb-1 text-sm font-bold text-slate-950">Current operating picture</h3>
            <p className="mb-4 text-xs text-slate-500">What exists before formal GISKonsult analysis.</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={workspaceSummaryData} margin={{ top: 8, right: 12, left: -8, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#475569', fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="value" fill="#0f766e" radius={[6, 6, 0, 0]} />
                  <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={3} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="mb-1 text-sm font-bold text-slate-950">Completion shape</h3>
            <p className="mb-4 text-xs text-slate-500">Response depth available before analysis.</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={completionDistribution} margin={{ top: 8, right: 12, left: -8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#475569', fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12 }} />
                  <Area type="monotone" dataKey="value" stroke="#2563eb" fill="#93c5fd" fillOpacity={0.7} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ['Recommended next step', 'Complete at least one evaluation diagnosis so real gaps can replace the preview.'],
            ['Likely management focus', evaluations.length ? 'Compare project completion and response quality before publishing insight.' : 'Create an evaluation project and assign forms to begin data collection.'],
            ['What will improve', 'Once analysis is published, this section changes to gap severity, recommendations, and uploaded analysis charts.'],
          ].map(([label, text]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-800">{text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_32px_rgba(15,23,42,0.08)]">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Published insight charts</h2>
          <p className="text-sm text-muted">Visual summary of the latest GISKonsult findings shared with this organisation.</p>
        </div>
        <Pill label={`${publishedAnalyses.length} published`} color="green" />
      </div>

      <div className="order-4 mb-5 grid gap-4">
        {analysisShowcases.map((analysis) => (
          <div key={analysis.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                  Published {new Date(analysis.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <h3 className="mt-1 text-lg font-black text-slate-950">{analysis.name}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 ring-1 ring-red-100">{analysis.gaps.length} gaps</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">{analysis.recommendations.length} recommendations</span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">{analysis.chartCount} charts</span>
              </div>
            </div>

            {analysis.summary ? (
              <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Brief summary</p>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-800">{analysis.summary}</p>
              </div>
            ) : null}

            <div className="grid gap-3 xl:grid-cols-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-emerald-700">What looks strong</p>
                {analysis.strengths.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {analysis.strengths.map((item, index) => (
                      <li key={index} className="flex gap-2 text-sm leading-relaxed text-slate-800">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-600">Strengths will appear here when included in the analysis.</p>
                )}
              </div>

              <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-red-700">Gaps to address</p>
                {analysis.gaps.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {analysis.gaps.map((item, index) => {
                      const parsed = parseAnalysisGap(item);
                      return (
                        <li key={index} className="flex gap-2 text-sm leading-relaxed text-slate-800">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                          <span><strong className="text-red-700">{parsed.severity}:</strong> {parsed.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-600">No explicit gaps were included in this analysis.</p>
                )}
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-blue-700">Client actions</p>
                {analysis.recommendations.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {analysis.recommendations.map((item, index) => (
                      <li key={index} className="flex gap-2 text-sm leading-relaxed text-slate-800">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-600">Recommendations will appear here when included in the analysis.</p>
                )}
              </div>
            </div>

            {(analysis.opportunities.length > 0 || analysis.actionPlan.length > 0) && (
              <div className="mt-3 grid gap-3 xl:grid-cols-2">
                {analysis.opportunities.length > 0 && (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-amber-700">Opportunities</p>
                    <ul className="mt-3 space-y-2">
                      {analysis.opportunities.map((item, index) => (
                        <li key={index} className="flex gap-2 text-sm leading-relaxed text-slate-800">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.actionPlan.length > 0 && (
                  <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-violet-700">Action plan</p>
                    <div className="mt-3 space-y-2">
                      {analysis.actionPlan.map((item, index) => (
                        <div key={index} className="rounded-xl bg-white/70 p-3 text-sm text-slate-800 ring-1 ring-violet-100">
                          <p className="font-bold text-slate-950">{item.what || 'Action item'}</p>
                          <p className="mt-1 text-xs text-slate-600">Who: {item.who || 'TBD'} · When: {item.when || 'TBD'}</p>
                          {item.how ? <p className="mt-2 leading-relaxed">{item.how}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {analysisCharts.length > 0 && (
        <div className="order-1 mb-5 grid gap-4 xl:grid-cols-3">
          {analysisCharts.map((item, index) => {
            const data = normalizeAnalysisChartData(item.chart);
            const palette = ['#2563eb', '#10b981', '#f97316', '#7c3aed', '#dc2626', '#0891b2'];
            return (
              <div key={`${item.reportName}-${item.title}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-bold text-slate-950">{item.title}</p>
                <p className="mb-4 mt-1 text-xs text-slate-500">{item.reportName}</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    {index % 3 === 0 ? (
                      <BarChart data={data} margin={{ top: 8, right: 10, left: -12, bottom: 42 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} interval={0} angle={-24} textAnchor="end" height={60} />
                        <YAxis tick={{ fill: '#475569', fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12 }} />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {data.map((row, rowIndex) => <Cell key={row.name} fill={palette[rowIndex % palette.length]} />)}
                        </Bar>
                      </BarChart>
                    ) : index % 3 === 1 ? (
                      <AreaChart data={data} margin={{ top: 8, right: 10, left: -12, bottom: 42 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} interval={0} angle={-24} textAnchor="end" height={60} />
                        <YAxis tick={{ fill: '#475569', fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12 }} />
                        <Area type="monotone" dataKey="value" stroke="#0891b2" fill="#67e8f9" fillOpacity={0.72} />
                      </AreaChart>
                    ) : (
                      <PieChart>
                        <Pie data={data} dataKey="value" nameKey="name" outerRadius={82}>
                          {data.map((row, rowIndex) => <Cell key={row.name} fill={palette[rowIndex % palette.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12 }} />
                        <Legend iconType="square" wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="order-2 grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-1 text-sm font-bold text-slate-950">Gap severity</h3>
          <p className="mb-4 text-xs text-slate-500">Where the organisation needs attention across all reports.</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={severityData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={92} paddingAngle={2}>
                  {severityData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-1 text-sm font-bold text-slate-950">Report insight mix</h3>
          <p className="mb-4 text-xs text-slate-500">Gaps, recommendations, and supporting charts by published analysis.</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={reportHealthData} margin={{ top: 10, right: 14, left: -8, bottom: 46 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} interval={0} angle={-24} textAnchor="end" height={64} />
                <YAxis allowDecimals={false} tick={{ fill: '#475569', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="gaps" fill="#ef4444" radius={[6, 6, 0, 0]} />
                <Bar dataKey="recommendations" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Line type="monotone" dataKey="charts" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {gapRows.length > 0 ? (
        <div className="order-3 mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {gapRows.map((gap, index) => {
            const cfg = {
              CRITICAL: 'border-red-200 bg-red-50 text-red-700',
              HIGH: 'border-orange-200 bg-orange-50 text-orange-700',
              MEDIUM: 'border-amber-200 bg-amber-50 text-amber-700',
              LOW: 'border-emerald-200 bg-emerald-50 text-emerald-700',
            }[gap.severity];
            return (
              <div key={`${gap.report}-${index}`} className={`rounded-2xl border p-4 ${cfg}`}>
                <p className="text-[11px] font-black uppercase tracking-wider">{gap.severity}</p>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-900">{gap.text}</p>
                <p className="mt-3 truncate text-xs font-medium opacity-75">{gap.report}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="order-3 mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          No explicit gap list was included in the published analyses yet, but recommendations and charts are available below.
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

  const selectedOrgLatestReport = useMemo(() => {
    if (selectedOrgId === 'ALL') return null;
    return scopedReports
      .slice()
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())[0] || null;
  }, [scopedReports, selectedOrgId]);

  const selectedOrgLatestEvaluation = useMemo(() => {
    if (!selectedOrgLatestReport?.evaluationId) return undefined;
    return scopedEvaluations.find((evaluation) => evaluation.id === selectedOrgLatestReport.evaluationId);
  }, [scopedEvaluations, selectedOrgLatestReport]);

  const selectedOrgWorkspaceData = useMemo<ChartDataPoint[]>(() => [
    { name: 'Projects', value: selectedSummary.evaluations },
    { name: 'Responses', value: selectedSummary.responses },
    { name: 'Forms', value: selectedSummary.forms },
    { name: 'Reports', value: selectedSummary.reports },
  ], [selectedSummary]);

  const selectedOrgOperatingData = useMemo<ChartDataPoint[]>(() => [
    { name: 'Users', value: selectedSummary.users },
    { name: 'Forms', value: selectedSummary.forms },
    { name: 'Questions', value: selectedSummary.questionBank },
    { name: 'Answers', value: selectedSummary.answers },
    { name: 'Active projects', value: selectedSummary.activeEvaluations },
  ], [selectedSummary]);

  const leaderRows = selectedOrgId === 'ALL'
    ? orgSummaries.slice(0, 6)
    : orgSummaries.filter((summary) => summary.id === selectedOrgId);
  const pieColors = ['#0f766e', '#2563eb', '#f97316', '#7c3aed', '#dc2626', '#0891b2'];
  const viewLabel = selectedOrgId === 'ALL' ? 'General overview' : selectedSummary.name;

  return (
    <div className="space-y-5">
      <div className="border border-slate-900 bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/10">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Super Admin</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Executive Dashboard</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
Centralised platform for managing client organisations, form rollouts, diagnostic workflows, implementation tracking, and governance reporting            </p>
          </div>
          <label className="min-w-[280px] text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            Dashboard scope
            <select
              value={selectedOrgId}
              onChange={(event) => setSelectedOrgId(event.target.value)}
              className="mt-2 w-full border border-slate-500 bg-white px-3 py-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-cyan-300"
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
        <StatCard label="Organisations" value={loadingStats ? '...' : selectedOrgId === 'ALL' ? orgSummaries.length : 1} icon={<DashboardIcon name="building" />} color="blue" delay={0} />
        <StatCard label="Unique Respondents" value={loadingStats ? '...' : selectedSummary.responses} icon={<DashboardIcon name="check" />} color="green" delay={50} />
        <StatCard label="Avg Response Rate" value={loadingStats ? '...' : `${selectedSummary.averageCompletion}%`} icon={<DashboardIcon name="chart" />} color="yellow" delay={100} />
        <StatCard label="Reports" value={loadingStats ? '...' : selectedSummary.reports} icon={<DashboardIcon name="insight" />} color="slate" delay={150} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="border border-slate-300 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.08)]">
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

        <div className="border border-slate-300 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.08)]">
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
        <div className="border border-slate-300 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.08)]">
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

        <div className="border border-slate-300 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.08)]">
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

        <div className="border border-slate-300 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.08)]">
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
        <div className="border border-slate-300 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.08)]">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-950">
                {selectedOrgId === 'ALL' ? 'Organisation comparison' : 'Selected organisation operating mix'}
              </h2>
              <p className="text-xs text-slate-500">
                {selectedOrgId === 'ALL'
                  ? 'Which clients are generating responses, projects, and stronger completion.'
                  : 'How people, forms, questions, answers, and active work stack up for this organisation.'}
              </p>
            </div>
            <Pill label={selectedOrgId === 'ALL' ? 'Ranked' : 'Operating mix'} color="blue" />
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
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={selectedOrgOperatingData} margin={{ top: 12, right: 16, left: -8, bottom: 45 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={62} />
                  <YAxis allowDecimals={false} tick={{ fill: '#475569', fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 0, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="value" name="Count" radius={[0, 0, 0, 0]}>
                    {selectedOrgOperatingData.map((entry, index) => (
                      <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Bar>
                  <Line type="monotone" dataKey="value" name="Signal" stroke="#dc2626" strokeWidth={3} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="border border-slate-300 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.08)]">
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

      <div className="grid gap-4">
        <div className="border border-slate-300 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.08)]">
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
      </div>

      {selectedOrgId !== 'ALL' && (
        <div className="space-y-4">
          <OrganizationInsightCharts
            publishedAnalyses={scopedReports}
            evaluations={scopedEvaluations}
            completionDistribution={completionDistribution}
            projectStatusData={statusData}
            workspaceSummaryData={selectedOrgWorkspaceData}
          />

          <div className="border border-slate-300 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-700">Selected organisation analysis</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">Latest published analysis for {selectedSummary.name}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Super admin preview of what this organisation will see: professional summary, gaps, recommendations, action plan, and every chart published in the analysis.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Pill label={`${scopedReports.length} published`} color={scopedReports.length > 0 ? 'green' : 'amber'} />
                <Pill label={selectedSummary.completionLabel} color="blue" />
              </div>
            </div>

            {selectedOrgLatestReport ? (
              <LatestPublishedAnalysis published={selectedOrgLatestReport} evaluation={selectedOrgLatestEvaluation} />
            ) : (
              <div className="border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <DashboardIcon name="chart" className="mx-auto h-9 w-9 text-slate-500" />
                <p className="mt-3 text-sm font-bold text-slate-900">No published analysis for this organisation yet.</p>
                <p className="mt-1 text-sm text-slate-500">The insight charts above use live organization data until a published analysis is available.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4">
        <div className="border border-slate-300 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.08)]">
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_32px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-lg">
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

  const filteredPublishedAnalyses = useMemo(() => {
    return publishedAnalyses
      .filter((analysis) => analysis.evaluationId && companyEvaluations.some((evaluation) => evaluation.id === analysis.evaluationId))
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }, [companyEvaluations, publishedAnalyses]);

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
      { name: 'Reports', value: filteredPublishedAnalyses.length },
      { name: 'Gaps', value: companyGaps.length },
    ],
    [companyEvaluations.length, companyGaps.length, companyResponses.length, filteredPublishedAnalyses.length],
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
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 text-slate-900 shadow-[0_14px_32px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
                          <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Client Admin</p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-950">Organisation Dashboard</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-[11px] font-semibold text-teal-700 ring-1 ring-teal-200">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-300 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-300" />
                </span>
                Live
              </span>
            </div>
            <p className="text-sm text-slate-500">Executive view of response activity, readiness signals, priority gaps, and published GISKonsult findings.</p>
          </div>
          {userOrg && (
            <div className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm">
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-success" />
              <span className="font-bold">Current organisation</span>
              <span className="text-slate-500">{userOrg.name}</span>
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200/50 bg-gradient-to-r from-red-50 to-red-100/50 p-5 text-sm text-red-700 mb-6 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <AppIcon name="alert" className="h-5 w-5" />
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
            <StatCard label="Reports" value={filteredPublishedAnalyses.length} icon={<DashboardIcon name="report" />} color="slate" delay={150} />
          </div>


  {/* ── Only show charts if there is real data ── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.08)]">
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

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.08)]">
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
          
        

        

         

          <OrganizationInsightCharts
            publishedAnalyses={filteredPublishedAnalyses}
            evaluations={companyEvaluations}
            completionDistribution={completionDistribution}
            projectStatusData={projectStatusData}
            workspaceSummaryData={workspaceSummaryData}
          />

          {/* ── Latest published insight ── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_32px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">Latest report brief</h2>
                <p className="text-sm text-muted mt-0.5">A short executive note. The decision charts are shown above.</p>
              </div>
              <span className="text-2xl font-bold text-accent">{filteredPublishedAnalyses.length}</span>
            </div>
            {latestPublished ? (
              <LatestReportBriefChart published={latestPublished} evaluation={latestPublishedEvaluation} />
            ) : (
              <EmptyDashboard message="No published GISKonsult insights have been shared with your account yet." />
            )}
          </div>
        </>
      )}
    </div>
  );
}
