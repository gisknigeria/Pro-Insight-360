'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewEvaluationPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ organisationId: '', title: '', startDate: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/organisations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setOrgs);
  }, []);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.organisationId) e.organisationId = 'Please select a client organisation.';
    if (!form.title.trim()) e.title = 'Please enter an evaluation title.';
    if (!form.startDate) e.startDate = 'Please set a start date.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setError('');
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/evaluations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Failed to create evaluation.');
      router.push(`/evaluations/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">New Evaluation Project</h1>
        <p className="text-slate-500 mt-1 text-sm">Set up a new organisational evaluation engagement.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {error && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="org" className="block text-sm font-medium text-slate-700 mb-1">
              Client organisation <span className="text-red-500">*</span>
            </label>
            <select
              id="org"
              value={form.organisationId}
              onChange={(e) => setForm((f) => ({ ...f, organisationId: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select an organisation…</option>
              {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            {errors.organisationId && <p role="alert" className="mt-1 text-xs text-red-600">{errors.organisationId}</p>}
            <p className="mt-1 text-xs text-slate-500">The client organisation this evaluation is for.</p>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
              Evaluation title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. 2025 Organisational Capacity Assessment"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.title && <p role="alert" className="mt-1 text-xs text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-1">
              Start date <span className="text-red-500">*</span>
            </label>
            <input
              id="startDate"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.startDate && <p role="alert" className="mt-1 text-xs text-red-600">{errors.startDate}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 px-4 text-sm font-medium text-white bg-primary hover:bg-primary-dark disabled:bg-amber-300 rounded-lg transition-colors"
            >
              {saving ? 'Creating…' : 'Create Evaluation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
