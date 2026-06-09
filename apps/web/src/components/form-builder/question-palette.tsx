'use client';

import { useDraggable } from '@dnd-kit/core';
import {
  QUESTION_TYPES,
  CATEGORY_LABELS,
  QuestionTypeConfig,
} from './question-types';

interface DraggableQuestionTypeProps {
  config: QuestionTypeConfig;
}

function DraggableQuestionType({ config }: DraggableQuestionTypeProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${config.type}`,
    data: { type: 'palette-item', questionType: config.type },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-grab text-sm transition-colors ${
        isDragging
          ? 'opacity-50 border-blue-400 bg-blue-50'
          : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50'
      }`}
      title={config.description}
    >
      <span className="text-base w-5 text-center" aria-hidden="true">
        {config.icon}
      </span>
      <span className="font-medium text-slate-700">{config.label}</span>
    </div>
  );
}

export function QuestionPalette() {
  const categories = Object.keys(CATEGORY_LABELS) as QuestionTypeConfig['category'][];

  return (
    <aside
      className="w-64 shrink-0 bg-slate-50 border-r border-slate-200 overflow-y-auto"
      aria-label="Question types — drag onto the form canvas"
    >
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-900">Question Types</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Drag a type onto the form to add it
        </p>
      </div>

      <div className="p-3 space-y-4">
        {categories.map((category) => {
          const items = QUESTION_TYPES.filter((q) => q.category === category);
          return (
            <div key={category}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">
                {CATEGORY_LABELS[category]}
              </p>
              <div className="space-y-1">
                {items.map((config) => (
                  <DraggableQuestionType key={config.type} config={config} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
