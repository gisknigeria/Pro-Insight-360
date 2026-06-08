'use client';

import { useState, useEffect } from 'react';
import { EmptyState } from '@/components/ui/empty-state';

interface Report {
  id: string;
  evaluation: { id: string; title: string };
  format: 'PDF' | 'DOCX' | 'XLSX';
  status: 'PENDING' | 'READY' | 'ERROR';
  sections: string[];
  createdAt: string;
  url?: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setReports)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Generate and download evaluation reports in PDF, DOCX, or XLSX format.
            </p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
            + Generate Report
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Reports', value: reports.length, icon: '📊' },
          { label: 'Ready to Download', value: reports.filter((r) => r.status === 'READY').length, icon: '✅' },
          { label: 'Generating', value: reports.filter((r) => r.status === 'PENDING').length, icon: '⏳' },
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

      {/* Reports List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon="📄"
          title="No reports yet"
          description="Generate your first report from an evaluation to view results and recommendations."
          actionLabel="Create Evaluation"
          onAction={() => (window.location.href = '/evaluations/new')}
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Evaluation</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Format</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Created</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{report.evaluation.title}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded font-medium">{report.format}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {report.status === 'READY' && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded">Ready</span>
                    )}
                    {report.status === 'PENDING' && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded">Generating...</span>
                    )}
                    {report.status === 'ERROR' && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded">Error</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{new Date(report.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    {report.status === 'READY' && (
                      <button className="text-blue-600 hover:text-blue-800 font-medium">Download</button>
                    )}
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
