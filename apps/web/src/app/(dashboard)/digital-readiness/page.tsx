'use client';

import { useState, useEffect } from 'react';
import { EmptyState } from '@/components/ui/empty-state';

interface DigitalScore {
  id: string;
  evaluation: { id: string; title: string };
  score: number;
  band: 'INITIAL' | 'DEVELOPING' | 'DEFINED' | 'OPTIMISING';
  categories: Record<string, number>;
  createdAt: string;
}

const BAND_CONFIG = {
  INITIAL: { label: 'Initial', color: 'bg-red-100 text-red-700' },
  DEVELOPING: { label: 'Developing', color: 'bg-orange-100 text-orange-700' },
  DEFINED: { label: 'Defined', color: 'bg-yellow-100 text-yellow-700' },
  OPTIMISING: { label: 'Optimising', color: 'bg-green-100 text-green-700' },
};

const CATEGORIES = [
  'Strategy',
  'Governance',
  'Infrastructure',
  'Security',
  'Data Management',
  'Skills & Training',
  'Process Automation',
  'Customer Experience',
  'Innovation',
  'Partnership',
  'Investment',
  'Change Management',
  'Performance Monitoring',
  'Risk Management',
];

export default function DigitalReadinessPage() {
  const [scores, setScores] = useState<DigitalScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/digital-readiness`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setScores)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Digital Readiness Assessment</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Evaluate digital maturity across 14 organizational categories.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Assessments', value: scores.length, icon: '📊' },
          { label: 'Optimising', value: scores.filter((s) => s.band === 'OPTIMISING').length, icon: '⭐' },
          { label: 'Defined', value: scores.filter((s) => s.band === 'DEFINED').length, icon: '✓' },
          { label: 'Initial', value: scores.filter((s) => s.band === 'INITIAL').length, icon: '🔴' },
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

      {/* Scores */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : scores.length === 0 ? (
        <EmptyState
          icon="💻"
          title="No digital readiness assessments yet"
          description="Complete digital readiness assessments in evaluations to see results here."
          actionLabel="View Evaluations"
          onAction={() => (window.location.href = '/evaluations')}
        />
      ) : (
        <div className="space-y-4">
          {scores.map((score) => (
            <div key={score.id} className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">{score.evaluation.title}</h3>
                </div>
                <span className={`text-sm font-medium px-3 py-1 rounded ${BAND_CONFIG[score.band].color}`}>
                  {BAND_CONFIG[score.band].label}
                </span>
              </div>

              {/* Overall Score */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-600">Overall Digital Readiness Score</p>
                  <p className="text-2xl font-bold text-slate-900">{score.score}/100</p>
                </div>
                <div className="bg-slate-200 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${score.score}%` }}></div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {CATEGORIES.map((cat) => (
                  <div key={cat} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-slate-600 truncate">{cat}</p>
                    <p className="text-lg font-bold text-slate-900">{score.categories[cat] || 0}/100</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
