'use client';

import { useState } from 'react';
import { EmptyState } from '@/components/ui/empty-state';

interface ConflictingValue {
  respondentId: string;
  value: unknown;
}

interface Conflict {
  id: string;
  questionId: string;
  conflictType: 'NUMERIC_VARIANCE' | 'CONTRADICTORY_CHOICE';
  conflictingValues: ConflictingValue[];
  isResolved: boolean;
  resolutionNote?: string;
  resolvedAt?: string;
  question: { label: string; type: string };
  resolvedBy?: { email: string };
}

interface ConflictsPanelProps {
  conflicts: Conflict[];
  onResolve: (conflictId: string, note: string) => Promise<void>;
}

export function ConflictsPanel({ conflicts, onResolve }: ConflictsPanelProps) {
  const [resolving, setResolving] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const unresolved = conflicts.filter((c) => !c.isResolved);
  const resolved = conflicts.filter((c) => c.isResolved);

  function openResolve(id: string) {
    setSelectedId(id);
    setNote('');
    setConfirmOpen(true);
  }

  async function handleConfirmResolve() {
    if (!selectedId) return;
    setResolving(selectedId);
    setConfirmOpen(false);
    try {
      await onResolve(selectedId, note);
    } finally {
      setResolving(null);
      setSelectedId(null);
    }
  }

  const conflictTypeLabel = (type: string) =>
    type === 'NUMERIC_VARIANCE' ? 'Numeric variance' : 'Contradictory answers';

  return (
    <div className="space-y-4">
      {/* Unresolved */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">
          Unresolved conflicts
          {unresolved.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
              {unresolved.length}
            </span>
          )}
        </h3>

        {unresolved.length === 0 ? (
          <EmptyState
            icon="✅"
            title="No unresolved conflicts"
            description="All response conflicts have been reviewed and resolved."
          />
        ) : (
          <div className="space-y-3">
            {unresolved.map((conflict) => (
              <div
                key={conflict.id}
                className="border border-red-200 bg-red-50 rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 mb-1">
                      {conflict.question.label}
                    </p>
                    <p className="text-xs text-slate-500 mb-3">
                      {conflictTypeLabel(conflict.conflictType)} — {conflict.conflictingValues.length} conflicting responses
                    </p>

                    {/* Show conflicting values */}
                    <div className="space-y-1">
                      {conflict.conflictingValues.map((cv, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs text-slate-600"
                        >
                          <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" aria-hidden="true" />
                          <span className="font-mono bg-white px-2 py-0.5 rounded border border-red-200">
                            {String(cv.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => openResolve(conflict.id)}
                    disabled={resolving === conflict.id}
                    className="shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
                  >
                    {resolving === conflict.id ? 'Resolving…' : 'Mark resolved'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved */}
      {resolved.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-500 mb-3">
            Resolved ({resolved.length})
          </h3>
          <div className="space-y-2">
            {resolved.map((conflict) => (
              <div
                key={conflict.id}
                className="border border-slate-200 bg-slate-50 rounded-xl p-3"
              >
                <p className="text-sm text-slate-600">{conflict.question.label}</p>
                {conflict.resolutionNote && (
                  <p className="text-xs text-slate-400 mt-1">
                    Note: {conflict.resolutionNote}
                  </p>
                )}
                {conflict.resolvedBy && (
                  <p className="text-xs text-slate-400">
                    Resolved by {conflict.resolvedBy.email}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolution dialog with note input */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resolve-title"
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmOpen(false)} aria-hidden="true" />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 id="resolve-title" className="text-lg font-semibold text-slate-900 mb-2">
              Mark conflict as resolved
            </h2>
            <p className="text-sm text-slate-600 mb-3">
              Add a note explaining how this conflict was resolved.
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Verified with department head — the correct figure is 45 computers."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolve}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
