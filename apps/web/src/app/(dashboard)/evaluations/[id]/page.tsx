'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';
import { apiFetch } from '@/lib/api';
import { diagnosisApiEndpoints, evaluationApiEndpoints } from '@/lib/apiEndpoints';

interface Diagnosis {
  id: string;
  evaluation: { id: string; title: string };
  status: 'PENDING_REVIEW' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  isAiGenerated: boolean;
  sections: {
    executiveSummary?: string;
    strengths?: string[];
    weaknesses?: string[];
    opportunities?: string[];
    recommendations?: string[];
    actionPlan?: { who: string; what: string; how: string; when: string }[];
  };
  approvedBy?: { name: string };
  generatedAt?: string;
}

const STATUS_CONFIG = {
  PENDING_REVIEW: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700' },
  IN_REVIEW: { label: 'In Review', color: 'bg-amber-100 text-amber-800' },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
} as const;

export default function EvaluationDetailPage() {
  const params = useParams();
  const evaluationId = params?.id as string;
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewError, setReviewError] = useState('');

  async function loadDiagnosis() {
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch<{ diagnosis: Diagnosis | null }>(evaluationApiEndpoints.diagnosis(evaluationId));
      setDiagnosis(response.diagnosis);
    } catch (err: any) {
      setError(err?.message || 'Unable to load AI diagnosis.');
      setDiagnosis(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!evaluationId) return;
    loadDiagnosis();
  }, [evaluationId]);

  async function updateDiagnosisStatus(status: 'APPROVED' | 'REJECTED', rejectionReason?: string) {
    if (!diagnosis) return;
    setReviewMessage('');
    setReviewError('');
    setReviewLoading(true);

    try {
      await apiFetch(diagnosisApiEndpoints.status(diagnosis.id), {
        method: 'PATCH',
        body: JSON.stringify({ status, rejectionReason }),
      });
      await loadDiagnosis();
      setReviewMessage(`Diagnosis ${status.toLowerCase()} successfully.`);
    } catch (err: any) {
      setReviewError(err?.message || `Unable to ${status.toLowerCase()} diagnosis.`);
    } finally {
      setReviewLoading(false);
    }
  }

  function handleApprove() {
    updateDiagnosisStatus('APPROVED');
  }

  function handleReject() {
    const reason = window.prompt('Enter the rejection reason for this diagnosis:');
    if (!reason || !reason.trim()) {
      setReviewError('Rejection reason is required.');
      return;
    }
    updateDiagnosisStatus('REJECTED', reason.trim());
  }

  if (loading) {
    return <div className="text-slate-500 text-sm py-8 text-center">Loading AI diagnosis…</div>;
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="Diagnosis unavailable"
        description={error}
        actionLabel="Back to evaluations"
        onAction={() => (window.location.href = '/evaluations')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">GISKonsult Analysis</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review the live diagnosis generated for this evaluation and approve it once it matches the prompt output.
          </p>
        </div>
      
      </div>

      {!diagnosis ? (
        <EmptyState
          icon="📊"
          title="No analysis available yet"
          description="This evaluation does not have a GISKonsult analysis yet. It will appear here once our team has completed the assessment."
          actionLabel="Open diagnosis engine"
          onAction={() => (window.location.href = `/evaluations/${evaluationId}/diagnosis`)}
        />
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">{diagnosis.evaluation.title}</p>
                <p className="text-sm text-slate-600">This is the diagnosis attached to the current evaluation.</p>
                <p className="text-xs text-slate-500">
                  Updated {diagnosis.generatedAt ? new Date(diagnosis.generatedAt).toLocaleString() : 'Unknown'}
                </p>
              </div>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${STATUS_CONFIG[diagnosis.status].color}`}>
                {STATUS_CONFIG[diagnosis.status].label}
              </span>
            </div>

            {reviewMessage && (
              <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {reviewMessage}
              </div>
            )}
            {reviewError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {reviewError}
              </div>
            )}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Executive summary</h2>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {diagnosis.sections.executiveSummary || 'No summary available.'}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Strengths</h3>
                  {diagnosis.sections.strengths?.length ? (
                    <ul className="space-y-2 text-sm text-slate-700">
                      {diagnosis.sections.strengths.map((item, index) => (
                        <li key={index} className="flex gap-2"><span className="text-green-600">✓</span>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">No strengths provided.</p>
                  )}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Weaknesses</h3>
                  {diagnosis.sections.weaknesses?.length ? (
                    <ul className="space-y-2 text-sm text-slate-700">
                      {diagnosis.sections.weaknesses.map((item, index) => (
                        <li key={index} className="flex gap-2"><span className="text-orange-600">⚠️</span>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">No weaknesses provided.</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Opportunities</h3>
                  {diagnosis.sections.opportunities?.length ? (
                    <ul className="space-y-2 text-sm text-slate-700">
                      {diagnosis.sections.opportunities.map((item, index) => (
                        <li key={index} className="flex gap-2"><span className="text-primary">→</span>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">No opportunities provided.</p>
                  )}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Recommendations</h3>
                  {diagnosis.sections.recommendations?.length ? (
                    <ul className="space-y-2 text-sm text-slate-700">
                      {diagnosis.sections.recommendations.map((item, index) => (
                        <li key={index} className="flex gap-2"><span className="text-slate-500">•</span>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">No recommendations provided.</p>
                  )}
                </div>
              </div>

              {diagnosis.sections.actionPlan?.length ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Action plan</h3>
                  <div className="space-y-3 text-sm text-slate-700">
                    {diagnosis.sections.actionPlan.map((item, index) => (
                      <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="font-semibold text-slate-900">{item.what}</p>
                        <p className="text-slate-500 text-xs mt-1">Who: {item.who} • When: {item.when}</p>
                        <p className="mt-2 text-slate-700">How: {item.how}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Review controls</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Approve this AI diagnosis if it matches the prompt output, or reject it with a quick corrective reason.
                </p>
                {diagnosis.status === 'APPROVED' && diagnosis.approvedBy ? (
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    Approved by <span className="font-semibold text-slate-900">{diagnosis.approvedBy.name}</span>.
                  </div>
                ) : null}
                {(diagnosis.status === 'PENDING_REVIEW' || diagnosis.status === 'IN_REVIEW') ? (
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={reviewLoading}
                      className="w-full px-4 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:bg-green-300 disabled:cursor-not-allowed"
                    >
                      {reviewLoading ? 'Processing…' : 'Approve AI diagnosis'}
                    </button>
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={reviewLoading}
                      className="w-full px-4 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:bg-red-300 disabled:cursor-not-allowed"
                    >
                      {reviewLoading ? 'Processing…' : 'Reject diagnosis'}
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    This diagnosis is currently {STATUS_CONFIG[diagnosis.status].label.toLowerCase()}.
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Prompt-generated output</h3>
                <p className="text-sm text-slate-600">
                  The analysis shown here is the actual AI-generated content from the prompt you accepted. Approve it when it matches the evaluation results.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
