'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

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
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-slate-500 mt-1 text-sm">{subtitle}</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {done ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
            <p className="font-semibold">{resourceLabel} created</p>
            <p className="text-sm mt-1">{successMessage}</p>
            <p className="text-sm mt-2">Redirecting you back to the list…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {error && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {fields.map((field) => (
              <div key={field.name}>
                <label htmlFor={field.name} className="mb-1 block text-sm font-medium text-slate-700">
                  {field.label}
                  {field.required ? <span className="ml-1 text-red-500">*</span> : null}
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
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : field.type === 'select' ? (
                  <select
                    id={field.name}
                    value={values[field.name] ?? ''}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, [field.name]: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <Link
                href={backHref}
                className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
              >
                {saving ? 'Creating…' : submitLabel}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
