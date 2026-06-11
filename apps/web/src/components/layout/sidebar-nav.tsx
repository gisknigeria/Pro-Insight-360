'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'CONSULTANT'
  | 'CLIENT_ADMIN'
  | 'HOD'
  | 'RESPONDENT';

interface NavItem {
  label: string;
  href: string;
  icon: string;
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
    label: 'Client Organisations',
    href: '/organisations',
    icon: '🏢',
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'Professional Evaluations',
    href: '/evaluations',
    icon: '📋',
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'Questionnaires',
    href: '/forms',
    icon: '📝',
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'My Forms',
    href: '/my-forms',
    icon: '📝',
    roles: ['HOD', 'RESPONDENT'],
  },
  {
    label: 'Structural Organogram',
    href: '/organogram',
    icon: '🌳',
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'Analytics',
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
  const [expanded, setExpanded] = useState(true);

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
      className="flex flex-col h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 w-72 shrink-0"
    >
      {/* ── Brand header with glowing accent ── */}
      <div className="relative px-6 py-6 border-b border-white/5 overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-white text-lg tracking-tight">Pro-Insight 360</p>
              <p className="text-slate-400 text-xs mt-0.5 font-medium">Evaluate. Diagnose. Transform.</p>
            </div>
            {/* Live badge with pulse */}
            <span className="relative inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-[11px] font-semibold text-green-300 ring-1 ring-green-500/20">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
              </span>
              Live
            </span>
          </div>
        </div>
      </div>

      {/* ── User info with avatar ── */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          {/* Avatar placeholder */}
          <div className="relative flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-primary/20">
            {userName.charAt(0).toUpperCase()}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-slate-900" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{userName}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{roleLabels[role]}</p>
          </div>
        </div>
      </div>

      {/* ── Nav label ── */}
      <div className="px-6 pt-5 pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Navigation</p>
      </div>

      {/* ── Nav items ── */}
      <ul className="flex-1 overflow-y-auto py-2 space-y-0.5 px-3" role="list">
        {visibleItems.map((item, index) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <li
              key={item.href}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'both' }}
            >
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`group relative flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white/10 text-white shadow-sm shadow-slate-900/20'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-primary to-accent" />
                )}

                {/* Icon */}
                <span
                  aria-hidden="true"
                  className={`text-base w-5 text-center transition-all duration-200 ${
                    isActive
                      ? 'scale-110'
                      : 'text-slate-400 group-hover:text-white group-hover:scale-105'
                  }`}
                >
                  {item.icon}
                </span>

                {/* Label */}
                <span>{item.label}</span>

                {/* Active glow */}
                {isActive && (
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/[0.06] to-transparent pointer-events-none" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* ── Collapse toggle ── */}
      <div className="px-3 py-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 w-full rounded-xl px-4 py-2.5 text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className={`transition-transform duration-200 ${expanded ? 'rotate-0' : 'rotate-180'}`}
          >
            <path d="M10.5 4L7 7.5L3.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{expanded ? 'Collapse sidebar' : 'Expand sidebar'}</span>
        </button>
      </div>

      {/* ── Sign out ── */}
      <div className="px-3 py-3 border-t border-white/5 mt-auto">
        <button
          onClick={() => {
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
          }}
          className="group flex items-center gap-3 w-full rounded-xl bg-white/5 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-red-500/10 hover:text-red-300 transition-all active:scale-[0.98]"
        >
          <span aria-hidden="true" className="text-base w-5 text-center group-hover:animate-float">
            🚪
          </span>
          <span>Sign out</span>
        </button>
      </div>
    </nav>
  );
}
