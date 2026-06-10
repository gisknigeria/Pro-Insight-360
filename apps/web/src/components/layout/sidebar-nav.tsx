'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'CONSULTANT'
  | 'CLIENT_ADMIN'
  | 'HOD'
  | 'RESPONDENT';

interface NavItem {
  label: string;
  href: string;
  icon: string; // emoji icon paired with text label (Requirement 25.12)
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: '📊',
    roles: ['SUPER_ADMIN', 'CONSULTANT', 'CLIENT_ADMIN', 'HOD', 'RESPONDENT'],
  },
  {
    label: 'Organisations',
    href: '/organisations',
    icon: '🏢',
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'Evaluation Projects',
    href: '/evaluations',
    icon: '📋',
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'Forms & Templates',
    href: '/forms',
    icon: '📝',
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'Gap Analysis',
    href: '/gap-analysis',
    icon: '🔍',
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'My Forms',
    href: '/my-forms',
    icon: '📝',
    roles: ['HOD', 'RESPONDENT'],
  },
  {
    label: 'Organogram',
    href: '/organogram',
    icon: '🌳',
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'AI Diagnosis',
    href: '/ai-diagnosis',
    icon: '🤖',
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'Insights',
    href: '/insight',
    icon: '🔎',
    roles: ['CLIENT_ADMIN'],
  },
  {
    label: 'Users',
    href: '/users',
    icon: '👤',
    roles: ['SUPER_ADMIN'],
  },
];

interface SidebarNavProps {
  role: UserRole;
  userName: string;
}

export function SidebarNav({ role, userName }: SidebarNavProps) {
  const pathname = usePathname();

  // Filter nav items to only those the current role can access (Requirement 25.6)
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  const roleLabels: Record<UserRole, string> = {
    SUPER_ADMIN: 'Super Admin',
    CONSULTANT: 'Consultant',
    CLIENT_ADMIN: 'Client Admin',
    HOD: 'Head of Department',
    RESPONDENT: 'Staff Respondent',
  };

  return (
    <nav
      aria-label="Main navigation"
      className="flex flex-col h-full bg-slate-950 text-slate-100 w-72 shrink-0"
    >
      {/* Brand */}
      <div className="px-6 py-6 border-b border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-white text-lg">Pro-Insight 360</p>
            <p className="text-slate-400 text-xs mt-1">Evaluate. Diagnose. Transform.</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-200 ring-1 ring-blue-500/20">
            Live
          </span>
        </div>
      </div>

      {/* User info */}
      <div className="px-6 py-5 border-b border-slate-800">
        <p className="text-sm font-semibold text-white truncate">{userName}</p>
        <p className="text-xs text-slate-500 mt-1">{roleLabels[role]}</p>
      </div>

      {/* Nav items */}
      <ul className="flex-1 overflow-y-auto py-4 space-y-1 px-3" role="list">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`group flex items-center gap-3 w-full rounded-3xl px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm shadow-slate-900/20 ring-1 ring-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`text-base w-5 text-center transition-colors duration-200 ${
                    isActive ? 'text-blue-300' : 'text-slate-400 group-hover:text-blue-300'
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Sign out */}
      <div className="px-6 py-5 border-t border-slate-800">
        <button
          onClick={() => {
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
          }}
          className="flex items-center gap-3 w-full rounded-3xl bg-slate-900/80 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <span aria-hidden="true" className="text-base w-5 text-center">
            🚪
          </span>
          <span>Sign out</span>
        </button>
      </div>
    </nav>
  );
}
