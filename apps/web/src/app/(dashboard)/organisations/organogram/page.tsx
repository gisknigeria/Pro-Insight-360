import Link from 'next/link';
import OrganogramIntakeManager from '@/components/organogram/OrganogramIntakeManager';
import { AppIcon } from '@/components/ui/app-icons';
import { DashboardPageFrame } from '@/components/ui/dashboard-chrome';

interface OrganisationOrganogramPageProps {
  searchParams?: Promise<{ orgId?: string }>;
}

export default async function OrganisationOrganogramPage({ searchParams }: OrganisationOrganogramPageProps) {
  const resolvedSearchParams = await searchParams;
  const initialOrgId = resolvedSearchParams?.orgId || '';

  return (
    <DashboardPageFrame>
      <div className="border border-slate-900 bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Client organisations</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Organogram Intake</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
              Create organisation-specific intake links, collect CEO or HR structure responses, convert them with AI, and publish the organogram back to the organisation account.
            </p>
          </div>
          <Link
            href="/organisations"
            className="inline-flex items-center justify-center gap-2 border border-cyan-300/30 bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:border-cyan-300 hover:bg-slate-800"
          >
            <AppIcon name="chevronRight" className="h-5 w-5 rotate-180" />
            Back to organisations
          </Link>
        </div>
      </div>

      <OrganogramIntakeManager initialOrgId={initialOrgId} />
    </DashboardPageFrame>
  );
}
