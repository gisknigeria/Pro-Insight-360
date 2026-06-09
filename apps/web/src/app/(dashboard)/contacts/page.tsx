'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/ui/empty-state';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  title?: string;
  organisation: { id: string; name: string };
  status: 'ACTIVE' | 'INACTIVE';
  formsAssigned: number;
  responsesSubmitted: number;
  createdAt: string;
}

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/contacts`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setContacts)
      .finally(() => setLoading(false));
  }, []);

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Contacts & Respondents</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Manage survey respondents and organizational contacts.
            </p>
          </div>
          <Link
            href="/contacts/new"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            + Add Contact
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Contacts', value: contacts.length, icon: '👥' },
          { label: 'Active', value: contacts.filter((c) => c.status === 'ACTIVE').length, icon: '✅' },
          { label: 'Avg Forms Assigned', value: contacts.length > 0 ? Math.round(contacts.reduce((sum, c) => sum + c.formsAssigned, 0) / contacts.length) : 0, icon: '📋' },
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

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        />
      </div>

      {/* Contacts Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="👥"
          title={searchTerm ? 'No contacts found' : 'No contacts yet'}
          description={searchTerm ? 'Try a different search term.' : 'Add contacts to manage survey respondents.'}
          actionLabel="Add Contact"
          onAction={() => router.push('/contacts/new')}
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Organisation</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Department</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Forms</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact) => (
                <tr key={contact.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{contact.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{contact.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{contact.organisation.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{contact.department || '—'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="text-slate-900 font-medium">{contact.formsAssigned}</span>
                    <span className="text-slate-600"> / {contact.responsesSubmitted}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded font-medium ${
                        contact.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {contact.status}
                    </span>
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
