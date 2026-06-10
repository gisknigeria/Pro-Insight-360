'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GapAnalysisPanel } from '@/components/diagnosis/gap-analysis-panel';
import { isClientAdmin } from '@/lib/auth';
import { EmptyState } from '@/components/ui/empty-state';

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

const SEVERITY_CONFIG = {
  CRITICAL: { label: 'Critical', color: 'bg-red-100 text-red-700', icon: '🔴' },
  HIGH: { label: 'High', color: 'bg-orange-100 text-orange-700', icon: '🟠' },
  MEDIUM: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700', icon: '🟡' },
  LOW: { label: 'Low', color: 'bg-blue-100 text-blue-700', icon: '🔵' },
};

export default function GapAnalysisPage() {
  const router = useRouter();
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  useEffect(() => {
    if (!isClientAdmin()) {
      router.replace('/dashboard');
      return;
    }

    const token = localStorage.getItem('accessToken');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/gap-analysis`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setGaps)
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = useMemo(
    () => (filterSeverity === 'ALL' ? gaps : gaps.filter((g) => g.severity === filterSeverity)),
    [filterSeverity, gaps],
  );

  const gapSummary = useMemo(() => {
    const bySeverity = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    } as Record<'critical' | 'high' | 'medium' | 'low', number>;

    const byCategory: Record<string, Array<any>> = {};

    filtered.forEach((gap) => {
      const severity = String(gap.severity || 'LOW').toLowerCase() as 'critical' | 'high' | 'medium' | 'low';
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
      gaps: filtered.map((gap) => ({ ...gap, severity: String(gap.severity || 'LOW').toLowerCase() })),
    };
  }, [filtered]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Gap Analysis</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Identify and track infrastructure, software, and capability gaps.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Gaps', value: gaps.length, icon: '📊' },
          { label: 'Critical', value: gaps.filter((g) => g.severity === 'CRITICAL').length, icon: '🔴' },
          { label: 'High', value: gaps.filter((g) => g.severity === 'HIGH').length, icon: '🟠' },
          { label: 'Medium', value: gaps.filter((g) => g.severity === 'MEDIUM').length, icon: '🟡' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <p className="text-sm font-medium text-slate-600">{stat.label}</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((severity) => (
            <button
              key={severity}
              onClick={() => setFilterSeverity(severity)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                filterSeverity === severity
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {severity}
            </button>
          ))}
        </div>
      </div>

      {/* Gaps List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <GapAnalysisPanel summary={gapSummary} />
      )}
    </div>
  );
}
