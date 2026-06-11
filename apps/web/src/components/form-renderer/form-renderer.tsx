'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FormDefinition, QuestionDefinition } from '../form-builder/form-builder.types';
import {
  isQuestionVisible,
  isQuestionRequired,
  isLayoutQuestion,
  isAnswerEmpty,
} from '@/lib/conditional-logic';
import { QuestionInput } from './question-input';

interface FormRendererProps {
  definition: FormDefinition;
  formId: string;
  initialAnswers?: Record<string, unknown>;
  onSubmit: (answers: Record<string, unknown>) => Promise<void>;
  onSaveDraft?: (answers: Record<string, unknown>) => Promise<void>;
}

function answersToPayload(answers: Record<string, unknown>) {
  return Object.entries(answers)
    .filter(([, v]) => !isAnswerEmpty(v))
    .map(([questionId, value]) => ({ questionId, value }));
}

export function FormRenderer({
  definition,
  formId,
  initialAnswers = {},
  onSubmit,
  onSaveDraft,
}: FormRendererProps) {
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialAnswers);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const pages = definition.pages;
  const currentPage = pages[currentPageIndex];
  const isLastPage = currentPageIndex === pages.length - 1;
  const isFirstPage = currentPageIndex === 0;

  const visibleOnPage = (currentPage?.questions ?? []).filter((q) =>
    isQuestionVisible(q, definition.conditionalLogic, answers),
  );

  const allAnswerable = pages
    .flatMap((p) => p.questions)
    .filter(
      (q) =>
        isQuestionVisible(q, definition.conditionalLogic, answers) &&
        !isLayoutQuestion(q.type),
    );

  const saveDraftNow = useCallback(async () => {
    if (!onSaveDraft) return;
    setSaving(true);
    try {
      await onSaveDraft(answers);
      setLastSaved(new Date());
    } finally {
      setSaving(false);
    }
  }, [answers, onSaveDraft]);

  useEffect(() => {
    if (!onSaveDraft) return;
    const interval = setInterval(() => {
      saveDraftNow();
    }, 30000);
    return () => clearInterval(interval);
  }, [onSaveDraft, saveDraftNow]);

  function setAnswer(questionId: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (errors[questionId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  }

  function validatePage(): { valid: boolean; newErrors: Record<string, string> } {
    const newErrors: Record<string, string> = {};
    for (const q of visibleOnPage) {
      if (isLayoutQuestion(q.type)) continue;
      if (
        isQuestionRequired(q, definition.conditionalLogic, answers) &&
        isAnswerEmpty(answers[q.questionId])
      ) {
        newErrors[q.questionId] =
          'This question is required. Please provide an answer before continuing.';
      }
    }
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return { valid: Object.keys(newErrors).length === 0, newErrors };
  }

  function validateAll(): { valid: boolean; newErrors: Record<string, string> } {
    const newErrors: Record<string, string> = {};
    for (const q of allAnswerable) {
      if (
        isQuestionRequired(q, definition.conditionalLogic, answers) &&
        isAnswerEmpty(answers[q.questionId])
      ) {
        newErrors[q.questionId] =
          'This question is required. Please provide an answer.';
      }
    }
    setErrors(newErrors);
    return { valid: Object.keys(newErrors).length === 0, newErrors };
  }

  function scrollToFirstError(errorMap: Record<string, string>) {
    const firstId = Object.keys(errorMap)[0];
    if (firstId) {
      document.getElementById(`q-${firstId}`)?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async function handleNext() {
    const { valid, newErrors } = validatePage();
    if (!valid) {
      scrollToFirstError(newErrors);
      return;
    }
    await saveDraftNow();
    setCurrentPageIndex((i) => Math.min(i + 1, pages.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');

    const { valid, newErrors } = validateAll();
    if (!valid) {
      scrollToFirstError(newErrors);
      const errorPage = pages.findIndex((p) =>
        p.questions.some((q) => newErrors[q.questionId]),
      );
      if (errorPage >= 0) setCurrentPageIndex(errorPage);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(answers);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to submit. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const completedCount = allAnswerable.filter(
    (q) => !isAnswerEmpty(answers[q.questionId]),
  ).length;

  const requiredTotal = allAnswerable.filter((q) =>
    isQuestionRequired(q, definition.conditionalLogic, answers),
  ).length;

  const requiredDone = allAnswerable.filter(
    (q) =>
      isQuestionRequired(q, definition.conditionalLogic, answers) &&
      !isAnswerEmpty(answers[q.questionId]),
  ).length;

  const progressPct =
    requiredTotal > 0 ? Math.round((requiredDone / requiredTotal) * 100) : 100;

  function renderQuestion(question: QuestionDefinition) {
    if (question.type === 'section_header') {
      return (
        <div key={question.questionId} className="pt-4 pb-2 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">
            {question.label || 'Section'}
          </h3>
        </div>
      );
    }

    return (
      <div key={question.questionId} id={`q-${question.questionId}`}>
        {!isLayoutQuestion(question.type) && (
          <label
            htmlFor={`input-${question.questionId}`}
            className="block text-sm font-medium text-slate-900 mb-1.5"
          >
            {question.label || (
              <span className="text-slate-400 italic">Untitled question</span>
            )}
            {isQuestionRequired(question, definition.conditionalLogic, answers) && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        {question.helperText && question.type !== 'instruction_block' && (
          <p className="text-xs text-slate-500 mb-2">{question.helperText}</p>
        )}

        <div id={`input-${question.questionId}`}>
          <QuestionInput
            question={question}
            formId={formId}
            value={answers[question.questionId]}
            onChange={(val) => setAnswer(question.questionId, val)}
          />
        </div>

        {errors[question.questionId] && (
          <p role="alert" className="mt-1.5 text-xs text-red-600">
            {errors[question.questionId]}
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>
            Page {currentPageIndex + 1} of {pages.length}
            {pages.length > 1 && currentPage?.title ? ` — ${currentPage.title}` : ''}
          </span>
          <span>
            {completedCount} of {allAnswerable.length} answered · {progressPct}% complete
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Form completion: ${progressPct}%`}
          />
        </div>
      </div>

      {(lastSaved || saving) && onSaveDraft && (
        <p className="text-xs text-slate-400 mb-4" role="status">
          {saving
            ? 'Saving your progress…'
            : `Draft saved at ${lastSaved?.toLocaleTimeString()}`}
        </p>
      )}

      <div className="space-y-6">
        {visibleOnPage.length === 0 ? (
          <p className="text-slate-500 text-sm">No questions on this page.</p>
        ) : (
          visibleOnPage.map(renderQuestion)
        )}
      </div>

      {submitError && (
        <div
          role="alert"
          className="mt-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg"
        >
          {submitError}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {onSaveDraft && (
          <button
            type="button"
            disabled={saving}
            onClick={saveDraftNow}
            className="px-4 py-2.5 min-h-[44px] text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Save and continue later
          </button>
        )}

        {!isFirstPage && (
          <button
            type="button"
            onClick={() => {
              setCurrentPageIndex((i) => i - 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-4 py-2.5 min-h-[44px] text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Previous page
          </button>
        )}

        {!isLastPage ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 py-2.5 px-4 min-h-[44px] bg-primary hover:bg-primary-dark text-white font-medium rounded-lg text-sm"
          >
            Next page
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 px-4 min-h-[44px] bg-primary hover:bg-primary-dark disabled:bg-amber-300 text-white font-medium rounded-lg text-sm"
            aria-busy={submitting}
          >
            {submitting ? 'Submitting…' : 'Submit response'}
          </button>
        )}
      </div>
    </form>
  );
}

export { answersToPayload };
