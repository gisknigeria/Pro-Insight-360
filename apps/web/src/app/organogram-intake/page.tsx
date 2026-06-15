'use client';

import { useEffect, useMemo, useState } from 'react';

type Department = { id: string; name: string; purpose: string };
type Role = {
  id: string;
  title: string;
  holder: string;
  departmentId: string;
  reportsToId: string;
  responsibilities: string;
  headcount: string;
};
type Organisation = { id: string; name: string; sector?: string | null };
type IntakeStep = 'context' | 'departments' | 'roles' | 'submit';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const STEP_ORDER: IntakeStep[] = ['context', 'departments', 'roles', 'submit'];
const STEP_LABELS: Record<IntakeStep, string> = {
  context: 'Respondent details',
  departments: 'Departments',
  roles: 'Roles and reporting',
  submit: 'Review and submit',
};

const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: '', purpose: '' },
  { id: 'dept-2', name: '', purpose: '' },
  { id: 'dept-3', name: '', purpose: '' },
];

const DEFAULT_ROLES: Role[] = [
  { id: 'role-1', title: '', holder: '', departmentId: '', reportsToId: '', responsibilities: '', headcount: '1' },
];

function nextId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function TextField({ label, value, onChange, placeholder, type = 'text', readOnly = false }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${readOnly ? 'bg-slate-100' : 'bg-white'}`}
      />
    </label>
  );
}

function TextAreaField({ label, value, onChange, placeholder, rows = 4 }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
      />
    </label>
  );
}

export default function OrganogramIntakePage() {
  const [token, setToken] = useState('');
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [loadingLink, setLoadingLink] = useState(true);
  const [step, setStep] = useState<IntakeStep>('context');
  const [respondentName, setRespondentName] = useState('');
  const [respondentRole, setRespondentRole] = useState('');
  const [topExecutiveTitle, setTopExecutiveTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [departments, setDepartments] = useState<Department[]>(DEFAULT_DEPARTMENTS);
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentStepIndex = STEP_ORDER.indexOf(step);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linkToken = params.get('token') ?? '';
    setToken(linkToken);

    if (!linkToken) {
      setError('This organogram intake link is missing its token. Please ask the sender for the full link.');
      setLoadingLink(false);
      return;
    }

    fetch(`${API_URL}/organogram-intake-links/${encodeURIComponent(linkToken)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load organogram intake link.');
        setOrganisation(data.organisation);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load organogram intake link.'))
      .finally(() => setLoadingLink(false));
  }, []);

  const cleanedDepartments = useMemo(
    () => departments.filter((department) => department.name.trim()),
    [departments],
  );

  const cleanedRoles = useMemo(
    () =>
      roles
        .filter((role) => role.title.trim())
        .map((role) => {
          const department = departments.find((item) => item.id === role.departmentId);
          const reportsTo = roles.find((item) => item.id === role.reportsToId);

          return {
            id: role.id,
            title: role.title.trim(),
            holder: role.holder.trim() || null,
            department: department?.name.trim() || 'Unassigned',
            reportsTo: reportsTo?.title.trim() || null,
            responsibilities: role.responsibilities.trim() || null,
            headcount: Number(role.headcount) || 1,
          };
        }),
    [departments, roles],
  );

  const intakePayload = useMemo(
    () => ({
      organization: {
        id: organisation?.id,
        name: organisation?.name,
        industry: organisation?.sector || null,
        topExecutiveTitle: topExecutiveTitle.trim() || null,
      },
      submittedBy: {
        name: respondentName.trim() || null,
        role: respondentRole.trim() || null,
      },
      analysisQuestions: [
        { question: 'Which organisation is this organogram for?', answer: organisation?.name || '' },
        { question: 'Who is completing this organogram intake?', answer: `${respondentName} - ${respondentRole}`.trim() },
        { question: 'Who is the highest executive or final reporting authority?', answer: topExecutiveTitle.trim() },
        { question: 'What exceptions, acting roles, vacant roles, board oversight, branches, or dotted-line reports should be considered?', answer: notes.trim() },
      ],
      departments: cleanedDepartments.map((department) => ({
        name: department.name.trim(),
        purpose: department.purpose.trim() || null,
      })),
      roles: cleanedRoles,
    }),
    [cleanedDepartments, cleanedRoles, notes, organisation, respondentName, respondentRole, topExecutiveTitle],
  );

  function updateDepartment(id: string, patch: Partial<Department>) {
    setDepartments((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function updateRole(id: string, patch: Partial<Role>) {
    setRoles((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function goToStep(direction: 1 | -1) {
    const nextIndex = Math.min(Math.max(currentStepIndex + direction, 0), STEP_ORDER.length - 1);
    setStep(STEP_ORDER[nextIndex]);
    setError('');
  }

  async function submitResponse() {
    if (!token || !organisation) return;
    if (cleanedRoles.length === 0) {
      setError('Please add at least one role before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/organogram-intake-links/${encodeURIComponent(token)}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intake: intakePayload }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to submit organogram response.');
      setSuccess('Thank you. Your organogram structure has been submitted successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit organogram response.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingLink) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-semibold text-slate-500 shadow-sm">Loading organogram form...</div>
      </main>
    );
  }

  if (error && !organisation) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-sm font-semibold text-red-700 shadow-sm">{error}</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">Organogram intake</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{organisation?.name}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Please provide the departments, roles, and reporting lines for this organisation. The organisation has already been selected by the sender.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="space-y-2">
              {STEP_ORDER.map((item, index) => {
                const active = item === step;
                const done = index < currentStepIndex;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setStep(item)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${active ? 'border border-teal-200 bg-teal-50 text-teal-900' : 'border border-transparent text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-emerald-500 text-white' : active ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {done ? '✓' : index + 1}
                    </span>
                    <span className="font-semibold">{STEP_LABELS[item]}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            {success ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-800">{success}</div>
            ) : (
              <>
                {step === 'context' && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-bold text-slate-950">Respondent details</h2>
                      <p className="mt-1 text-sm text-slate-500">The organisation is fixed for this link. Tell us who is completing the structure.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextField label="Organisation" value={organisation?.name || ''} onChange={() => undefined} readOnly />
                      <TextField label="Sector" value={organisation?.sector || ''} onChange={() => undefined} readOnly />
                      <TextField label="Your name" value={respondentName} onChange={setRespondentName} placeholder="Name of person completing this" />
                      <TextField label="Your role" value={respondentRole} onChange={setRespondentRole} placeholder="Example: CEO, HR Manager, COO" />
                      <TextField label="Highest executive role" value={topExecutiveTitle} onChange={setTopExecutiveTitle} placeholder="Example: Managing Director / CEO" />
                    </div>
                    <TextAreaField label="Special notes" value={notes} onChange={setNotes} placeholder="Mention acting roles, vacant roles, dotted-line reporting, board oversight, regional branches, or any exception we should handle." />
                  </div>
                )}

                {step === 'departments' && (
                  <div className="space-y-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-slate-950">Departments</h2>
                        <p className="mt-1 text-sm text-slate-500">List the main teams or units that should appear as organogram groups.</p>
                      </div>
                      <button type="button" onClick={() => setDepartments((items) => [...items, { id: nextId('dept'), name: '', purpose: '' }])} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Add department</button>
                    </div>
                    <div className="space-y-3">
                      {departments.map((department, index) => (
                        <div key={department.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_1.3fr_auto]">
                          <TextField label={`Department ${index + 1}`} value={department.name} onChange={(value) => updateDepartment(department.id, { name: value })} placeholder="Example: Finance" />
                          <TextField label="Purpose or function" value={department.purpose} onChange={(value) => updateDepartment(department.id, { purpose: value })} placeholder="Example: Revenue, budgeting, payments" />
                          <button type="button" onClick={() => setDepartments((items) => items.filter((item) => item.id !== department.id))} className="self-end rounded-xl border border-red-100 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Remove</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step === 'roles' && (
                  <div className="space-y-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-slate-950">Roles and reporting lines</h2>
                        <p className="mt-1 text-sm text-slate-500">Add leadership roles, department roles, and who reports to whom.</p>
                      </div>
                      <button type="button" onClick={() => setRoles((items) => [...items, { ...DEFAULT_ROLES[0], id: nextId('role') }])} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Add role</button>
                    </div>

                    <div className="space-y-4">
                      {roles.map((role, index) => (
                        <div key={role.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <p className="text-sm font-bold text-slate-700">Role {index + 1}</p>
                            <button type="button" onClick={() => setRoles((items) => items.filter((item) => item.id !== role.id))} className="rounded-xl border border-red-100 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Remove</button>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <TextField label="Role title" value={role.title} onChange={(value) => updateRole(role.id, { title: value })} placeholder="Example: Chief Finance Officer" />
                            <TextField label="Current role holder" value={role.holder} onChange={(value) => updateRole(role.id, { holder: value })} placeholder="Optional" />
                            <label className="block">
                              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Department</span>
                              <select value={role.departmentId} onChange={(event) => updateRole(role.id, { departmentId: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                                <option value="">Select department</option>
                                {cleanedDepartments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                              </select>
                            </label>
                            <label className="block">
                              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Reports to</span>
                              <select value={role.reportsToId} onChange={(event) => updateRole(role.id, { reportsToId: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                                <option value="">No direct manager / top role</option>
                                {roles.filter((item) => item.id !== role.id && item.title.trim()).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                              </select>
                            </label>
                            <TextField label="Headcount" type="number" value={role.headcount} onChange={(value) => updateRole(role.id, { headcount: value })} placeholder="1" />
                            <TextField label="Main responsibilities" value={role.responsibilities} onChange={(value) => updateRole(role.id, { responsibilities: value })} placeholder="Example: Budgeting, payroll, financial control" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step === 'submit' && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-bold text-slate-950">Review and submit</h2>
                      <p className="mt-1 text-sm text-slate-500">Submit this structure to the Pro-Insight team for organogram generation.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-2xl font-bold">{cleanedDepartments.length}</p><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Departments</p></div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-2xl font-bold">{cleanedRoles.length}</p><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Roles</p></div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-2xl font-bold">{cleanedRoles.filter((role) => role.reportsTo).length}</p><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reporting links</p></div>
                    </div>
                    <button type="button" onClick={submitResponse} disabled={submitting} className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50">
                      {submitting ? 'Submitting...' : 'Submit organogram structure'}
                    </button>
                  </div>
                )}

                {error && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

                <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <button type="button" onClick={() => goToStep(-1)} disabled={currentStepIndex === 0} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Back</button>
                  <button type="button" onClick={() => goToStep(1)} disabled={currentStepIndex === STEP_ORDER.length - 1} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">Continue</button>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
