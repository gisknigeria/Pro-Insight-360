'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import type { FormDefinition } from '@/components/form-builder/form-builder.types';

interface EvaluationOption {
  id: string;
  title: string;
  organisation: { id: string; name: string };
}

const defaultDiagnosticChecklist: FormDefinition = {
  formId: `form-${Date.now()}`,
  title: 'DIAGNOSTIC CHECKLIST',
  description: 'Project: Supervising Technical Consultant for GIS and Digital Transformation. Organisation: Oyo State Housing Corporation. GIS KONSULT LTD | STAKEHOLDER INTERVIEW GUIDE: Critical insights from each department.',
  pages: [
    {
      pageId: 'page-project-info',
      title: 'Project information',
      questions: [
        {
          questionId: 'project-name',
          type: 'short_text',
          label: 'Project',
          helperText: 'Supervising Technical Consultant for GIS and Digital Transformation',
          isRequired: true,
          config: {},
          dimensions: ['WHAT'],
          position: 0,
        },
        {
          questionId: 'organisation-name',
          type: 'short_text',
          label: 'Organisation',
          helperText: 'Oyo State Housing Corporation',
          isRequired: true,
          config: {},
          dimensions: ['WHAT'],
          position: 1,
        },
        {
          questionId: 'contact-name',
          type: 'short_text',
          label: 'Name',
          helperText: 'Respondent name',
          isRequired: true,
          config: {},
          dimensions: ['WHO'],
          position: 2,
        },
        {
          questionId: 'contact-phone',
          type: 'short_text',
          label: 'Phone',
          helperText: 'Respondent phone number',
          isRequired: false,
          config: {},
          dimensions: ['WHO'],
          position: 3,
        },
        {
          questionId: 'contact-email',
          type: 'short_text',
          label: 'Email',
          helperText: 'Respondent email address',
          isRequired: false,
          config: {},
          dimensions: ['WHO'],
          position: 4,
        },
        {
          questionId: 'directorate-unit',
          type: 'short_text',
          label: 'Directorate/Unit',
          helperText: 'Directorate or unit name',
          isRequired: false,
          config: {},
          dimensions: ['WHO'],
          position: 5,
        },
        {
          questionId: 'response-date',
          type: 'date',
          label: 'Date',
          helperText: 'Date of response',
          isRequired: false,
          config: {},
          dimensions: ['WHEN'],
          position: 6,
        },
      ],
    },
    {
      pageId: 'page-records',
      title: 'Records',
      questions: [
        {
          questionId: 'location-of-records',
          type: 'long_text',
          label: 'Location of records',
          helperText: 'Where are hard copy and digital records stored?',
          isRequired: false,
          config: {},
          dimensions: ['WHAT', 'HOW'],
          position: 0,
        },
        {
          questionId: 'document-types',
          type: 'long_text',
          label: 'Types of documents available',
          helperText: 'List key records and document classes.',
          isRequired: false,
          config: {},
          dimensions: ['WHAT'],
          position: 1,
        },
        {
          questionId: 'volume-of-records',
          type: 'long_text',
          label: 'Volume of records',
          helperText: 'Estimate the size of your records holdings.',
          isRequired: false,
          config: {},
          dimensions: ['WHAT'],
          position: 2,
        },
        {
          questionId: 'records-condition',
          type: 'dropdown',
          label: 'Condition',
          helperText: 'Select the overall record condition.',
          isRequired: false,
          config: { options: ['Good', 'Fair', 'Poor'] },
          dimensions: ['WHAT'],
          position: 3,
        },
        {
          questionId: 'indexing-system-exists',
          type: 'yes_no',
          label: 'Indexing system exists?',
          helperText: 'Is there an indexing or cataloguing system in place?',
          isRequired: false,
          config: {},
          dimensions: ['HOW'],
          position: 4,
        },
      ],
    },
    {
      pageId: 'page-existing-systems',
      title: 'Existing systems',
      questions: [
        {
          questionId: 'gis-system-exists',
          type: 'yes_no',
          label: 'GIS system exists?',
          helperText: 'Does the organisation currently use a GIS platform?',
          isRequired: false,
          config: {},
          dimensions: ['WHAT'],
          position: 0,
        },
        {
          questionId: 'property-database-exists',
          type: 'yes_no',
          label: 'Property database exists?',
          helperText: 'Is there a central property or asset database?',
          isRequired: false,
          config: {},
          dimensions: ['WHAT'],
          position: 1,
        },
        {
          questionId: 'payment-system-exists',
          type: 'yes_no',
          label: 'Payment system exists?',
          helperText: 'Is there a payment or revenue collection system?',
          isRequired: false,
          config: {},
          dimensions: ['HOW'],
          position: 2,
        },
        {
          questionId: 'hr-payroll-system-exists',
          type: 'yes_no',
          label: 'HR/Payroll system exists?',
          helperText: 'Does the organisation use a staff and payroll system?',
          isRequired: false,
          config: {},
          dimensions: ['WHO'],
          position: 3,
        },
        {
          questionId: 'system-failure-reasons',
          type: 'long_text',
          label: 'Why previous systems failed',
          helperText: 'Describe reasons previous systems did not succeed.',
          isRequired: false,
          config: {},
          dimensions: ['WHAT', 'HOW'],
          position: 4,
        },
      ],
    },
    {
      pageId: 'page-infrastructure',
      title: 'ICT infrastructure',
      questions: [
        {
          questionId: 'internet-availability',
          type: 'long_text',
          label: 'Internet availability',
          helperText: 'Describe internet connectivity and reliability.',
          isRequired: false,
          config: {},
          dimensions: ['HOW'],
          position: 0,
        },
        {
          questionId: 'server-cloud-readiness',
          type: 'long_text',
          label: 'Server/cloud readiness',
          helperText: 'Is basic infrastructure ready for servers or cloud services?',
          isRequired: false,
          config: {},
          dimensions: ['HOW'],
          position: 1,
        },
        {
          questionId: 'hardware-condition',
          type: 'long_text',
          label: 'Hardware condition',
          helperText: 'What is the state of desktops, laptops and servers?',
          isRequired: false,
          config: {},
          dimensions: ['WHAT'],
          position: 2,
        },
        {
          questionId: 'it-support-capacity',
          type: 'long_text',
          label: 'IT support capacity',
          helperText: 'Describe available IT support and team capacity.',
          isRequired: false,
          config: {},
          dimensions: ['WHO', 'HOW'],
          position: 3,
        },
        {
          questionId: 'security-policies',
          type: 'long_text',
          label: 'Security policies',
          helperText: 'Are there written IT/security policies?',
          isRequired: false,
          config: {},
          dimensions: ['HOW'],
          position: 4,
        },
      ],
    },
    {
      pageId: 'page-workflow',
      title: 'Workflow (Internal Processes)',
      questions: [
        {
          questionId: 'file-movement',
          type: 'long_text',
          label: 'How files move internally',
          helperText: 'Describe the internal flow of documents and approvals.',
          isRequired: false,
          config: {},
          dimensions: ['HOW'],
          position: 0,
        },
        {
          questionId: 'approval-hierarchy',
          type: 'approval_chain',
          label: 'Approval hierarchy',
          helperText: 'Map the approval chain for key decisions.',
          isRequired: false,
          config: {},
          dimensions: ['WHO', 'HOW'],
          position: 1,
        },
        {
          questionId: 'workflow-bottlenecks',
          type: 'long_text',
          label: 'Bottlenecks identified',
          helperText: 'Where do delays and blockages occur?',
          isRequired: false,
          config: {},
          dimensions: ['WHAT', 'HOW'],
          position: 2,
        },
      ],
    },
    {
      pageId: 'page-revenue',
      title: 'Revenue system',
      questions: [
        {
          questionId: 'revenue-streams',
          type: 'long_text',
          label: 'Revenue streams',
          helperText: 'What are the main sources of revenue?',
          isRequired: false,
          config: {},
          dimensions: ['WHAT'],
          position: 0,
        },
        {
          questionId: 'billing-system-type',
          type: 'long_text',
          label: 'Billing system type',
          helperText: 'How are bills generated and managed?',
          isRequired: false,
          config: {},
          dimensions: ['HOW'],
          position: 1,
        },
        {
          questionId: 'payment-collection-method',
          type: 'long_text',
          label: 'Payment collection method',
          helperText: 'Describe how payments are collected.',
          isRequired: false,
          config: {},
          dimensions: ['HOW'],
          position: 2,
        },
        {
          questionId: 'revenue-opportunities',
          type: 'long_text',
          label: 'Revenue opportunities',
          helperText: 'Where can revenue collection be improved?',
          isRequired: false,
          config: {},
          dimensions: ['WHAT', 'HOW'],
          position: 3,
        },
      ],
    },
    {
      pageId: 'page-human-capacity',
      title: 'Human capacity',
      questions: [
        {
          questionId: 'staff-structure',
          type: 'staff_hierarchy',
          label: 'Staff structure',
          helperText: 'Capture the reporting structure for your team.',
          isRequired: false,
          config: {},
          dimensions: ['WHO'],
          position: 0,
        },
        {
          questionId: 'skill-level',
          type: 'long_text',
          label: 'ICT/GIS skill level',
          helperText: 'Describe staff skills for GIS and ICT.',
          isRequired: false,
          config: {},
          dimensions: ['WHO'],
          position: 1,
        },
        {
          questionId: 'training-needs',
          type: 'long_text',
          label: 'Training needs',
          helperText: 'What training is needed to improve capacity?',
          isRequired: false,
          config: {},
          dimensions: ['HOW'],
          position: 2,
        },
        {
          questionId: 'change-readiness',
          type: 'long_text',
          label: 'Change readiness',
          helperText: 'How ready is the organisation for change?',
          isRequired: false,
          config: {},
          dimensions: ['HOW'],
          position: 3,
        },
      ],
    },
    {
      pageId: 'page-stakeholder-general',
      title: 'Stakeholder interview guide — General Questions (All Departments)',
      questions: [
        {
          questionId: 'core-responsibilities',
          type: 'long_text',
          label: 'What are your core responsibilities?',
          isRequired: false,
          config: {},
          dimensions: ['WHO'],
          position: 0,
        },
        {
          questionId: 'daily-data-used',
          type: 'long_text',
          label: 'What data do you use daily?',
          isRequired: false,
          config: {},
          dimensions: ['WHAT'],
          position: 1,
        },
        {
          questionId: 'operational-challenges',
          type: 'long_text',
          label: 'What are your biggest operational challenges?',
          isRequired: false,
          config: {},
          dimensions: ['WHAT'],
          position: 2,
        },
        {
          questionId: 'manual-processes',
          type: 'long_text',
          label: 'What processes are currently manual?',
          isRequired: false,
          config: {},
          dimensions: ['HOW'],
          position: 3,
        },
        {
          questionId: 'work-delays',
          type: 'long_text',
          label: 'What delays affect your work most?',
          isRequired: false,
          config: {},
          dimensions: ['HOW'],
          position: 4,
        },
      ],
    },
    {
      pageId: 'page-stakeholder-data-systems',
      title: 'Stakeholder interview guide — Data & Systems',
      questions: [
        {
          questionId: 'records-maintained',
          type: 'long_text',
          label: 'What records do you maintain?',
          isRequired: false,
          config: {},
          dimensions: ['WHAT'],
          position: 0,
        },
        {
          questionId: 'record-format',
          type: 'long_text',
          label: 'In what format (paper/digital)?',
          isRequired: false,
          config: {},
          dimensions: ['WHAT'],
          position: 1,
        },
        {
          questionId: 'information-retrieval',
          type: 'long_text',
          label: 'How do you retrieve information?',
          isRequired: false,
          config: {},
          dimensions: ['HOW'],
          position: 2,
        },
        {
          questionId: 'data-challenges',
          type: 'long_text',
          label: 'What challenges exist with current data?',
          isRequired: false,
          config: {},
          dimensions: ['WHAT'],
          position: 3,
        },
      ],
    },
    {
      pageId: 'page-stakeholder-workflow',
      title: 'Stakeholder interview guide — Workflow',
      questions: [
        {
          questionId: 'approval-process',
          type: 'long_text',
          label: 'How does your approval process work?',
          isRequired: false,
          config: {},
          dimensions: ['HOW'],
          position: 0,
        },
        {
          questionId: 'workflow-bottlenecks',
          type: 'long_text',
          label: 'Where do bottlenecks occur?',
          isRequired: false,
          config: {},
          dimensions: ['HOW'],
          position: 1,
        },
        {
          questionId: 'time-consuming-steps',
          type: 'long_text',
          label: 'What takes the most time?',
          isRequired: false,
          config: {},
          dimensions: ['HOW'],
          position: 2,
        },
      ],
    },
    {
      pageId: 'page-stakeholder-technology',
      title: 'Stakeholder interview guide — Technology readiness',
      questions: [
        {
          questionId: 'technology-used',
          type: 'long_text',
          label: 'What systems do you currently use?',
          isRequired: false,
          config: {},
          dimensions: ['WHAT'],
          position: 0,
        },
        {
          questionId: 'technology-success-failure',
          type: 'long_text',
          label: 'What has worked or failed before?',
          isRequired: false,
          config: {},
          dimensions: ['WHAT', 'HOW'],
          position: 1,
        },
        {
          questionId: 'technology-support-needed',
          type: 'long_text',
          label: 'What support do you need?',
          isRequired: false,
          config: {},
          dimensions: ['HOW'],
          position: 2,
        },
      ],
    },
    {
      pageId: 'page-stakeholder-gis',
      title: 'Stakeholder interview guide — GIS-specific',
      questions: [
        {
          questionId: 'gis-use',
          type: 'yes_no',
          label: 'Do you currently use maps or spatial data?',
          isRequired: false,
          config: {},
          dimensions: ['WHAT'],
          position: 0,
        },
        {
          questionId: 'location-based-decisions',
          type: 'long_text',
          label: 'What decisions require location-based insight?',
          isRequired: false,
          config: {},
          dimensions: ['WHAT'],
          position: 1,
        },
        {
          questionId: 'gis-dashboard-wish',
          type: 'long_text',
          label: 'What would you want to see on a GIS dashboard?',
          isRequired: false,
          config: {},
          dimensions: ['WHAT'],
          position: 2,
        },
      ],
    },
    {
      pageId: 'page-stakeholder-future',
      title: 'Stakeholder interview guide — Future expectations',
      questions: [
        {
          questionId: 'success-definition',
          type: 'long_text',
          label: 'What would success look like for you?',
          isRequired: false,
          config: {},
          dimensions: ['WHAT'],
          position: 0,
        },
        {
          questionId: 'important-features',
          type: 'long_text',
          label: 'What features are most important?',
          isRequired: false,
          config: {},
          dimensions: ['WHAT'],
          position: 1,
        },
        {
          questionId: 'concerns',
          type: 'long_text',
          label: 'What concerns do you have?',
          isRequired: false,
          config: {},
          dimensions: ['WHAT'],
          position: 2,
        },
      ],
    },
  ],
  conditionalLogic: [],
  version: 1,
};

