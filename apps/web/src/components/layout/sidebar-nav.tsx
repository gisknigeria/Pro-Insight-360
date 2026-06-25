'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppIcon, type AppIconName } from '@/components/ui/app-icons';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'CONSULTANT'
  | 'CLIENT_ADMIN'
  | 'HOD'
  | 'RESPONDENT';

type IconName =
  | 'dashboard'
  | 'building'
  | 'clipboard'
  | 'form'
  | 'tree'
  | 'analytics'
  | 'search'
  | 'user';

interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  roles: UserRole[];
  color: string;       // icon accent colour class
}

interface SidebarInsight {
  id: string;
  title: string;
  recipientName?: string;
  evaluationId?: string | null;
  publishedAt: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',               href: '/dashboard',    icon: 'dashboard',  roles: ['SUPER_ADMIN','CONSULTANT','CLIENT_ADMIN','HOD','RESPONDENT'], color: 'from-blue-400 to-blue-600' },
  { label: 'Client',    href: '/organisations',icon: 'building',   roles: ['SUPER_ADMIN'],  color: 'from-violet-400 to-violet-600' },
  { label: 'Insights',                href: '/insight',      icon: 'search',     roles: ['SUPER_ADMIN'],  color: 'from-cyan-400 to-sky-600' },
  { label: 'Organogram',   href: '/organogram',   icon: 'tree',       roles: ['SUPER_ADMIN'],  color: 'from-teal-400 to-teal-600' },
  { label: 'My Forms',                href: '/my-forms',     icon: 'form',       roles: ['HOD','RESPONDENT'], color: 'from-amber-400 to-amber-600' },
  { label: 'Analytics',    href: '/ai-diagnosis', icon: 'analytics',  roles: ['SUPER_ADMIN'],  color: 'from-fuchsia-400 to-purple-600' },
  { label: 'Insights',                href: '/insight',      icon: 'search',     roles: ['CLIENT_ADMIN'], color: 'from-cyan-400 to-sky-600' },
  { label: 'Organogram',              href: '/organogram',   icon: 'tree',       roles: ['CLIENT_ADMIN'], color: 'from-teal-400 to-teal-600' },
  { label: 'Work Force',                   href: '/users',        icon: 'user',       roles: ['SUPER_ADMIN'],  color: 'from-rose-400 to-red-600' },
];

const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN:  'Super Admin',
  CONSULTANT:   'Consultant',
  CLIENT_ADMIN: 'Client Admin',
  HOD:          'Head of Department',
  RESPONDENT:   'Staff Respondent',
};

const roleGrad: Record<UserRole, string> = {
  SUPER_ADMIN:  'from-rose-500 to-red-600',
  CONSULTANT:   'from-amber-500 to-orange-600',
  CLIENT_ADMIN: 'from-emerald-500 to-teal-600',
  HOD:          'from-violet-500 to-purple-600',
  RESPONDENT:   'from-blue-500 to-indigo-600',
};

// Sidebar background gradient per role
const sidebarGrad: Record<UserRole, string> = {
  SUPER_ADMIN:  'from-[#121820] via-[#111827] to-[#1f1720]',
  CONSULTANT:   'from-[#121820] via-[#111827] to-[#211a12]',
  CLIENT_ADMIN: 'from-[#121820] via-[#111827] to-[#10221f]',
  HOD:          'from-[#121820] via-[#111827] to-[#1c1830]',
  RESPONDENT:   'from-[#121820] via-[#111827] to-[#151d32]',
};

const iconMap: Record<IconName | 'signout', AppIconName> = {
  dashboard: 'grid',
  building: 'building',
  clipboard: 'clipboard',
  form: 'form',
  tree: 'sitemap',
  analytics: 'chart',
  search: 'search',
  user: 'users',
  signout: 'logOut',
};

function NavIcon({ name }: { name: IconName | 'signout' }) {
  return <AppIcon name={iconMap[name]} className="h-[17px] w-[17px]" />;
}

