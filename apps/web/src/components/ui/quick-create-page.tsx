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
    <div className="max-w-2xl animate-fade-in">
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{title}</h1>
        </div>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>

      {/* ── Card ── */}
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-sm">
        {done ? (
          <div className="text-center animate-scale-in py-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-success/10">
              ✅
            </div>
            <p className="text-lg font-bold text-foreground">{resourceLabel} created</p>
            <p className="text-sm text-muted mt-1">{successMessage}</p>
            <p className="text-sm text-muted mt-2 animate-pulse">Redirecting you back to the list…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {error && (
              <div role="alert" className="rounded-xl border border-red-200/50 bg-gradient-to-r from-red-50 to-red-100/50 p-4 text-sm text-red-700 shadow-sm animate-scale-in">
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {fields.map((field, idx) => (
              <div key={field.name} className="group animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}>
                <label htmlFor={field.name} className="block text-sm font-semibold text-foreground mb-2">
                  {field.label}
                  {field.required ? <span className="ml-1 text-danger">*</span> : null}
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
                    className="w-full rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-foreground placeholder-muted shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface"
                  />
                ) : field.type === 'select' ? (
                  <select
                    id={field.name}
                    value={values[field.name] ?? ''}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, [field.name]: event.target.value }))
                    }
                    className="w-full rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-foreground shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface"
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
                    className="w-full rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-foreground placeholder-muted shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface"
                  />
                )}
              </div>
            ))}

            <div className="flex gap-3 pt-4">
              <Link
                href={backHref}
                className="rounded-xl border border-border bg-surface px-5 py-3 text-sm font-semibold text-foreground shadow-sm hover:bg-surface-muted transition-all active:scale-[0.98]"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="group relative flex-1 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 overflow-hidden"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative">
                  {saving ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating…
                    </span>
                  ) : submitLabel}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
