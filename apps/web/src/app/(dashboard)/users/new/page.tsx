'use client';

import QuickCreatePage from '@/components/ui/quick-create-page';

export default function NewUserPage() {
  return (
    <QuickCreatePage
      title="Create a new user"
      subtitle="Invite a colleague or administrator to the platform."
      resourceLabel="User"
      backHref="/users"
      submitLabel="Create user"
      fields={[
        { name: 'name', label: 'Full name', placeholder: 'e.g. Jane Doe', required: true },
        { name: 'email', label: 'Email address', type: 'email', placeholder: 'jane@example.org', required: true },
        { name: 'role', label: 'Role', placeholder: 'CONSULTANT, CLIENT_ADMIN, etc.' },
      ]}
    />
  );
}
