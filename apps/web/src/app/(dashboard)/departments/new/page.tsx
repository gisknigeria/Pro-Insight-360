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
      fields={[
        { name: 'name', label: 'Department name', placeholder: 'e.g. Planning and Strategy', required: true },
        { name: 'lead', label: 'Department lead', placeholder: 'Name of the lead person' },
        { name: 'description', label: 'Description', placeholder: 'What does this department do?', textarea: true },
      ]}
    />
  );
}
