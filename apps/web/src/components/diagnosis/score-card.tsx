interface ScoreCardProps {
  label: string;
  score: number;
  band: string;
  icon?: string;
  description?: string;
}

const BAND_COLORS: Record<string, string> = {
  Initial: 'bg-red-100 text-red-700 border-red-200',
  Developing: 'bg-orange-100 text-orange-700 border-orange-200',
  Defined: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Optimising: 'bg-green-100 text-green-700 border-green-200',
  Nascent: 'bg-red-100 text-red-700 border-red-200',
  Emerging: 'bg-orange-100 text-orange-700 border-orange-200',
  Advanced: 'bg-green-100 text-green-700 border-green-200',
  'Very Low': 'bg-red-100 text-red-700 border-red-200',
  Low: 'bg-orange-100 text-orange-700 border-orange-200',
  Moderate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  High: 'bg-amber-100 text-amber-800 border-amber-200',
};

export function ScoreCard({ label, score, band, icon, description }: ScoreCardProps) {
  const bandColor = BAND_COLORS[band] ?? 'bg-slate-100 text-slate-700 border-slate-200';
  const barColor =
    score >= 75 ? 'bg-green-500' :
    score >= 50 ? 'bg-yellow-500' :
    score >= 25 ? 'bg-orange-500' : 'bg-red-500';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && <span className="text-xl" aria-hidden="true">{icon}</span>}
          <p className="text-sm font-medium text-slate-700">{label}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${bandColor}`}>
          {band}
        </span>
      </div>

      <p className="text-3xl font-bold text-slate-900 mb-3">{score.toFixed(1)}%</p>

      {/* Progress bar */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${score}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${score.toFixed(1)}%`}
        />
      </div>

      {description && (
        <p className="text-xs text-slate-500 mt-2">{description}</p>
      )}
    </div>
  );
}
