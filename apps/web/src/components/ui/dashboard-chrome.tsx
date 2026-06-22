'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { AppIcon, type AppIconName } from '@/components/ui/app-icons';

const toneClasses = {
  blue: {
    card: 'from-slate-900 via-slate-800 to-blue-950',
    icon: 'bg-blue-400/15 text-blue-100 border-blue-300/10',
    label: 'text-blue-100/75',
  },
  teal: {
    card: 'from-slate-900 via-teal-950 to-emerald-950',
    icon: 'bg-teal-300/15 text-teal-100 border-teal-300/10',
    label: 'text-teal-100/75',
  },
  amber: {
    card: 'from-slate-900 via-stone-900 to-amber-950',
    icon: 'bg-amber-300/15 text-amber-100 border-amber-300/10',
    label: 'text-amber-100/75',
  },
  slate: {
    card: 'from-slate-950 via-slate-900 to-slate-950',
    icon: 'bg-white/10 text-white border-white/10',
    label: 'text-slate-300',
  },
  violet: {
    card: 'from-slate-900 via-indigo-950 to-violet-950',
    icon: 'bg-violet-300/15 text-violet-100 border-violet-300/10',
    label: 'text-violet-100/75',
  },
  rose: {
    card: 'from-slate-900 via-rose-950 to-red-950',
    icon: 'bg-rose-300/15 text-rose-100 border-rose-300/10',
    label: 'text-rose-100/75',
  },
};

type DashboardTone = keyof typeof toneClasses;

export function DashboardPageFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`space-y-5 ${className}`}>{children}</div>;
}

export function DashboardHero({
  eyebrow,
  title,
  description,
  actions,
  meta,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="border border-slate-900 bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/10">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{description}</p>
        </div>
        {(actions || meta) ? (
          <div className="flex flex-col gap-3 xl:min-w-[280px]">
            {meta}
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function DashboardMetricCard({
  label,
  value,
  icon,
  tone = 'slate',
  detail,
}: {
  label: string;
  value: ReactNode;
  icon: AppIconName;
  tone?: DashboardTone;
  detail?: ReactNode;
}) {
  const toneClass = toneClasses[tone];

  return (
    <div className={`border border-slate-800 bg-gradient-to-br ${toneClass.card} p-5 text-white shadow-xl shadow-slate-900/10`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-sm font-bold ${toneClass.label}`}>{label}</p>
          <p className="mt-8 text-3xl font-black leading-none text-white">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center border ${toneClass.icon}`}>
          <AppIcon name={icon} className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 h-px w-full bg-white/15">
        <div className="h-px w-2/3 bg-white/70" />
      </div>
      {detail ? <div className="mt-3 text-xs text-slate-300">{detail}</div> : null}
    </div>
  );
}

export function DashboardPanel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`border border-slate-300 bg-white p-5 text-slate-950 shadow-[0_14px_32px_rgba(15,23,42,0.08)] ${className}`}>
      {children}
    </div>
  );
}

export function DashboardActionLink({
  href,
  children,
  icon = 'plus',
}: {
  href: string;
  children: ReactNode;
  icon?: AppIconName;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 border border-cyan-300/30 bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-950/20 transition-colors hover:border-cyan-300 hover:bg-slate-800"
    >
      <AppIcon name={icon} className="h-4 w-4 text-white" />
      {children}
    </Link>
  );
}
