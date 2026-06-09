'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { QuestionPalette } from './question-palette';
import { QuestionCard } from './question-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { FormDefinition, QuestionDefinition, ConditionalRule } from './form-builder.types';
import type { QuestionType } from './question-types';
import { QUESTION_TYPES } from './question-types';

interface FormBuilderCanvasProps {
  initialDefinition?: FormDefinition;
  formTitle: string;
  onSave: (definition: FormDefinition) => Promise<void>;
  onPreview: (definition: FormDefinition) => void;
}

function generateId(): string {
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function FormBuilderCanvas({
  initialDefinition,
  formTitle,
  onSave,
  onPreview,
}: FormBuilderCanvasProps) {
  const [definition, setDefinition] = useState<FormDefinition>(
    initialDefinition ?? {
      formId: generateId(),
      title: formTitle,
      pages: [{ pageId: 'page-1', title: 'Page 1', questions: [] }],
      conditionalLogic: [],
      version: 1,
    },
  );

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [dependentRules, setDependentRules] = useState<ConditionalRule[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const currentPage = definition.pages[0]; // single-page for now
  const questions = currentPage.questions;

  function updateQuestions(updated: QuestionDefinition[]) {
    setDefinition((prev) => ({
      ...prev,
      pages: [{ ...currentPage, questions: updated }],
    }));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    // Dropped from palette — add new question
    if (String(active.id).startsWith('palette-')) {
      const questionType = active.data.current?.questionType as QuestionType;
      const typeConfig = QUESTION_TYPES.find((t) => t.type === questionType);
      if (!questionType) return;

      const newQuestion: QuestionDefinition = {
        questionId: generateId(),
        type: questionType,
        label: '',
        helperText: typeConfig?.description,
        isRequired: false,
        config: {},
        dimensions: [],
        position: questions.length,
      };

      updateQuestions([...questions, newQuestion]);
      return;
    }

    // Reorder existing questions
    if (active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.questionId === active.id);
      const newIndex = questions.findIndex((q) => q.questionId === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(questions, oldIndex, newIndex).map(
          (q, i) => ({ ...q, position: i }),
        );
        updateQuestions(reordered);
      }
    }
  }

  function handleUpdateQuestion(updated: QuestionDefinition) {
    updateQuestions(
      questions.map((q) =>
        q.questionId === updated.questionId ? updated : q,
      ),
    );
  }

  function handleDeleteRequest(questionId: string) {
    // Check for dependent conditional logic rules
    const deps = definition.conditionalLogic.filter(
      (rule) =>
        rule.condition.sourceQuestionId === questionId ||
        rule.targetQuestionId === questionId,
    );

    if (deps.length > 0) {
      setDependentRules(deps);
      setDeleteTarget(questionId);
    } else {
      confirmDelete(questionId);
    }
  }

  function confirmDelete(questionId: string) {
    updateQuestions(questions.filter((q) => q.questionId !== questionId));
    // Also remove any conditional logic referencing this question
    setDefinition((prev) => ({
      ...prev,
      conditionalLogic: prev.conditionalLogic.filter(
        (rule) =>
          rule.condition.sourceQuestionId !== questionId &&
          rule.targetQuestionId !== questionId,
      ),
    }));
    setDeleteTarget(null);
    setDependentRules([]);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    try {
      await onSave(definition);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save. Please try again.';
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }

  const questionLabel =
    deleteTarget
      ? questions.find((q) => q.questionId === deleteTarget)?.label || 'this question'
      : '';

  return (
    <div className="flex h-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {/* Question palette */}
        <QuestionPalette />

        {/* Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col gap-4 px-6 py-3 border-b border-slate-200 bg-white sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3 w-full">
              <div>
                <label htmlFor="form-title" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Form title
                </label>
                <input
                  id="form-title"
                  value={definition.title}
                  onChange={(event) =>
                    setDefinition((prev) => prev && ({ ...prev, title: event.target.value }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Untitled form"
                />
              </div>
              <div>
                <label htmlFor="form-description" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Description
                </label>
                <textarea
                  id="form-description"
                  value={definition.description ?? ''}
                  onChange={(event) =>
                    setDefinition((prev) => prev && ({ ...prev, description: event.target.value }))
                  }
                  rows={2}
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Describe what this form is for"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onPreview(definition)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                👁️ Preview
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
                aria-busy={saving}
              >
                {saving ? 'Saving…' : '💾 Save Form'}
              </button>
            </div>
          </div>

          {saveError && (
            <div role="alert" className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {saveError}
            </div>
          )}

          {/* Drop zone */}
          <div className="flex-1 overflow-y-auto p-6">
            <SortableContext
              items={questions.map((q) => q.questionId)}
              strategy={verticalListSortingStrategy}
            >
              {questions.length === 0 ? (
                <EmptyState
                  icon="📝"
                  title="No questions yet"
                  description="Drag a question type from the left panel onto this canvas to get started."
                />
              ) : (
                <div className="space-y-3 max-w-3xl mx-auto">
                  {questions.map((question) => (
                    <QuestionCard
                      key={question.questionId}
                      question={question}
                      onUpdate={handleUpdateQuestion}
                      onDelete={handleDeleteRequest}
                    />
                  ))}
                </div>
              )}
            </SortableContext>
          </div>
        </div>
      </DndContext>

      {/* Confirm delete dialog — warns about dependent conditional logic */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete "${questionLabel}"?`}
        description={
          dependentRules.length > 0
            ? `This question is referenced by ${dependentRules.length} conditional logic rule${dependentRules.length > 1 ? 's' : ''}. Deleting it will also remove those rules. This cannot be undone.`
            : `This will permanently remove the question from the form. This cannot be undone.`
        }
        confirmLabel="Delete Question"
        cancelLabel="Keep Question"
        destructive
        onConfirm={() => deleteTarget && confirmDelete(deleteTarget)}
        onCancel={() => {
          setDeleteTarget(null);
          setDependentRules([]);
        }}
      />
    </div>
  );
}
