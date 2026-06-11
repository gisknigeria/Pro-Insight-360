'use client';

import { useState, useEffect } from 'react';
import { EmptyState } from '@/components/ui/empty-state';

interface Response {
  id: string;
  form: { id: string; title: string };
  respondent: { id: string; name: string; email: string };
  status: 'DRAFT' | 'SUBMITTED' | 'PARTIAL';
  completionPercentage: number;
  submittedAt?: string;
  createdAt: string;
}

export default function ResponsesPage() {
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/responses`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setResponses)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterStatus === 'ALL' ? responses : responses.filter((r) => r.status === filterStatus);

  const stats = {
    total: responses.length,
    submitted: responses.filter((r) => r.status === 'SUBMITTED').length,
    partial: responses.filter((r) => r.status === 'PARTIAL').length,
    draft: responses.filter((r) => r.status === 'DRAFT').length,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Form Responses</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Track and manage respondent submissions across all forms.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Responses', value: stats.total, icon: '📋' },
          { label: 'Submitted', value: stats.submitted, icon: '✅' },
          { label: 'Partial', value: stats.partial, icon: '⏳' },
          { label: 'Draft', value: stats.draft, icon: '📝' },
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
          {['ALL', 'SUBMITTED', 'PARTIAL', 'DRAFT'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                filterStatus === status
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Responses Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📬"
          title="No responses yet"
          description="Responses will appear here as respondents submit forms."
          actionLabel="View Forms"
          onAction={() => (window.location.href = '/forms')}
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Form</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Respondent</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Completion</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Submitted</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((response) => (
                <tr key={response.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{response.form.title}</td>
                  <td className="px-6 py-4 text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{response.respondent.name}</p>
                      <p className="text-slate-600 text-xs">{response.respondent.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded font-medium ${
                        response.status === 'SUBMITTED'
                          ? 'bg-green-100 text-green-700'
                          : response.status === 'PARTIAL'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {response.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${response.completionPercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-slate-600">{response.completionPercentage}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {response.submittedAt ? new Date(response.submittedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary hover:text-blue-800 text-sm font-medium">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
