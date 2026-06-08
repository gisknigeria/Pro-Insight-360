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
      fields={[
        { name: 'name', label: 'Form name', placeholder: 'e.g. GIS Readiness Assessment', required: true },
        { name: 'description', label: 'Description', placeholder: 'What is this form for?', textarea: true },
        { name: 'owner', label: 'Owner', placeholder: 'e.g. ICT or Planning' },
      ]}
    />
  );
}
