'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',              href: '/dashboard',    icon: 'dashboard',  roles: ['SUPER_ADMIN', 'CONSULTANT', 'CLIENT_ADMIN', 'HOD', 'RESPONDENT'] },
  { label: 'Client Organisations',   href: '/organisations', icon: 'building',  roles: ['SUPER_ADMIN'] },
  { label: 'Professional Evaluations', href: '/evaluations', icon: 'clipboard', roles: ['SUPER_ADMIN'] },
  { label: 'Questionnaires',         href: '/forms',        icon: 'form',       roles: ['SUPER_ADMIN'] },
  { label: 'My Forms',               href: '/my-forms',     icon: 'form',       roles: ['HOD', 'RESPONDENT'] },
  { label: 'Structural Organogram',  href: '/organogram',   icon: 'tree',       roles: ['SUPER_ADMIN'] },
  { label: 'AI Analytics',           href: '/ai-diagnosis', icon: 'analytics',  roles: ['SUPER_ADMIN'] },
  { label: 'Insights',               href: '/insight',      icon: 'search',     roles: ['CLIENT_ADMIN'] },
  { label: 'Users',                  href: '/users',        icon: 'user',       roles: ['SUPER_ADMIN'] },
];

const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  CONSULTANT:  'Consultant',
  CLIENT_ADMIN:'Client Admin',
  HOD:         'Head of Department',
  RESPONDENT:  'Staff Respondent',
};

const roleColors: Record<UserRole, string> = {
  SUPER_ADMIN:  'from-red-500 to-rose-600',
  CONSULTANT:   'from-amber-500 to-orange-600',
  CLIENT_ADMIN: 'from-emerald-500 to-teal-600',
  HOD:          'from-violet-500 to-purple-600',
  RESPONDENT:   'from-blue-500 to-indigo-600',
};

const iconPaths: Record<IconName | 'signout', React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </>
  ),
  building: (
    <>
      <path d="M6 20V4h12v16" />
      <path d="M4 20h16" />
      <path d="M9 8h1" /><path d="M14 8h1" />
      <path d="M9 12h1" /><path d="M14 12h1" />
      <path d="M10 20v-4h4v4" />
    </>
  ),
  clipboard: (
    <>
      <path d="M9 4h6l1 2h3v14H5V6h3z" />
      <path d="M9 11h6" /><path d="M9 15h4" />
    </>
  ),
  form: (
    <>
      <path d="M6 4h12v16H6z" />
      <path d="M9 8h6" /><path d="M9 12h6" /><path d="M9 16h3" />
    </>
  ),
  tree: (
    <>
      <path d="M12 4v5" />
      <path d="M6 15v-3h12v3" />
      <path d="M4 15h4v5H4z" /><path d="M10 15h4v5h-4z" /><path d="M16 15h4v5h-4z" />
      <path d="M9 4h6v5H9z" />
    </>
  ),
  analytics: (
    <>
      <path d="M5 19V9" /><path d="M12 19V5" /><path d="M19 19v-7" />
      <path d="M3 19h18" />
    </>
  ),
  search: (
    <>
      <path d="M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z" />
      <path d="m16 16 4 4" />
    </>
  ),
  user: (
    <>
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </>
  ),
  signout: (
    <>
      <path d="M10 6H6v12h4" />
      <path d="M14 16l4-4-4-4" /><path d="M8 12h10" />
    </>
  ),
};

function NavIcon({ name }: { name: IconName | 'signout' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  );
}

interface SidebarNavProps {
  role: UserRole;
  userName: string;
}

export function SidebarNav({ role, userName }: SidebarNavProps) {
  const pathname = usePathname();
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const initials = (userName ?? '?').slice(0, 2).toUpperCase();
  const grad = roleColors[role] ?? 'from-primary to-primary/70';

  return (
    <nav
      aria-label="Main navigation"
      className="flex h-full w-72 shrink-0 flex-col bg-white text-foreground border-r border-slate-100"
    >
      {/* ── Brand ── */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${grad} text-sm font-black text-white shadow-md`}>
            PI
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-900 tracking-tight">Pro-Insight 360</p>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Assessment workspace</p>
          </div>
        </div>
      </div>

      {/* ── User card ── */}
      <div className="mx-3 mb-4 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${grad} text-xs font-black text-white shadow-sm`}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-800">{userName}</p>
            <p className="text-[10px] font-semibold text-slate-400">{roleLabels[role]}</p>
          </div>
          <div className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-300" />
        </div>
      </div>

      {/* ── Nav label ── */}
      <div className="px-5 pb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Navigation</p>
      </div>

      {/* ── Nav items ── */}
      <ul className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5" role="list">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary" aria-hidden="true" />
                )}

                <span className={`shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`}>
                  <NavIcon name={item.icon} />
                </span>
                <span className="truncate">{item.label}</span>

                {item.badge && (
                  <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-primary text-white text-[10px] font-bold px-1">
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* ── Sign out ── */}
      <div className="border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <NavIcon name="signout" />
          <span>Sign out</span>
        </button>
      </div>
    </nav>
  );
}
