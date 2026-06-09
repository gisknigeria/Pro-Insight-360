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
      onCreate={async (values) => {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contacts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            name: values.name,
            email: values.email,
            role: values.role || 'RESPONDENT',
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message ?? 'Unable to create contact.');
        }
      }}
      fields={[
        { name: 'name', label: 'Full name', placeholder: 'e.g. Ada Okafor', required: true },
        { name: 'email', label: 'Email address', type: 'email', placeholder: 'ada@example.org', required: true },
        { name: 'role', label: 'Role', placeholder: 'Head of GIS, Analyst, etc.' },
      ]}
    />
  );
}
