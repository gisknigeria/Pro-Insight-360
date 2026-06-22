'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarNav, type UserRole } from '@/components/layout/sidebar-nav';
import { AppIcon } from '@/components/ui/app-icons';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.replace('/login');
      return;
    }

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface px-8 py-7 shadow-sm">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
          </div>
          <p className="text-sm font-medium text-muted">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="lg:flex">
        {isNavOpen && (
          <button
            type="button"
            onClick={() => setIsNavOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden animate-fade-in"
            aria-label="Close navigation"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-white/10 bg-slate-950 shadow-xl shadow-black/30 transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
            isNavOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <SidebarNav role={user.role} userName={user.email} />
        </aside>

        <main className="flex-1 min-h-screen overflow-y-auto">
          <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 text-slate-900 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between max-w-[1440px] mx-auto px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => setIsNavOpen(true)}
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:bg-slate-50"
              >
                <AppIcon name="menu" className="h-[18px] w-[18px]" />
                Menu
              </button>

              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-900">Pro-Insight 360</span>
                <span className="h-2.5 w-2.5 rounded-full bg-success" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className={`max-w-[1500px] mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-7 ${mounted ? 'animate-fade-in-up' : ''}`}>
            {children}
          </div>

        
        </main>
      </div>
    </div>
  );
}
