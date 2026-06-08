'use client';

import QuickCreatePage from '@/components/ui/quick-create-page';

export default function NewWorkflowPage() {
  return (
    <QuickCreatePage
      title="Create a new workflow"
      subtitle="Capture a repeatable process for your evaluation workflow."
      resourceLabel="Workflow"
      backHref="/workflow"
      submitLabel="Create workflow"
      fields={[
        { name: 'name', label: 'Workflow name', placeholder: 'e.g. GIS Assessment Workflow', required: true },
        { name: 'owner', label: 'Workflow owner', placeholder: 'Department or team' },
        { name: 'description', label: 'Description', placeholder: 'Describe the purpose of this workflow', textarea: true },
      ]}
    />
  );
}
