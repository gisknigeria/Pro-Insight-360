'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppIcon } from '@/components/ui/app-icons';

type UnitDraft = {
  id: string;
  name: string;
  description: string;
  lead: string;
};

function newUnitDraft(): UnitDraft {
  return {
    id: `unit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: '',
    description: '',
    lead: '',
  };
}

export default function NewOrganisationPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [units, setUnits] = useState<UnitDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cleanedUnits = useMemo(
    () => units.filter((unit) => unit.name.trim()),
    [units],
  );
  const canSubmit = name.trim().length > 0;

  function updateUnit(id: string, patch: Partial<UnitDraft>) {
    setUnits((current) => current.map((unit) => (unit.id === id ? { ...unit, ...patch } : unit)));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (!canSubmit) {
      setError('Organisation name is required.');
      return;
    }

    setSaving(true);
    try {
      const organisation = await apiFetch<{ id: string; name: string }>('/organisations', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          sector: sector.trim() || null,
        }),
      });

      for (const unit of cleanedUnits) {
        await apiFetch('/departments', {
          method: 'POST',
          body: JSON.stringify({
            organisationId: organisation.id,
            name: unit.name.trim(),
            lead: unit.lead.trim() || unit.name.trim(),
            description: unit.description.trim() || undefined,
          }),
        });
      }

      router.push('/organisations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create organisation.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl animate-fade-in">
      <div className="mb-8">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">Super Admin - Clients</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Create a new organisation</h1>
        <p className="mt-2 text-sm text-muted">Add the client profile now. Units and departments are optional and can be added before saving.</p>
      </div>

      <form onSubmit={handleSubmit} className="border border-border bg-surface p-6 shadow-sm sm:p-8">
        {error && (
          <div role="alert" className="mb-5 flex items-center gap-2 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AppIcon name="alert" className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-semibold text-foreground">
              Organisation name <span className="text-danger">*</span>
            </label>
            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Ministry of Health"
              className="w-full border border-border bg-surface-muted px-4 py-3 text-sm text-foreground placeholder-muted shadow-sm transition focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label htmlFor="sector" className="mb-2 block text-sm font-semibold text-foreground">Organisation sector</label>
            <input
              id="sector"
              value={sector}
              onChange={(event) => setSector(event.target.value)}
              placeholder="Public sector, NGO, finance, etc."
              className="w-full border border-border bg-surface-muted px-4 py-3 text-sm text-foreground placeholder-muted shadow-sm transition focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="mt-8 border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-black text-slate-950">Units / departments</h2>
              <p className="mt-1 text-sm text-slate-500">Optional. Add departments now so questionnaires can be created against each unit later.</p>
            </div>
            <button
              type="button"
              onClick={() => setUnits((current) => [...current, newUnitDraft()])}
              className="inline-flex items-center gap-2 bg-violet-700 px-4 py-2 text-sm font-bold text-white hover:bg-violet-800"
            >
              <AppIcon name="plus" className="h-4 w-4" /> Add unit
            </button>
          </div>

          {units.length === 0 ? (
            <div className="mt-5 bg-white p-6 text-center">
              <AppIcon name="sitemap" className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-2 text-sm font-semibold text-slate-700">No units added yet.</p>
              <p className="mt-1 text-xs text-slate-500">You can create the organisation without units and add them later.</p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {units.map((unit, index) => (
                <div key={unit.id} className="border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">Unit {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => setUnits((current) => current.filter((item) => item.id !== unit.id))}
                      className="inline-flex items-center gap-1 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100"
                    >
                      <AppIcon name="trash" className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <input
                      value={unit.name}
                      onChange={(event) => updateUnit(unit.id, { name: event.target.value })}
                      placeholder="Department / unit name"
                      className="border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none"
                    />
                    <input
                      value={unit.lead}
                      onChange={(event) => updateUnit(unit.id, { lead: event.target.value })}
                      placeholder="Lead person (optional)"
                      className="border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none"
                    />
                    <input
                      value={unit.description}
                      onChange={(event) => updateUnit(unit.id, { description: event.target.value })}
                      placeholder="Purpose / function"
                      className="border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href="/organisations" className="border border-border bg-surface px-5 py-3 text-center text-sm font-semibold text-foreground shadow-sm hover:bg-surface-muted">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="inline-flex flex-1 items-center justify-center gap-2 bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Creating...' : 'Create organisation'}
          </button>
        </div>
      </form>
    </div>
  );
}
