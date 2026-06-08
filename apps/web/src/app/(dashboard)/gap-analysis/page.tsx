'use client';

import { useState, useEffect } from 'react';
import { EmptyState } from '@/components/ui/empty-state';

interface Gap {
  id: string;
  category: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedDepartments: string[];
  recommendedAction: string;
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
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/gap-analysis`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setGaps)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterSeverity === 'ALL' ? gaps : gaps.filter((g) => g.severity === filterSeverity);

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
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No gaps identified"
          description="Gaps will appear after evaluation analysis is complete."
          actionLabel="View Evaluations"
          onAction={() => (window.location.href = '/evaluations')}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((gap) => (
            <div key={gap.id} className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">{gap.category}</h3>
                  <p className="text-sm text-slate-600 mt-1">{gap.evaluation.title}</p>
                </div>
                <span className={`flex items-center gap-2 text-sm font-medium px-3 py-1 rounded ${SEVERITY_CONFIG[gap.severity].color}`}>
                  {SEVERITY_CONFIG[gap.severity].icon} {SEVERITY_CONFIG[gap.severity].label}
                </span>
              </div>
              <p className="text-slate-700 mb-4">{gap.description}</p>
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-slate-900 mb-2">Recommended Action</p>
                <p className="text-sm text-slate-700">{gap.recommendedAction}</p>
              </div>
              {gap.affectedDepartments.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-900 mb-2">Affected Departments</p>
                  <div className="flex flex-wrap gap-2">
                    {gap.affectedDepartments.map((dept) => (
                      <span key={dept} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                        {dept}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
