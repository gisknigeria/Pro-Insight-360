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
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard', roles: ['SUPER_ADMIN', 'CONSULTANT', 'CLIENT_ADMIN', 'HOD', 'RESPONDENT'] },
  { label: 'Client Organisations', href: '/organisations', icon: 'building', roles: ['SUPER_ADMIN'] },
  { label: 'Professional Evaluations', href: '/evaluations', icon: 'clipboard', roles: ['SUPER_ADMIN'] },
  { label: 'Questionnaires', href: '/forms', icon: 'form', roles: ['SUPER_ADMIN'] },
  { label: 'My Forms', href: '/my-forms', icon: 'form', roles: ['HOD', 'RESPONDENT'] },
  { label: 'Structural Organogram', href: '/organogram', icon: 'tree', roles: ['SUPER_ADMIN'] },
  { label: 'Analytics', href: '/ai-diagnosis', icon: 'analytics', roles: ['SUPER_ADMIN'] },
  { label: 'Insights', href: '/insight', icon: 'search', roles: ['CLIENT_ADMIN'] },
  { label: 'Users', href: '/users', icon: 'user', roles: ['SUPER_ADMIN'] },
];

const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  CONSULTANT: 'Consultant',
  CLIENT_ADMIN: 'Client Admin',
  HOD: 'Head of Department',
  RESPONDENT: 'Staff Respondent',
};

const iconPaths: Record<IconName | 'signout', React.ReactNode> = {
  dashboard: (
    <>
      <path d="M4 4h6v6H4z" />
      <path d="M14 4h6v4h-6z" />
      <path d="M14 12h6v8h-6z" />
      <path d="M4 14h6v6H4z" />
    </>
  ),
  building: (
    <>
      <path d="M6 20V4h12v16" />
      <path d="M4 20h16" />
      <path d="M9 8h1" />
      <path d="M14 8h1" />
      <path d="M9 12h1" />
      <path d="M14 12h1" />
      <path d="M10 20v-4h4v4" />
    </>
  ),
  clipboard: (
    <>
      <path d="M9 4h6l1 2h3v14H5V6h3z" />
      <path d="M9 11h6" />
      <path d="M9 15h4" />
    </>
  ),
  form: (
    <>
      <path d="M6 4h12v16H6z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
      <path d="M9 16h3" />
    </>
  ),
  tree: (
    <>
      <path d="M12 4v5" />
      <path d="M6 15v-3h12v3" />
      <path d="M4 15h4v5H4z" />
      <path d="M10 15h4v5h-4z" />
      <path d="M16 15h4v5h-4z" />
      <path d="M9 4h6v5H9z" />
    </>
  ),
  analytics: (
    <>
      <path d="M5 19V9" />
      <path d="M12 19V5" />
      <path d="M19 19v-7" />
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
      <path d="M14 16l4-4-4-4" />
      <path d="M8 12h10" />
    </>
  ),
};

function NavIcon({ name }: { name: IconName | 'signout' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
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
  const initials = userName.slice(0, 1).toUpperCase();

  return (
    <nav aria-label="Main navigation" className="flex h-full w-72 shrink-0 flex-col bg-surface text-foreground">
      <div className="border-b border-border px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white shadow-sm">
            PI
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-foreground">Pro-Insight 360</p>
            <p className="mt-0.5 text-xs font-medium text-muted">GIS assessment workspace</p>
          </div>
        </div>
      </div>

      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700 ring-1 ring-border">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
            <p className="mt-0.5 text-xs text-muted">{roleLabels[role]}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 pb-2">
        <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Navigation</p>
      </div>

      <ul className="flex-1 overflow-y-auto px-3 pb-3" role="list">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <li key={item.href} className="mb-1">
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-light text-primary-dark ring-1 ring-blue-200'
                    : 'text-slate-600 hover:bg-surface-muted hover:text-foreground'
                }`}
              >
                <span className={isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}>
                  <NavIcon name={item.icon} />
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto border-t border-border p-3">
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
          }}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-danger"
        >
          <NavIcon name="signout" />
          <span>Sign out</span>
        </button>
      </div>
    </nav>
  );
}
