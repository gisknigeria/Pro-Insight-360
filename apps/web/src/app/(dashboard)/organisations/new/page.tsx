'use client';

import QuickCreatePage from '@/components/ui/quick-create-page';

export default function NewOrganisationPage() {
  return (
    <QuickCreatePage
      title="Create a new organisation"
      subtitle="Add a client organisation to begin a new engagement."
      resourceLabel="Organisation"
      backHref="/organisations"
      submitLabel="Create organisation"
      fields={[
        { name: 'name', label: 'Organisation name', placeholder: 'e.g. Ministry of Health', required: true },
        { name: 'type', label: 'Organisation type', placeholder: 'Public sector, NGO, etc.' },
        { name: 'contactEmail', label: 'Primary contact email', type: 'email', placeholder: 'contact@example.org' },
      ]}
    />
  );
}
