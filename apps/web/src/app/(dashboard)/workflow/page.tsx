'use client';

import { useState, useEffect } from 'react';
import { EmptyState } from '@/components/ui/empty-state';

interface Workflow {
  id: string;
  title: string;
  description?: string;
  evaluation: { id: string; title: string };
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
  nodeCount: number;
  inefficientNodes: number;
  improvementSavings?: string;
  createdAt: string;
}

export default function WorkflowPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/workflow-maps`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setWorkflows)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Workflow Maps</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Design, analyze, and optimize organizational workflows and processes.
            </p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
            + Create Workflow
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Workflows', value: workflows.length, icon: '📊' },
          { label: 'With Inefficiencies', value: workflows.filter((w) => w.inefficientNodes > 0).length, icon: '⚠️' },
          { label: 'Completed', value: workflows.filter((w) => w.status === 'COMPLETED').length, icon: '✅' },
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

      {/* Workflows */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : workflows.length === 0 ? (
        <EmptyState
          icon="🔄"
          title="No workflow maps yet"
          description="Create workflow maps to visualize and optimize organizational processes."
          actionLabel="Create Workflow"
          onAction={() => (window.location.href = '/workflow/new')}
        />
      ) : (
        <div className="space-y-4">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition cursor-pointer">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">{workflow.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{workflow.evaluation.title}</p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded font-medium ${
                    workflow.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-700'
                      : workflow.status === 'ACTIVE'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {workflow.status}
                </span>
              </div>
              {workflow.description && (
                <p className="text-sm text-slate-600 mb-4">{workflow.description}</p>
              )}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <p className="text-xs text-slate-600 font-medium">Process Steps</p>
                  <p className="text-lg font-bold text-slate-900">{workflow.nodeCount}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-medium">Inefficiencies</p>
                  <p className={`text-lg font-bold ${
                    workflow.inefficientNodes > 0 ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {workflow.inefficientNodes}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-medium">Est. Savings</p>
                  <p className="text-lg font-bold text-slate-900">{workflow.improvementSavings || '—'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
