'use client';

import QuickCreatePage from '@/components/ui/quick-create-page';

export default function NewOrganogramPage() {
  return (
    <QuickCreatePage
      title="Create a new organogram"
      subtitle="Map the reporting structure for a department or organisation."
      resourceLabel="Organogram"
      backHref="/organogram"
      submitLabel="Create organogram"
      onCreate={async (values) => {
        const storageKey = 'proinsight.organograms';
        const existing = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem(storageKey) ?? '[]' : '[]');
        existing.push({
          id: `organogram-${Date.now()}`,
          name: values.name,
          owner: values.owner,
          description: values.description,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem(storageKey, JSON.stringify(existing));
      }}
      fields={[
        { name: 'name', label: 'Organogram name', placeholder: 'e.g. ICT Department Structure', required: true },
        { name: 'owner', label: 'Owner', placeholder: 'Department or team' },
        { name: 'description', label: 'Notes', placeholder: 'Add any context or notes', textarea: true },
      ]}
    />
  );
}
