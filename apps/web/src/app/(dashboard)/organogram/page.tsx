'use client';

import { useState, useEffect } from 'react';
import { EmptyState } from '@/components/ui/empty-state';

interface Organogram {
  id: string;
  title: string;
  evaluation: { id: string; title: string };
  nodeCount: number;
  departmentCount: number;
  status: 'DRAFT' | 'PUBLISHED';
  cycleDetected: boolean;
  createdAt: string;
}

export default function OrganogramPage() {
  const [organograms, setOrganograms] = useState<Organogram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/organograms`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setOrganograms)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Organograms</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Visualize and analyze organizational hierarchies and reporting structures.
            </p>
          </div>
          <button
            type="button"
            onClick={() => (window.location.href = '/organogram/new')}
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark"
          >
            + Create Organogram
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Organograms', value: organograms.length, icon: '🏗️' },
          { label: 'With Issues', value: organograms.filter((o) => o.cycleDetected).length, icon: '⚠️' },
          { label: 'Published', value: organograms.filter((o) => o.status === 'PUBLISHED').length, icon: '✅' },
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

      {/* Organograms */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : organograms.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No organograms yet"
          description="Create an organogram to visualize your organization's structure."
          actionLabel="Create Organogram"
          onAction={() => (window.location.href = '/organogram/new')}
        />
      ) : (
        <div className="space-y-4">
          {organograms.map((org) => (
            <div key={org.id} className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition cursor-pointer">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">{org.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{org.evaluation.title}</p>
                </div>
                <div className="flex gap-2">
                  {org.cycleDetected && (
                    <span className="text-xs px-3 py-1 rounded font-medium bg-red-100 text-red-700">
                      ⚠️ Cycle Detected
                    </span>
                  )}
                  <span
                    className={`text-xs px-3 py-1 rounded font-medium ${
                      org.status === 'PUBLISHED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {org.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <p className="text-xs text-slate-600 font-medium">Total Positions</p>
                  <p className="text-lg font-bold text-slate-900">{org.nodeCount}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-medium">Departments</p>
                  <p className="text-lg font-bold text-slate-900">{org.departmentCount}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
