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
      onCreate={async (values) => {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organisations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            name: values.name,
            sector: values.sector || null,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message ?? 'Unable to create organisation.');
        }
      }}
      fields={[
        { name: 'name', label: 'Organisation name', placeholder: 'e.g. Ministry of Health', required: true },
        { name: 'sector', label: 'Organisation sector', placeholder: 'Public sector, NGO, etc.' },
      ]}
    />
  );
}