export function SidebarNav({ role, userName }: { role: UserRole; userName: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activePublishedId = searchParams.get('published');
  const [pinnedInsights, setPinnedInsights] = useState<SidebarInsight[]>([]);
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const initials = (userName ?? '?').slice(0, 2).toUpperCase();
  const grad = roleGrad[role] ?? 'from-primary to-primary/70';
  const bg   = sidebarGrad[role] ?? 'from-slate-900 to-slate-900';
  const shouldShowPinnedInsights = useMemo(
    () => visibleItems.some((item) => item.href === '/insight'),
    [visibleItems],
  );

  useEffect(() => {
    if (!shouldShowPinnedInsights) return;

    let cancelled = false;
    const loadPinnedInsights = () => {
      apiFetch<SidebarInsight[]>('/published-analyses/sidebar')
        .then((items) => {
          if (!cancelled) {
            setPinnedInsights(items);
          }
        })
        .catch(() => {
          if (!cancelled) setPinnedInsights([]);
        });
    };

    loadPinnedInsights();
    window.addEventListener('published-insights-sidebar-updated', loadPinnedInsights);

    return () => {
      cancelled = true;
      window.removeEventListener('published-insights-sidebar-updated', loadPinnedInsights);
    };
  }, [shouldShowPinnedInsights]);

  return (
    <nav
      aria-label="Main navigation"
      className={`flex h-full w-72 shrink-0 flex-col bg-gradient-to-b ${bg} text-white`}
    >
      {/* ── Brand ── */}
      <div className="px-5 pt-6 pb-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${grad} text-sm font-black text-white shadow-lg shadow-black/20 ring-1 ring-white/10`}>
            PI
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white tracking-tight">Pro-Insight 360</p>
            <p className="text-[10px] font-semibold text-teal-200/70 uppercase tracking-widest">Command center</p>
          </div>
        </div>
      </div>

      {/* ── User card ── */}
      <div className="mx-3 mt-4 mb-4 rounded-2xl bg-white/[0.06] border border-white/10 px-4 py-3 backdrop-blur-sm shadow-inner">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${grad} text-xs font-black text-white shadow-md`}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-white">{userName}</p>
            <p className="text-[10px] font-semibold text-white/45">{roleLabels[role]}</p>
          </div>
          <div className="relative">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75" />
            <span className="relative flex h-2 w-2 rounded-full bg-emerald-400" />
          </div>
        </div>
      </div>

      {/* ── Nav label ── */}
      <div className="px-5 pb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Navigation</p>
      </div>

      {/* ── Nav items ── */}
      <ul className="flex-1 overflow-y-auto px-3 pb-3 space-y-1" role="list">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-400/15 text-white shadow-inner ring-1 ring-teal-300/20'
                    : 'text-white/55 hover:bg-white/[0.07] hover:text-white'
                }`}
              >
                {/* Coloured icon box */}
                <span className={`shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} shadow-md text-white transition-transform group-hover:scale-105`}>
                  <NavIcon name={item.icon} />
                </span>

                <span className="truncate">{item.label}</span>

                {/* Active right glow dot */}
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-300" aria-hidden="true" />
                )}
              </Link>
              {item.href === '/insight' && pinnedInsights.length > 0 && (
                <ul className="ml-11 mt-1 space-y-1 border-l border-white/10 pl-3" role="list">
                  {pinnedInsights.map((insight) => {
                    const href = insight.evaluationId
                      ? `/evaluations/${insight.evaluationId}/diagnosis`
                      : `/insight?published=${encodeURIComponent(insight.id)}`;
                    const insightActive = pathname === '/insight' && activePublishedId === insight.id;
                    return (
                      <li key={insight.id}>
                        <Link
                          href={href}
                          aria-current={insightActive ? 'page' : undefined}
                          className={`block rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors ${
                            insightActive
                              ? 'bg-teal-400/15 text-teal-100 ring-1 ring-teal-300/15'
                              : 'text-white/45 hover:bg-white/[0.06] hover:text-white/85'
                          }`}
                          title={insight.title}
                        >
                          <span className="block truncate">{insight.title}</span>
                          {role === 'SUPER_ADMIN' && insight.recipientName ? (
                            <span className="mt-0.5 block truncate text-[10px] font-medium text-white/30">
                              {insight.recipientName}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      {/* ── Sign out ── */}
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 transition-all hover:bg-red-500/20 hover:text-red-200"
        >
          <span className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
            <NavIcon name="signout" />
          </span>
          <span>Sign out</span>
        </button>
      </div>
    </nav>
  );
}
