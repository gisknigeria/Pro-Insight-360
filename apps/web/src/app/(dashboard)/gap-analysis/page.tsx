'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GapAnalysisPanel } from '@/components/diagnosis/gap-analysis-panel';
import { isClientAdmin } from '@/lib/auth';
import { EmptyState } from '@/components/ui/empty-state';
import { useApi } from '@/lib/useApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type GapSeverity = 'critical' | 'high' | 'medium' | 'low';

interface Gap {
  id: string;
  category: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedDepartments: string[];
  recommendedAction: string;
  who?: string;
  how?: string;
  when?: string;
  evaluation: { id: string; title: string };
  createdAt: string;
}

interface GapSummaryItem extends Omit<Gap, 'severity'> {
  severity: GapSeverity;
}

interface GapSummary {
  total: number;
  bySeverity: Record<GapSeverity, number>;
  byCategory: Record<string, GapSummaryItem[]>;
  gaps: GapSummaryItem[];
}

const SEVERITY_CONFIG = {
  CRITICAL: { label: 'Critical', color: 'bg-red-100 text-red-700', icon: '🔴' },
  HIGH: { label: 'High', color: 'bg-orange-100 text-orange-700', icon: '🟠' },
  MEDIUM: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700', icon: '🟡' },
  LOW: { label: 'Low', color: 'bg-blue-100 text-blue-700', icon: '🔵' },
};

export default function GapAnalysisPage() {
  const router = useRouter();
  const gapsApi = useApi<Gap[]>('/gap-analysis');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  useEffect(() => {
    if (!isClientAdmin()) {
      router.replace('/dashboard');
    }
  }, [router]);

  const gaps = gapsApi.data ?? [];
  const filtered = useMemo(
    () => (filterSeverity === 'ALL' ? gaps : gaps.filter((g) => g.severity === filterSeverity)),
    [filterSeverity, gaps],
  );

  const severitySummary = useMemo(
    () => ({
      CRITICAL: gaps.filter((g) => g.severity === 'CRITICAL').length,
      HIGH: gaps.filter((g) => g.severity === 'HIGH').length,
      MEDIUM: gaps.filter((g) => g.severity === 'MEDIUM').length,
      LOW: gaps.filter((g) => g.severity === 'LOW').length,
    }),
    [gaps],
  );

  const categorySummary = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((gap) => {
      counts[gap.category] = (counts[gap.category] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([category, count]) => ({ category, count }));
  }, [filtered]);

  const severityChartData = useMemo(
    () => [
      { label: 'Critical', value: severitySummary.CRITICAL, color: '#ef4444' },
      { label: 'High', value: severitySummary.HIGH, color: '#f97316' },
      { label: 'Medium', value: severitySummary.MEDIUM, color: '#eab308' },
      { label: 'Low', value: severitySummary.LOW, color: '#2563eb' },
    ],
    [severitySummary],
  );

  const gapSummary = useMemo<GapSummary>(() => {
    const bySeverity: Record<GapSeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const byCategory: Record<string, GapSummaryItem[]> = {};

    filtered.forEach((gap) => {
      const severity = String(gap.severity || 'LOW').toLowerCase() as GapSeverity;
      if (severity in bySeverity) {
        bySeverity[severity] += 1;
      }

      const category = gap.category || 'Other';
      if (!byCategory[category]) {
        byCategory[category] = [];
      }

      byCategory[category].push({
        ...gap,
        severity,
      });
    });

    return {
      total: filtered.length,
      bySeverity,
      byCategory,
      gaps: filtered.map((gap) => ({
        ...gap,
        severity: String(gap.severity || 'LOW').toLowerCase() as GapSeverity,
      })),
    };
  }, [filtered]);

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gap Analysis</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Identify and track infrastructure, software, and capability gaps across your organisation.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            {filtered.length} gaps in view
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] mb-8">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Total gaps', value: gaps.length, icon: '📊' },
              { label: 'Critical', value: severitySummary.CRITICAL, icon: '🔴' },
              { label: 'High', value: severitySummary.HIGH, icon: '🟠' },
              { label: 'Medium', value: severitySummary.MEDIUM, icon: '🟡' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{stat.icon}</span>
                  <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                </div>
                <p className="text-3xl font-semibold text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Severity breakdown</h2>
                <p className="text-sm text-slate-500 mt-1">Compare severity counts across filtered gaps.</p>
              </div>
              <div className="text-sm font-medium text-slate-600">{filtered.length} filtered gaps</div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityChartData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="label" type="category" tick={{ fill: '#0f172a', fontSize: 12 }} width={90} />
                  <Tooltip cursor={{ fill: 'rgba(148,163,184,0.1)' }} />
                  <Bar dataKey="value" radius={[10, 10, 10, 10]} fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Top gap categories</h2>
                <p className="text-sm text-slate-500 mt-1">Most frequent categories for the selected gaps.</p>
              </div>
            </div>
            <div className="space-y-3">
              {categorySummary.length > 0 ? (
                categorySummary.map((category) => (
                  <div key={category.category} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-800">{category.category}</span>
                    <span className="text-sm font-semibold text-slate-900">{category.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No categories available for the selected filters.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Filter by severity</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((severity) => (
                <button
                  key={severity}
                  type="button"
                  onClick={() => setFilterSeverity(severity)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                    filterSeverity === severity
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  {severity}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Latest action plan details</h3>
            <p className="text-sm text-slate-500 mb-4">Action plan items from gap records appear below when available.</p>
            {filtered.some((gap) => gap.what || gap.who || gap.how || gap.when) ? (
              <div className="space-y-4">
                {filtered
                  .filter((gap) => gap.what || gap.who || gap.how || gap.when)
                  .map((gap) => (
                    <div key={gap.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">{gap.recommendedAction || gap.description}</p>
                      <div className="mt-3 text-sm text-slate-600 space-y-1">
                        {gap.what && <p><span className="font-semibold">What:</span> {gap.what}</p>}
                        {gap.who && <p><span className="font-semibold">Who:</span> {gap.who}</p>}
                        {gap.how && <p><span className="font-semibold">How:</span> {gap.how}</p>}
                        {gap.when && <p><span className="font-semibold">When:</span> {gap.when}</p>}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No detailed action plan fields were found in the current gaps.</p>
            )}
          </div>
        </div>
      </div>

      <div>
        {gapsApi.loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <GapAnalysisPanel summary={gapSummary} />
        )}
      </div>
    </div>
  );
}
