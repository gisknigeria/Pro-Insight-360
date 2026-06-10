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
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Premium loading spinner */}
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-b-accent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          </div>
          <p className="text-sm font-medium text-muted animate-pulse">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:flex">
        {/* ── Sidebar overlay on mobile ── */}
        {isNavOpen && (
          <button
            type="button"
            onClick={() => setIsNavOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm lg:hidden animate-fade-in"
            aria-label="Close navigation"
          />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-border bg-surface shadow-2xl shadow-slate-900/10 transition-all duration-300 ease-out lg:static lg:translate-x-0 ${
            isNavOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0`}
        >
          <SidebarNav role={user.role} userName={user.email} />
        </aside>

        {/* ── Main content area ── */}
        <main className="flex-1 min-h-screen overflow-y-auto">
          {/* ── Mobile header bar ── */}
          <div className="sticky top-0 z-30 border-b border-border bg-white/80 backdrop-blur-xl lg:hidden">
            <div className="flex items-center justify-between max-w-7xl mx-auto px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => setIsNavOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-surface-muted transition-all active:scale-95"
              >
                {/* Hamburger icon */}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="3" width="16" height="1.5" rx="0.75" fill="currentColor" />
                  <rect x="1" y="8.25" width="16" height="1.5" rx="0.75" fill="currentColor" />
                  <rect x="1" y="13.5" width="16" height="1.5" rx="0.75" fill="currentColor" />
                </svg>
                Menu
              </button>

              <div className="flex items-center gap-3">
                <span className="text-sm font-bold gradient-text">Pro-Insight 360</span>
                {/* Status dot */}
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
                </span>
              </div>
            </div>
          </div>

          {/* ── Page content with entrance animation ── */}
          <div className={`max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 ${mounted ? 'animate-fade-in-up' : ''}`}>
            {children}
          </div>

          {/* ── Footer ── */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
            <div className="border-t border-border pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-xs text-muted">
                &copy; {new Date().getFullYear()} Pro-Insight 360 by GIS Konsult Ltd.
              </p>
              <p className="text-xs text-muted">
                Evaluate. Diagnose. Transform.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
