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
      className="flex flex-col h-full bg-slate-900 text-white w-64 shrink-0"
    >
      {/* Brand */}
      <div className="px-6 py-5 border-b border-slate-700">
        <p className="font-bold text-white text-base">Pro-Insight 360</p>
        <p className="text-slate-400 text-xs mt-0.5">Evaluate. Diagnose. Transform.</p>
      </div>

      {/* User info */}
      <div className="px-6 py-4 border-b border-slate-700">
        <p className="text-sm font-medium text-white truncate">{userName}</p>
        <p className="text-xs text-slate-400 mt-0.5">{roleLabels[role]}</p>
      </div>

      {/* Nav items */}
      <ul className="flex-1 overflow-y-auto py-3 space-y-0.5 px-3" role="list">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {/* Icon always paired with text label (Requirement 25.12) */}
                <span aria-hidden="true" className="text-base w-5 text-center">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-slate-700">
        <button
          onClick={() => {
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
          }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
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
