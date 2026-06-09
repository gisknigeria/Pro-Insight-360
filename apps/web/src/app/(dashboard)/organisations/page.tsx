'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/ui/empty-state';

interface Organisation {
  id: string;
  name: string;
  description?: string;
  sector?: string;
  country?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  _count: { users: number; evaluations: number };
}

export default function OrganisationsPage() {
  const router = useRouter();
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/organisations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setOrganisations)
      .finally(() => setLoading(false));
  }, []);

  async function deleteOrganisation(id: string) {
    if (!window.confirm('Delete this organisation? This cannot be undone.')) return;
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organisations/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      window.alert(payload?.message || 'Unable to delete organisation.');
      return;
    }
    setOrganisations((current) => current.filter((org) => org.id !== id));
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Organisations</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Manage client organizations and their evaluations.
            </p>
          </div>
          <Link
            href="/organisations/new"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            + Create Organisation
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {[
          { label: 'Total Organisations', value: organisations.length, icon: '🏢' },
          { label: 'Active', value: organisations.filter((o) => o.status === 'ACTIVE').length, icon: '✅' },
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

      {/* Organisations Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : organisations.length === 0 ? (
        <EmptyState
          icon="🏢"
          title="No organisations yet"
          description="Create your first client organization to start evaluations."
          actionLabel="Create Organisation"
          onAction={() => router.push('/organisations/new')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organisations.map((org) => (
            <div key={org.id} className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-3 gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{org.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => deleteOrganisation(org.id)}
                    className="text-red-600 hover:text-red-800 text-xs font-medium"
                  >
                    Delete
                  </button>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      org.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {org.status}
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4">{org.description || '—'}</p>
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-slate-500 font-medium">Sector</p>
                  <p className="text-slate-900">{org.sector || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Country</p>
                  <p className="text-slate-900">{org.country || '—'}</p>
                </div>
              </div>
              <div className="flex justify-between text-xs text-slate-500 border-t border-slate-200 pt-4">
                <span>{org._count.users} users</span>
                <span>{org._count.evaluations} evaluations</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
