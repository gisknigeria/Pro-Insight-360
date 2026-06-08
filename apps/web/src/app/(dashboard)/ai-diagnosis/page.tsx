'use client';

import { useState, useEffect } from 'react';
import { EmptyState } from '@/components/ui/empty-state';

interface Diagnosis {
  id: string;
  evaluation: { id: string; title: string };
  status: 'PENDING_REVIEW' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  isAiGenerated: boolean;
  sections: {
    executiveSummary: string;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    recommendations: string[];
  };
  approvedBy?: { name: string };
  createdAt: string;
}

const STATUS_CONFIG = {
  PENDING_REVIEW: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700', icon: '⏳' },
  IN_REVIEW: { label: 'In Review', color: 'bg-blue-100 text-blue-700', icon: '👀' },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: '✅' },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: '❌' },
};

export default function AIDiagnosisPage() {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/diagnoses`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setDiagnoses)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">AI Diagnosis & Analysis</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Review AI-generated organizational insights and consultant analysis.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Diagnoses', value: diagnoses.length, icon: '📊' },
          { label: 'Pending Review', value: diagnoses.filter((d) => d.status === 'PENDING_REVIEW').length, icon: '⏳' },
          { label: 'Approved', value: diagnoses.filter((d) => d.status === 'APPROVED').length, icon: '✅' },
          { label: 'AI Generated', value: diagnoses.filter((d) => d.isAiGenerated).length, icon: '🤖' },
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

      {/* Diagnoses */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : diagnoses.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No diagnoses yet"
          description="AI diagnoses will be generated once evaluation responses are collected and analyzed."
          actionLabel="View Evaluations"
          onAction={() => (window.location.href = '/evaluations')}
        />
      ) : (
        <div className="space-y-4">
          {diagnoses.map((diagnosis) => (
            <div key={diagnosis.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div
                className="p-6 cursor-pointer hover:bg-slate-50 transition flex justify-between items-start"
                onClick={() => setExpandedId(expandedId === diagnosis.id ? null : diagnosis.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900 text-lg">{diagnosis.evaluation.title}</h3>
                    {diagnosis.isAiGenerated && (
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium">
                        🤖 AI Generated
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">Created {new Date(diagnosis.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium px-3 py-1 rounded flex items-center gap-2 ${STATUS_CONFIG[diagnosis.status].color}`}>
                    {STATUS_CONFIG[diagnosis.status].icon} {STATUS_CONFIG[diagnosis.status].label}
                  </span>
                  <button className="text-slate-400 hover:text-slate-600">
                    {expandedId === diagnosis.id ? '▼' : '▶'}
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === diagnosis.id && (
                <div className="border-t border-slate-200 bg-slate-50 p-6 space-y-6">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Executive Summary</h4>
                    <p className="text-slate-700 text-sm">{diagnosis.sections.executiveSummary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-green-700 mb-2">💪 Strengths</h4>
                      <ul className="space-y-2">
                        {diagnosis.sections.strengths.map((item, idx) => (
                          <li key={idx} className="text-sm text-slate-700 flex gap-2">
                            <span className="text-green-600">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-orange-700 mb-2">⚠️ Weaknesses</h4>
                      <ul className="space-y-2">
                        {diagnosis.sections.weaknesses.map((item, idx) => (
                          <li key={idx} className="text-sm text-slate-700 flex gap-2">
                            <span className="text-orange-600">!</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">💡 Opportunities</h4>
                    <ul className="space-y-2">
                      {diagnosis.sections.opportunities.map((item, idx) => (
                        <li key={idx} className="text-sm text-slate-700 flex gap-2">
                          <span className="text-blue-600">→</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex justify-between items-center">
                      <div>
                        {diagnosis.status === 'APPROVED' && diagnosis.approvedBy && (
                          <p className="text-sm text-slate-600">Approved by <span className="font-medium">{diagnosis.approvedBy.name}</span></p>
                        )}
                      </div>
                      {diagnosis.status === 'PENDING_REVIEW' && (
                        <div className="flex gap-2">
                          <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                            Reject
                          </button>
                          <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                            Approve
                          </button>
                        </div>
                      )}
                    </div>
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
