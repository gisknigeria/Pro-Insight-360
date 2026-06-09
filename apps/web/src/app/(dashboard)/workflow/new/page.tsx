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
      onCreate={async (values) => {
        const storageKey = 'proinsight.workflows';
        const existing = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem(storageKey) ?? '[]' : '[]');
        existing.push({
          id: `workflow-${Date.now()}`,
          name: values.name,
          owner: values.owner,
          description: values.description,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem(storageKey, JSON.stringify(existing));
      }}
      fields={[
        { name: 'name', label: 'Workflow name', placeholder: 'e.g. GIS Assessment Workflow', required: true },
        { name: 'owner', label: 'Workflow owner', placeholder: 'Department or team' },
        { name: 'description', label: 'Description', placeholder: 'Describe the purpose of this workflow', textarea: true },
      ]}
    />
  );
}
