'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarNav, type UserRole } from '@/components/layout/sidebar-nav';

interface UserSession {
  id: string;
  email: string;
  role: UserRole;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.replace('/login');
      return;
    }

    // Decode JWT payload (not verification — server handles that)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({ id: payload.sub, email: payload.email, role: payload.role });
    } catch {
      localStorage.removeItem('accessToken');
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 text-sm">Loading your workspace…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav role={user.role} userName={user.email} />
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
