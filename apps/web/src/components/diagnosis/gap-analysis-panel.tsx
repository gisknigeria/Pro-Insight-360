import { EmptyState } from '@/components/ui/empty-state';

type GapSeverity = 'critical' | 'high' | 'medium' | 'low';

interface Gap {
  category: string;
  description: string;
  severity: GapSeverity;
  affectedDepartments: string[];
  evidence?: string[];
  recommendedAction: string;
}

interface GapSummary {
  total: number;
  bySeverity: Record<GapSeverity, number>;
  byCategory: Record<string, Gap[]>;
  gaps: Gap[];
}

interface GapAnalysisPanelProps {
  summary: GapSummary | null;
}

const SEVERITY_CONFIG: Record<GapSeverity, { label: string; color: string; bg: string; dot: string }> = {
  critical: { label: 'Critical', color: 'text-red-700', bg: 'bg-red-50 border-red-200', dot: 'bg-red-500' },
  high: { label: 'High', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', dot: 'bg-orange-500' },
  medium: { label: 'Medium', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500' },
  low: { label: 'Low', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', dot: 'bg-slate-400' },
};

export function GapAnalysisPanel({ summary }: GapAnalysisPanelProps) {
  if (!summary) {
    return (
      <EmptyState
        icon="🔍"
        title="No gap analysis yet"
        description="Run the gap analysis to identify hardware, software, skills, and process gaps."
      />
    );
  }

  if (summary.total === 0) {
    return (
      <EmptyState
        icon="✅"
        title="No gaps identified"
        description="The evaluation data did not reveal any significant gaps at this time."
      />
    );
  }

  const severities: GapSeverity[] = ['critical', 'high', 'medium', 'low'];

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {severities.map((sev) => {
          const count = summary.bySeverity[sev] ?? 0;
          const cfg = SEVERITY_CONFIG[sev];
          return (
            <div key={sev} className={`rounded-xl border p-4 ${cfg.bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} aria-hidden="true" />
                <p className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>
                  {cfg.label}
                </p>
              </div>
              <p className={`text-2xl font-bold ${cfg.color}`}>{count}</p>
            </div>
          );
        })}
      </div>

      {/* Gaps by category */}
      {Object.entries(summary.byCategory).map(([category, gaps]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span>{category}</span>
            <span className="text-xs font-normal text-slate-400">({gaps.length} gap{gaps.length !== 1 ? 's' : ''})</span>
          </h3>
          <div className="space-y-3">
            {gaps.map((gap, i) => {
              const cfg = SEVERITY_CONFIG[gap.severity];
              return (
                <div key={i} className={`rounded-xl border p-4 ${cfg.bg}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-sm font-medium text-slate-900">{gap.description}</p>
                    <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>

                  {Array.isArray(gap.evidence) && gap.evidence.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-slate-500 mb-1">Evidence:</p>
                      <ul className="space-y-0.5">
                        {gap.evidence.slice(0, 3).map((e, j) => (
                          <li key={j} className="text-xs text-slate-600 flex items-start gap-1.5">
                            <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-slate-400" aria-hidden="true" />
                            {e}
                          </li>
                        ))}
                        {gap.evidence.length > 3 && (
                          <li className="text-xs text-slate-400">+{gap.evidence.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="mt-2 p-2 bg-white/60 rounded-lg border border-white">
                    <p className="text-xs font-medium text-slate-600 mb-0.5">Recommended action:</p>
                    <p className="text-xs text-slate-700">{gap.recommendedAction}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
