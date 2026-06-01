import { EmptyState } from '@/components/ui/empty-state';

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Welcome to Pro-Insight 360. Here is an overview of your work.
        </p>
      </div>

      {/* Stats row — placeholder for Phase 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Evaluations', value: '—', icon: '📋' },
          { label: 'Responses Collected', value: '—', icon: '💬' },
          { label: 'Gaps Identified', value: '—', icon: '🔍' },
          { label: 'Reports Generated', value: '—', icon: '📄' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200 p-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl" aria-hidden="true">
                {stat.icon}
              </span>
              <p className="text-sm font-medium text-slate-600">{stat.label}</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent evaluations — empty state */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">
            Recent Evaluations
          </h2>
        </div>
        <EmptyState
          icon="📋"
          title="No evaluations yet"
          description="Create your first evaluation project to start collecting organisational data."
          actionLabel="Create Evaluation"
          onAction={() => (window.location.href = '/evaluations/new')}
        />
      </div>
    </div>
  );
}
