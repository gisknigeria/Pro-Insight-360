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
  const [isNavOpen, setIsNavOpen] = useState(false);

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
    <div className="min-h-screen bg-slate-100">
      <div className="lg:flex">
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-slate-200 bg-slate-950 text-slate-100 shadow-2xl shadow-slate-900/20 transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${isNavOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        >
          <SidebarNav role={user.role} userName={user.email} />
        </aside>

        {isNavOpen && (
          <button
            type="button"
            onClick={() => setIsNavOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
            aria-label="Close navigation"
          />
        )}

        <main className="flex-1 min-h-screen overflow-y-auto lg:pl-72">
          <div className="border-b border-slate-200 bg-white/95 lg:hidden">
            <div className="flex items-center justify-between max-w-7xl mx-auto px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => setIsNavOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                ☰ Menu
              </button>
              <span className="text-sm font-semibold text-slate-900">Pro-Insight 360</span>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
