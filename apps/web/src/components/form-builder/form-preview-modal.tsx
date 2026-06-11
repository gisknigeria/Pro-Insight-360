'use client';

import { useEffect } from 'react';
import type { FormDefinition, QuestionDefinition } from './form-builder.types';
import { QUESTION_TYPES } from './question-types';

interface FormPreviewModalProps {
  open: boolean;
  definition: FormDefinition;
  onClose: () => void;
}

function QuestionPreview({ question }: { question: QuestionDefinition }) {
  const typeConfig = QUESTION_TYPES.find((t) => t.type === question.type);

  const renderInput = () => {
    switch (question.type) {
      case 'short_text':
        return (
          <input
            type="text"
            disabled
            placeholder="Type your answer here…"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50"
          />
        );
      case 'long_text':
        return (
          <textarea
            disabled
            rows={3}
            placeholder="Type your answer here…"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 resize-none"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            disabled
            placeholder="0"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50"
          />
        );
      case 'yes_no':
        return (
          <div className="flex gap-3">
            {['Yes', 'No'].map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm text-slate-700">
                <input type="radio" disabled name={question.questionId} />
                {opt}
              </label>
            ))}
          </div>
        );
      case 'rating_scale':
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                disabled
                className="w-10 h-10 rounded-lg border border-slate-300 text-sm font-medium text-slate-600 bg-slate-50"
              >
                {n}
              </button>
            ))}
          </div>
        );
      case 'dropdown':
        return (
          <select
            disabled
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50"
          >
            <option>Select an option…</option>
          </select>
        );
      case 'file_upload':
      case 'photo_upload':
      case 'video_upload':
        return (
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center text-sm text-slate-400">
            {typeConfig?.icon} Click to upload or drag and drop
          </div>
        );
      case 'section_header':
        return null;
      case 'instruction_block':
        return (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            ℹ️ Instruction text will appear here
          </div>
        );
      default:
        return (
          <div className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-400 bg-slate-50">
            {typeConfig?.label ?? question.type} input
          </div>
        );
    }
  };

  if (question.type === 'section_header') {
    return (
      <div className="pt-4 pb-2 border-b border-slate-200">
        <h3 className="text-base font-semibold text-slate-900">
          {question.label || 'Section Title'}
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-900">
        {question.label || <span className="text-slate-400 italic">Untitled question</span>}
        {question.isRequired && (
          <span className="text-red-500 ml-1" aria-label="required">*</span>
        )}
      </label>
      {question.helperText && (
        <p className="text-xs text-slate-500">{question.helperText}</p>
      )}
      {renderInput()}
    </div>
  );
}

export function FormPreviewModal({
  open,
  definition,
  onClose,
}: FormPreviewModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const questionsByPage = definition.pages;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Form preview"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <p className="text-xs font-medium text-primary uppercase tracking-wide mb-0.5">
              Preview — as respondents will see it
            </p>
            <h2 className="text-lg font-semibold text-slate-900">
              {definition.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg"
            aria-label="Close preview"
          >
            ✕
          </button>
        </div>

        {/* Form content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {questionsByPage.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">
              No questions added yet. Add questions to see the preview.
            </p>
          ) : (
            questionsByPage.map((page) => (
              <div key={page.pageId} className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500 mb-1">
                    Page {definition.pages.indexOf(page) + 1} of {definition.pages.length}
                  </p>
                  <h3 className="text-base font-semibold text-slate-900">{page.title}</h3>
                </div>
                <div className="space-y-4">
                  {page.questions.map((q) => (
                    <QuestionPreview key={q.questionId} question={q} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
