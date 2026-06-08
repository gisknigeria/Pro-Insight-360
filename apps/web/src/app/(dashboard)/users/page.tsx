'use client';

import { useState, useEffect } from 'react';
import { EmptyState } from '@/components/ui/empty-state';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'CONSULTANT' | 'CLIENT_ADMIN' | 'HOD' | 'RESPONDENT';
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  organisation: { id: string; name: string };
  createdAt: string;
  lastLogin?: string;
}

const ROLE_CONFIG = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-red-100 text-red-700' },
  CONSULTANT: { label: 'Consultant', color: 'bg-blue-100 text-blue-700' },
  CLIENT_ADMIN: { label: 'Client Admin', color: 'bg-green-100 text-green-700' },
  HOD: { label: 'Head of Dept', color: 'bg-purple-100 text-purple-700' },
  RESPONDENT: { label: 'Respondent', color: 'bg-slate-100 text-slate-700' },
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Users</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Manage system users, roles, and access permissions.
            </p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
            + Add User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Users', value: users.length, icon: '👥' },
          { label: 'Active', value: users.filter((u) => u.status === 'ACTIVE').length, icon: '✅' },
          { label: 'Locked', value: users.filter((u) => u.status === 'LOCKED').length, icon: '🔒' },
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

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No users yet"
          description="Add users to your organization to start collaborating."
          actionLabel="Add First User"
          onAction={() => (window.location.href = '/users/new')}
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Last Login</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded font-medium ${ROLE_CONFIG[user.role].color}`}>
                      {ROLE_CONFIG[user.role].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded ${
                        user.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : user.status === 'LOCKED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
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
