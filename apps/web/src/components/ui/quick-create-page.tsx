'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AppIcon } from '@/components/ui/app-icons';
import { DashboardHero, DashboardPanel } from '@/components/ui/dashboard-chrome';

interface FieldOption {
  value: string;
  label: string;
}

interface FieldDefinition {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  textarea?: boolean;
  options?: FieldOption[];
}

interface QuickCreatePageProps {
  title: string;
  subtitle: string;
  resourceLabel: string;
  backHref: string;
  fields: FieldDefinition[];
  submitLabel?: string;
  successMessage?: string;
  onCreate?: (values: Record<string, string>) => Promise<void> | void;
}

export default function QuickCreatePage({
  title,
  subtitle,
  resourceLabel,
  backHref,
  fields,
  submitLabel = 'Create',
  successMessage = 'Created successfully.',
  onCreate,
}: QuickCreatePageProps) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((field) => [field.name, ''])),
  );
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const isComplete = useMemo(() => {
    return fields.every((field) => !field.required || values[field.name]?.trim());
  }, [fields, values]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (!isComplete) {
      setError('Please fill in the required fields before continuing.');
      return;
    }

    setSaving(true);
    try {
      if (onCreate) {
        await onCreate(values);
      }
      setDone(true);
      window.setTimeout(() => router.push(backHref), 1200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to create this item right now.';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl animate-fade-in space-y-5">
      <DashboardHero eyebrow={resourceLabel} title={title} description={subtitle} />

      <DashboardPanel className="p-6 sm:p-8">
        {done ? (
          <div className="text-center animate-scale-in py-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-100">
              <AppIcon name="check" className="h-7 w-7" />
            </div>
            <p className="text-lg font-bold text-slate-950">{resourceLabel} created</p>
            <p className="text-sm text-slate-500 mt-1">{successMessage}</p>
            <p className="text-sm text-slate-500 mt-2 animate-pulse">Redirecting you back to the list...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {error && (
              <div role="alert" className="border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm animate-scale-in">
                <div className="flex items-center gap-2">
                  <AppIcon name="alert" className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {fields.map((field, idx) => (
              <div key={field.name} className="group animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}>
                <label htmlFor={field.name} className="mb-2 block text-sm font-semibold text-slate-950">
                  {field.label}
                  {field.required ? <span className="ml-1 text-red-600">*</span> : null}
                </label>
                {field.textarea ? (
                  <textarea
                    id={field.name}
                    value={values[field.name] ?? ''}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, [field.name]: event.target.value }))
                    }
                    placeholder={field.placeholder}
                    rows={4}
                    className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 placeholder-slate-400 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                  />
                ) : field.type === 'select' ? (
                  <select
                    id={field.name}
                    value={values[field.name] ?? ''}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, [field.name]: event.target.value }))
                    }
                    className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                  >
                    <option value="" disabled>
                      {field.placeholder || `Select ${field.label}`}
                    </option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={field.name}
                    type={field.type ?? 'text'}
                    value={values[field.name] ?? ''}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, [field.name]: event.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 placeholder-slate-400 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                  />
                )}
              </div>
            ))}

            <div className="flex gap-3 pt-4">
              <Link
                href={backHref}
                className="border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:bg-slate-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="group relative flex-1 bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-700"
              >
                <span className="relative">
                  {saving ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating...
                    </span>
                  ) : submitLabel}
                </span>
              </button>
            </div>
          </form>
        )}
      </DashboardPanel>
    </div>
  );
}
