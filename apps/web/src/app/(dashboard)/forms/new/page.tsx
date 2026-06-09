'use client';

import QuickCreatePage from '@/components/ui/quick-create-page';

export default function NewFormPage() {
  return (
    <QuickCreatePage
      title="Create a new form"
      subtitle="Set up a template or questionnaire for your next assessment."
      resourceLabel="Form"
      backHref="/forms"
      submitLabel="Create form"
      onCreate={async (values) => {
        const storageKey = 'proinsight.forms';
        const existing = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem(storageKey) ?? '[]' : '[]');
        existing.push({
          id: `form-${Date.now()}`,
          title: values.name,
          description: values.description,
          owner: values.owner,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem(storageKey, JSON.stringify(existing));
      }}
      fields={[
        { name: 'name', label: 'Form name', placeholder: 'e.g. GIS Readiness Assessment', required: true },
        { name: 'description', label: 'Description', placeholder: 'What is this form for?', textarea: true },
        { name: 'owner', label: 'Owner', placeholder: 'e.g. ICT or Planning' },
      ]}
    />
  );
}
