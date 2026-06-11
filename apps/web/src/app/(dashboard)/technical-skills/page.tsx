'use client';

import { useState, useEffect } from 'react';
import { EmptyState } from '@/components/ui/empty-state';

interface SkillsAssessment {
  id: string;
  evaluation: { id: string; title: string };
  department: string;
  averageSkillLevel: number;
  trainingNeedsIndex: number;
  skillBreakdown: Record<string, { count: number; level: 'NONE' | 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' }[]>;
  champions: number;
  createdAt: string;
}

const SKILL_LEVELS = {
  NONE: { label: 'None', color: 'bg-red-100 text-red-700', value: 0 },
  BASIC: { label: 'Basic', color: 'bg-orange-100 text-orange-700', value: 1 },
  INTERMEDIATE: { label: 'Intermediate', color: 'bg-yellow-100 text-yellow-700', value: 2 },
  ADVANCED: { label: 'Advanced', color: 'bg-amber-100 text-amber-800', value: 3 },
  EXPERT: { label: 'Expert', color: 'bg-green-100 text-green-700', value: 4 },
};

export default function TechnicalSkillsPage() {
  const [assessments, setAssessments] = useState<SkillsAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/technical-skills`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setAssessments)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Technical Skills Assessment</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Identify skill gaps and training needs across the organization.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Assessments', value: assessments.length, icon: '📊' },
          { label: 'GIS Champions', value: assessments.reduce((sum, a) => sum + a.champions, 0), icon: '👑' },
          { label: 'Avg Training Needs', value: assessments.length > 0 ? Math.round(assessments.reduce((sum, a) => sum + a.trainingNeedsIndex, 0) / assessments.length) : 0, icon: '📚' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <p className="text-sm font-medium text-slate-600">{stat.label}</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{typeof stat.value === 'number' ? stat.value + (stat.label === 'Avg Training Needs' ? '%' : '') : stat.value}</p>
          </div>
        ))}
      </div>

      {/* Assessments */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : assessments.length === 0 ? (
        <EmptyState
          icon="🎓"
          title="No technical skills assessments yet"
          description="Complete skills assessments in evaluations to identify training needs."
          actionLabel="View Evaluations"
          onAction={() => (window.location.href = '/evaluations')}
        />
      ) : (
        <div className="space-y-4">
          {assessments.map((assessment) => (
            <div key={assessment.id} className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900 text-lg">{assessment.evaluation.title}</h3>
                <p className="text-sm text-slate-600 mt-1">Department: {assessment.department}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-slate-600 mb-1">Average Skill Level</p>
                  <p className="text-2xl font-bold text-slate-900">{assessment.averageSkillLevel.toFixed(1)}/4.0</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-slate-600 mb-1">Training Needs Index</p>
                  <p className="text-2xl font-bold text-slate-900">{assessment.trainingNeedsIndex}%</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-slate-600 mb-1">GIS Champions</p>
                  <p className="text-2xl font-bold text-slate-900">{assessment.champions}</p>
                </div>
              </div>

              {/* Skill Distribution */}
              <div>
                <p className="text-sm font-medium text-slate-900 mb-3">Skill Distribution</p>
                <div className="space-y-2">
                  {Object.entries(SKILL_LEVELS).map(([level, config]) => {
                    const count = assessment.skillBreakdown[level]?.length || 0;
                    const total = Object.values(assessment.skillBreakdown).reduce((sum, arr) => sum + arr.length, 0) || 1;
                    const percentage = (count / total) * 100;
                    return (
                      <div key={level} className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-600 w-20">{config.label}</span>
                        <div className="flex-1 bg-slate-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${config.color}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-slate-600 w-12 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
