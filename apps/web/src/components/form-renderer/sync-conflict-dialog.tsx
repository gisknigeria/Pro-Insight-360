'use client';

interface SyncConflictDialogProps {
  open: boolean;
  localSavedAt: string;
  serverSubmittedAt: string;
  onKeepLocal: () => void;
  onKeepServer: () => void;
  onMerge?: () => void;
}

/**
 * Shown when a sync conflict is detected — a response already exists on the server.
 * Presents three plain-language options. (Requirement 6.5)
 */
export function SyncConflictDialog({
  open,
  localSavedAt,
  serverSubmittedAt,
  onKeepLocal,
  onKeepServer,
  onMerge,
}: SyncConflictDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-title"
    >
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl" aria-hidden="true">⚠️</span>
          <div>
            <h2 id="conflict-title" className="text-lg font-semibold text-slate-900">
              Response conflict detected
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              A response for this form already exists on the server. Your locally saved version is different. Which version would you like to keep?
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Your local version</p>
            <p className="text-sm text-slate-700">Saved offline on {new Date(localSavedAt).toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Server version</p>
            <p className="text-sm text-slate-700">Submitted on {new Date(serverSubmittedAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={onKeepLocal}
            className="w-full py-2.5 px-4 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
          >
            Use my local version
          </button>
          <button
            onClick={onKeepServer}
            className="w-full py-2.5 px-4 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Keep the server version
          </button>
          {onMerge && (
            <button
              onClick={onMerge}
              className="w-full py-2.5 px-4 text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Review both and merge
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
