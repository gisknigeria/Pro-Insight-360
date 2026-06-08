'use client';

import QuickCreatePage from '@/components/ui/quick-create-page';

export default function NewContactPage() {
  return (
    <QuickCreatePage
      title="Add a new contact"
      subtitle="Create a respondent or stakeholder contact record."
      resourceLabel="Contact"
      backHref="/contacts"
      submitLabel="Create contact"
      fields={[
        { name: 'name', label: 'Full name', placeholder: 'e.g. Ada Okafor', required: true },
        { name: 'email', label: 'Email address', type: 'email', placeholder: 'ada@example.org', required: true },
        { name: 'role', label: 'Role', placeholder: 'Head of GIS, Analyst, etc.' },
      ]}
    />
  );
}
