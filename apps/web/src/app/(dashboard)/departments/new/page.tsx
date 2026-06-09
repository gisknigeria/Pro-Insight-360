'use client';

import QuickCreatePage from '@/components/ui/quick-create-page';

export default function NewDepartmentPage() {
  return (
    <QuickCreatePage
      title="Create a new department"
      subtitle="Add a department or unit to organise your assessment."
      resourceLabel="Department"
      backHref="/departments"
      submitLabel="Create department"
      onCreate={async (values) => {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            name: values.name,
            lead: values.lead,
            description: values.description,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message ?? 'Unable to create department.');
        }
      }}
      fields={[
        { name: 'name', label: 'Department name', placeholder: 'e.g. Planning and Strategy', required: true },
        { name: 'lead', label: 'Department lead', placeholder: 'Name of the lead person' },
        { name: 'description', label: 'Description', placeholder: 'What does this department do?', textarea: true },
      ]}
    />
  );
}
