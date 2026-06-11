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
  color: string;       // icon accent colour class
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',               href: '/dashboard',    icon: 'dashboard',  roles: ['SUPER_ADMIN','CONSULTANT','CLIENT_ADMIN','HOD','RESPONDENT'], color: 'from-blue-400 to-blue-600' },
  { label: 'Client Organisations',    href: '/organisations',icon: 'building',   roles: ['SUPER_ADMIN'],  color: 'from-violet-400 to-violet-600' },
  { label: 'Professional Evaluations',href: '/evaluations',  icon: 'clipboard',  roles: ['SUPER_ADMIN'],  color: 'from-emerald-400 to-emerald-600' },
  { label: 'Questionnaires',          href: '/forms',        icon: 'form',       roles: ['SUPER_ADMIN'],  color: 'from-amber-400 to-amber-600' },
  { label: 'My Forms',                href: '/my-forms',     icon: 'form',       roles: ['HOD','RESPONDENT'], color: 'from-amber-400 to-amber-600' },
  { label: 'Structural Organogram',   href: '/organogram',   icon: 'tree',       roles: ['SUPER_ADMIN'],  color: 'from-teal-400 to-teal-600' },
  { label: 'AI Analytics',            href: '/ai-diagnosis', icon: 'analytics',  roles: ['SUPER_ADMIN'],  color: 'from-fuchsia-400 to-purple-600' },
  { label: 'Insights',                href: '/insight',      icon: 'search',     roles: ['CLIENT_ADMIN'], color: 'from-cyan-400 to-sky-600' },
  { label: 'Users',                   href: '/users',        icon: 'user',       roles: ['SUPER_ADMIN'],  color: 'from-rose-400 to-red-600' },
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
  SUPER_ADMIN:  'from-slate-900 via-slate-900 to-red-950',
  CONSULTANT:   'from-slate-900 via-slate-900 to-amber-950',
  CLIENT_ADMIN: 'from-slate-900 via-slate-900 to-emerald-950',
  HOD:          'from-slate-900 via-slate-900 to-violet-950',
  RESPONDENT:   'from-slate-900 via-slate-900 to-indigo-950',
};

const iconPaths: Record<IconName | 'signout', React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
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
      className="h-[17px] w-[17px]"
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

export function SidebarNav({ role, userName }: { role: UserRole; userName: string }) {
  const pathname = usePathname();
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const initials = (userName ?? '?').slice(0, 2).toUpperCase();
  const grad = roleGrad[role] ?? 'from-primary to-primary/70';
  const bg   = sidebarGrad[role] ?? 'from-slate-900 to-slate-900';

  return (
    <nav
      aria-label="Main navigation"
      className={`flex h-full w-72 shrink-0 flex-col bg-gradient-to-b ${bg} text-white`}
    >
      {/* ── Brand ── */}
      <div className="px-5 pt-6 pb-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${grad} text-sm font-black text-white shadow-lg shadow-black/20`}>
            PI
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white tracking-tight">Pro-Insight 360</p>
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Assessment workspace</p>
          </div>
        </div>
      </div>

      {/* ── User card ── */}
      <div className="mx-3 mt-4 mb-4 rounded-2xl bg-white/8 border border-white/10 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${grad} text-xs font-black text-white shadow-md`}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-white">{userName}</p>
            <p className="text-[10px] font-semibold text-white/50">{roleLabels[role]}</p>
          </div>
          <div className="relative">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75" />
            <span className="relative flex h-2 w-2 rounded-full bg-emerald-400" />
          </div>
        </div>
      </div>

      {/* ── Nav label ── */}
      <div className="px-5 pb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Menu</p>
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
                    ? 'bg-white/15 text-white shadow-inner'
                    : 'text-white/60 hover:bg-white/8 hover:text-white'
                }`}
              >
                {/* Coloured icon box */}
                <span className={`shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${item.color} shadow-md text-white transition-transform group-hover:scale-105`}>
                  <NavIcon name={item.icon} />
                </span>

                <span className="truncate">{item.label}</span>

                {/* Active right glow dot */}
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
                )}
              </Link>
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
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 transition-all hover:bg-red-500/20 hover:text-red-300"
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
