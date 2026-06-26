'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/ui/empty-state';
import { apiFetch } from '@/lib/api';

interface Department {
  id: string;
  name: string;
  description?: string;
  organisation: { id: string; name: string };
  headOfDepartment?: { name: string; email: string };
  staffCount: number;
  evaluationProgress: number;
  digitalReadinessScore?: number;
  gisReadinessScore?: number;
  createdAt: string;
}

export default function DepartmentsPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiFetch<Department[]>('/departments')
      .then((data) => {
        if (!active) return;
        setDepartments(Array.isArray(data) ? data : []);
        setError('');
      })
      .catch((err) => {
        if (!active) return;
        setDepartments([]);
        setError(err instanceof Error ? err.message : 'Unable to load departments.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Departments & Units</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Track departmental readiness and assessment progress.
            </p>
          </div>
          <Link
            href="/departments/new"
            className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark"
          >
            + Add Department
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Departments', value: departments.length, icon: '🏢' },
          { label: 'Total Staff', value: departments.reduce((sum, d) => sum + d.staffCount, 0), icon: '👥' },
          { label: 'Avg Progress', value: departments.length > 0 ? Math.round(departments.reduce((sum, d) => sum + d.evaluationProgress, 0) / departments.length) + '%' : '0%', icon: '📊' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <p className="text-sm font-medium text-slate-600">{stat.label}</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{typeof stat.value === 'number' && stat.label !== 'Avg Progress' ? stat.value : stat.value}</p>
          </div>
        ))}
      </div>

      {/* Departments Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      ) : departments.length === 0 ? (
        <EmptyState
          icon="🏢"
          title="No departments yet"
          description="Add departments to track organizational units and their readiness assessments."
          actionLabel="Add Department"
          onAction={() => router.push('/departments/new')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div key={dept.id} className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900 text-lg">{dept.name}</h3>
                <p className="text-xs text-slate-600 mt-1">{dept.organisation.name}</p>
              </div>

              {dept.description && (
                <p className="text-sm text-slate-600 mb-4">{dept.description}</p>
              )}

              {/* Scores */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                {dept.digitalReadinessScore !== undefined && (
                  <div className="bg-slate-50 rounded p-2">
                    <p className="text-xs text-slate-600 font-medium">Digital</p>
                    <p className="text-lg font-bold text-slate-900">{dept.digitalReadinessScore}/100</p>
                  </div>
                )}
                {dept.gisReadinessScore !== undefined && (
                  <div className="bg-slate-50 rounded p-2">
                    <p className="text-xs text-slate-600 font-medium">GIS</p>
                    <p className="text-lg font-bold text-slate-900">{dept.gisReadinessScore}/100</p>
                  </div>
                )}
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-medium text-slate-600">Assessment Progress</p>
                  <p className="text-xs font-bold text-slate-900">{dept.evaluationProgress}%</p>
                </div>
                <div className="bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${dept.evaluationProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-600 font-medium">Staff</p>
                  <p className="text-lg font-bold text-slate-900">{dept.staffCount}</p>
                </div>
                {dept.headOfDepartment && (
                  <div className="text-right text-xs">
                    <p className="text-slate-600">HOD</p>
                    <p className="font-medium text-slate-900">{dept.headOfDepartment.name}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
