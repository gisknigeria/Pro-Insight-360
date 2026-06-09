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
      onCreate={async (values) => {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            name: values.name,
            email: values.email,
            role: values.role || 'CONSULTANT',
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message ?? 'Unable to create user.');
        }
      }}
      fields={[
        { name: 'name', label: 'Full name', placeholder: 'e.g. Jane Doe', required: true },
        { name: 'email', label: 'Email address', type: 'email', placeholder: 'jane@example.org', required: true },
        { name: 'role', label: 'Role', placeholder: 'CONSULTANT, CLIENT_ADMIN, etc.' },
      ]}
    />
  );
}