export default function NewFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = searchParams.get('orgId') ?? '';

  const [evaluations, setEvaluations] = useState<EvaluationOption[]>([]);
  const [values, setValues] = useState({
    name: defaultDiagnosticChecklist.title,
    description: defaultDiagnosticChecklist.description ?? '',
    evaluationId: '',
    accessMode: 'REGISTERED',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<EvaluationOption[]>('/evaluations')
      .then(evs => {
        // If coming from an org, pre-filter to that org's evaluations
        const filtered = orgId ? evs.filter(e => e.organisation.id === orgId) : evs;
        setEvaluations(filtered);
        // Auto-select first evaluation if only one option
        if (filtered.length === 1) {
          setValues(v => ({ ...v, evaluationId: filtered[0].id }));
        }
      })
      .catch((err) => {
        console.error('Load evaluations failed:', err);
        setError('Unable to load evaluations. Please refresh the page.');
      })
      .finally(() => setLoading(false));
  }, [orgId]);

  const canSubmit = values.name.trim();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (!canSubmit) {
      setError('Please provide a form name.');
      return;
    }

    setSaving(true);
    try {
      // If no evaluation selected, auto-use the first available one or create without
      let evaluationId = values.evaluationId;
      if (!evaluationId && evaluations.length > 0) {
        evaluationId = evaluations[0].id;
      }

      // If still no evaluation, we need at least one — show a helpful error
      if (!evaluationId) {
        setError('No project available. Create a project first, then add a form to it.');
        setSaving(false);
        return;
      }

      const definition = {
        ...defaultDiagnosticChecklist,
        formId: `form-${Date.now()}`,
        title: values.name.trim(),
        description: values.description.trim(),
      };

      const data = await apiFetch<{ id: string }>('/forms', {
        method: 'POST',
        body: JSON.stringify({
          evaluationId,
          title: values.name.trim(),
          definition,
          accessMode: values.accessMode,
        }),
      });

      router.push(`/forms/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create form.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (error && evaluations.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Create a new form</h1>
        <p className="text-slate-500 mb-6">
          {orgId
            ? 'This organisation has no evaluation projects yet. Create a project first, then come back to add a form.'
            : 'You need at least one evaluation project before you can create a form.'}
        </p>
        <Link
          href={orgId ? `/evaluations/new` : '/evaluations/new'}
          className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-amber-300 hover:bg-primary/90 transition"
        >
          Create Project First
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Create a new form</h1>
        <p className="mt-2 text-sm text-slate-500">
          Start by naming the form and selecting an evaluation. You will be taken to the form builder next.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            Form name
          </label>
          <input
            id="name"
            value={values.name}
            onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-amber-200"
            placeholder="e.g. GIS Readiness Assessment"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            id="description"
            value={values.description}
            onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-amber-200 resize-none"
            rows={4}
            placeholder="What is this form for?"
          />
        </div>

        <div>
          <label htmlFor="evaluationId" className="block text-sm font-medium text-slate-700">
            Project / Evaluation <span className="text-slate-400 font-normal text-xs">(optional — auto-selects if only one exists)</span>
          </label>
          <select
            id="evaluationId"
            value={values.evaluationId}
            onChange={(event) => setValues((current) => ({ ...current, evaluationId: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-amber-200"
          >
            <option value="">
              {evaluations.length === 0 ? 'No projects available' : '— Select a project (optional) —'}
            </option>
            {evaluations.map((evaluation) => (
              <option key={evaluation.id} value={evaluation.id}>
                {evaluation.title} ({evaluation.organisation.name})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="accessMode" className="block text-sm font-medium text-slate-700">
            Form access
          </label>
          <select
            id="accessMode"
            value={values.accessMode}
            onChange={(event) => setValues((current) => ({ ...current, accessMode: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-amber-200"
          >
            <option value="REGISTERED">Registered only</option>
            <option value="PUBLIC">Public access</option>
          </select>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-amber-300 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 transition"
          >
            {saving ? 'Creating form…' : 'Create form'}
          </button>
          <Link
            href={orgId ? '/organisations' : '/forms'}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
