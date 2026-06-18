'use client';

import {
  QUESTION_TYPES,
  CATEGORY_LABELS,
  QuestionTypeConfig,
  QuestionType,
} from './question-types';
import { AppIcon } from '../ui/app-icons';

interface QuestionPaletteProps {
  onAddQuestion: (questionType: QuestionType) => void;
}

function ClickableQuestionType({ config, onAddQuestion }: { config: QuestionTypeConfig; onAddQuestion: (questionType: QuestionType) => void }) {
  return (
    <button
      type="button"
      onClick={() => onAddQuestion(config.type)}
      className="flex items-center gap-2 w-full bg-white px-3 py-2 text-left text-sm shadow-sm transition-colors hover:bg-amber-50"
      title={config.description}
    >
      <span className="text-primary" aria-hidden="true">
        <AppIcon name={config.icon} className="h-5 w-5" />
      </span>
      <span className="font-medium text-slate-700">{config.label}</span>
    </button>
  );
}

export function QuestionPalette({ onAddQuestion }: QuestionPaletteProps) {
  const categories = Object.keys(CATEGORY_LABELS) as QuestionTypeConfig['category'][];

  return (
    <aside
      className="w-64 shrink-0 bg-slate-50 border-r border-slate-200 overflow-y-auto"
      aria-label="Question types - click to add to the form canvas"
    >
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-900">Question Types</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Click a type to add it to the form
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
                  <ClickableQuestionType
                    key={config.type}
                    config={config}
                    onAddQuestion={onAddQuestion}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

