'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import type { QuestionDefinition } from './form-builder.types';
import { QUESTION_TYPES } from './question-types';

interface QuestionCardProps {
  question: QuestionDefinition;
  onUpdate: (updated: QuestionDefinition) => void;
  onDelete: (questionId: string) => void;
}

export function QuestionCard({ question, onUpdate, onDelete }: QuestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const typeConfig = QUESTION_TYPES.find((t) => t.type === question.type);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.questionId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const DIMENSION_OPTIONS = ['WHO', 'WHAT', 'HOW', 'WHEN'] as const;

  function toggleDimension(dim: 'WHO' | 'WHAT' | 'HOW' | 'WHEN') {
    const current = question.dimensions ?? [];
    const updated = current.includes(dim)
      ? current.filter((d) => d !== dim)
      : [...current, dim];
    onUpdate({ ...question, dimensions: updated });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-xl shadow-sm transition-shadow ${
        isDragging ? 'shadow-lg border-blue-400' : 'border-slate-200 hover:shadow-md'
      }`}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing p-1 rounded"
          aria-label="Drag to reorder this question"
          title="Drag to reorder"
        >
          ⠿
        </button>

        {/* Type icon + label */}
        <span className="text-base" aria-hidden="true">
          {typeConfig?.icon ?? '❓'}
        </span>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {typeConfig?.label ?? question.type}
        </span>

        {/* Question label (editable) */}
        <input
          type="text"
          value={question.label}
          onChange={(e) => onUpdate({ ...question, label: e.target.value })}
          placeholder="Enter your question here…"
          className="flex-1 text-sm font-medium text-slate-900 bg-transparent border-none outline-none placeholder-slate-300"
          aria-label="Question text"
        />

        {/* Required toggle */}
        <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
          <input
            type="checkbox"
            checked={question.isRequired}
            onChange={(e) =>
              onUpdate({ ...question, isRequired: e.target.checked })
            }
            className="rounded"
            aria-label="Mark as required"
          />
          Required
        </label>

        {/* Expand/collapse */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-400 hover:text-slate-600 p-1 rounded"
          aria-label={isExpanded ? 'Collapse question settings' : 'Expand question settings'}
          aria-expanded={isExpanded}
        >
          {isExpanded ? '▲' : '▼'}
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(question.questionId)}
          className="text-slate-300 hover:text-red-500 p-1 rounded transition-colors"
          aria-label={`Delete question: ${question.label || 'untitled'}`}
          title="Delete this question"
        >
          🗑️
        </button>
      </div>

      {/* Expanded settings */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
          {/* Helper text */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Helper text
              <span className="font-normal text-slate-400 ml-1">
                (shown below the question to guide respondents)
              </span>
            </label>
            <input
              type="text"
              value={question.helperText ?? ''}
              onChange={(e) =>
                onUpdate({ ...question, helperText: e.target.value })
              }
              placeholder="e.g. Enter the number of full-time staff, e.g. 45"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Evaluation dimensions */}
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">
              Evaluation dimensions
              <span className="font-normal text-slate-400 ml-1">
                (tag this question with one or more dimensions)
              </span>
            </p>
            <div className="flex gap-2 flex-wrap">
              {DIMENSION_OPTIONS.map((dim) => (
                <button
                  key={dim}
                  onClick={() => toggleDimension(dim)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    question.dimensions?.includes(dim)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                  }`}
                  aria-pressed={question.dimensions?.includes(dim)}
                >
                  {dim}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
