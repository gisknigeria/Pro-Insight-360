'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';

interface Form {
  id: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED';
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'forms' | 'templates'>('forms');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/forms`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setForms)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Forms & Templates</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Create surveys, manage templates, and build custom forms.
            </p>
          </div>
          <Link
            href="/forms/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            + Create Form
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('forms')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'forms'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            My Forms
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Templates
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : forms.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No forms yet"
          description="Create your first form to start collecting data from respondents."
          actionLabel="Create Form"
          onAction={() => (window.location.href = '/forms/new')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((form) => (
            <Link key={form.id} href={`/forms/${form.id}`}>
              <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition cursor-pointer">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-slate-900">{form.title}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      form.status === 'PUBLISHED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {form.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-4">{form.description}</p>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{form.questionCount} questions</span>
                  <span>{new Date(form.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
