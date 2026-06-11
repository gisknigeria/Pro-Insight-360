'use client';

import { useState, useEffect } from 'react';
import { EmptyState } from '@/components/ui/empty-state';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dimension: string;
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  expectedBenefit: string;
  timeline?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  evaluation: { id: string; title: string };
}

const PRIORITY_CONFIG = {
  CRITICAL: { label: 'Critical', color: 'bg-red-100 text-red-700' },
  HIGH: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  MEDIUM: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  LOW: { label: 'Low', color: 'bg-amber-100 text-amber-800' },
};

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState<string>('ALL');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/recommendations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setRecommendations)
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filterPriority === 'ALL'
      ? recommendations
      : recommendations.filter((r) => r.priority === filterPriority);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Recommendations</h1>
        <p className="text-slate-500 mt-1 text-sm">
          GISKonsult-generated actionable recommendations to improve readiness.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((priority) => (
            <button
              key={priority}
              onClick={() => setFilterPriority(priority)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                filterPriority === priority
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {priority}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="💡"
          title="No recommendations yet"
          description="Recommendations will appear after GISKonsult analysis of your evaluation data."
          actionLabel="View Evaluations"
          onAction={() => (window.location.href = '/evaluations')}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((rec) => (
            <div key={rec.id} className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">{rec.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{rec.evaluation.title}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded font-medium ${PRIORITY_CONFIG[rec.priority].color}`}>
                  {PRIORITY_CONFIG[rec.priority].label}
                </span>
              </div>
              <p className="text-slate-700 mb-4">{rec.description}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 font-medium">Dimension</p>
                  <p className="text-slate-900">{rec.dimension}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Effort</p>
                  <p className="text-slate-900">{rec.effort}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Timeline</p>
                  <p className="text-slate-900">{rec.timeline || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Expected Benefit</p>
                  <p className="text-slate-900">{rec.expectedBenefit}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
