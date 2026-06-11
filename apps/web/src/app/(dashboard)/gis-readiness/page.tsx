'use client';

import { useState, useEffect } from 'react';
import { EmptyState } from '@/components/ui/empty-state';

interface GISScore {
  id: string;
  evaluation: { id: string; title: string };
  score: number;
  band: 'NASCENT' | 'EMERGING' | 'DEVELOPING' | 'ADVANCED';
  dimensions: {
    who: number;
    what: number;
    how: number;
    when: number;
  };
  champions: number;
  createdAt: string;
}

const BAND_CONFIG = {
  NASCENT: { label: 'Nascent', color: 'bg-red-100 text-red-700', icon: '🔴' },
  EMERGING: { label: 'Emerging', color: 'bg-orange-100 text-orange-700', icon: '🟠' },
  DEVELOPING: { label: 'Developing', color: 'bg-yellow-100 text-yellow-700', icon: '🟡' },
  ADVANCED: { label: 'Advanced', color: 'bg-green-100 text-green-700', icon: '🟢' },
};

export default function GISReadinessPage() {
  const [scores, setScores] = useState<GISScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/gis-readiness`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setScores)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">GIS Readiness Assessment</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Evaluate organizational GIS infrastructure, capabilities, and maturity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Assessments', value: scores.length, icon: '📊' },
          { label: 'Advanced', value: scores.filter((s) => s.band === 'ADVANCED').length, icon: '🟢' },
          { label: 'Developing', value: scores.filter((s) => s.band === 'DEVELOPING').length, icon: '🟡' },
          { label: 'Nascent', value: scores.filter((s) => s.band === 'NASCENT').length, icon: '🔴' },
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
          icon="🗺️"
          title="No GIS assessments yet"
          description="Complete GIS readiness assessments in evaluations to see results here."
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
                <span className={`flex items-center gap-2 text-sm font-medium px-3 py-1 rounded ${BAND_CONFIG[score.band].color}`}>
                  {BAND_CONFIG[score.band].icon} {BAND_CONFIG[score.band].label}
                </span>
              </div>

              {/* Overall Score */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-600">Overall GIS Readiness Score</p>
                  <p className="text-2xl font-bold text-slate-900">{score.score}/100</p>
                </div>
                <div className="bg-slate-200 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${score.score}%` }}></div>
                </div>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'WHO (People)', value: score.dimensions.who },
                  { label: 'WHAT (Data)', value: score.dimensions.what },
                  { label: 'HOW (Process)', value: score.dimensions.how },
                  { label: 'WHEN (Timeline)', value: score.dimensions.when },
                ].map((dim) => (
                  <div key={dim.label} className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-slate-600 mb-2">{dim.label}</p>
                    <p className="text-xl font-bold text-slate-900">{dim.value}/100</p>
                  </div>
                ))}
              </div>

              {/* GIS Champions */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-900">{score.champions}</span> GIS champions identified
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
