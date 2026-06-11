'use client';

import type { QuestionDefinition } from '../form-builder/form-builder.types';
import { FileUploadInput, type UploadedFileValue } from './file-upload-input';

interface QuestionInputProps {
  question: QuestionDefinition;
  formId: string;
  value: unknown;
  onChange: (val: unknown) => void;
}

function getOptions(question: QuestionDefinition): string[] {
  const opts = question.config?.options;
  if (Array.isArray(opts) && opts.length > 0) return opts as string[];
  return ['Option 1', 'Option 2', 'Option 3'];
}

function getScaleMax(question: QuestionDefinition): number {
  const max = question.config?.max;
  return typeof max === 'number' ? max : 5;
}

export function QuestionInput({
  question,
  formId,
  value,
  onChange,
}: QuestionInputProps) {
  const baseInputClass =
    'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[44px]';

  const options = getOptions(question);

  switch (question.type) {
    case 'short_text':
      return (
        <input
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
          placeholder="Type your answer here…"
        />
      );

    case 'long_text':
      return (
        <textarea
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className={`${baseInputClass} resize-none`}
          placeholder="Type your answer here…"
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={value === undefined || value === '' ? '' : String(value)}
          onChange={(e) =>
            onChange(e.target.value === '' ? '' : Number(e.target.value))
          }
          className={baseInputClass}
          placeholder="Enter a number…"
        />
      );

    case 'date':
      return (
        <input
          type="date"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
        />
      );

    case 'date_range': {
      const range = (value as { start?: string; end?: string }) ?? {};
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Start date</label>
            <input
              type="date"
              value={range.start ?? ''}
              onChange={(e) => onChange({ ...range, start: e.target.value })}
              className={baseInputClass}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">End date</label>
            <input
              type="date"
              value={range.end ?? ''}
              onChange={(e) => onChange({ ...range, end: e.target.value })}
              className={baseInputClass}
            />
          </div>
        </div>
      );
    }

    case 'time':
      return (
        <input
          type="time"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
        />
      );

    case 'yes_no':
      return (
        <div className="flex gap-4">
          {['Yes', 'No'].map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer min-h-[44px]"
            >
              <input
                type="radio"
                name={question.questionId}
                value={opt}
                checked={value === opt}
                onChange={() => onChange(opt)}
                className="w-4 h-4"
              />
              {opt}
            </label>
          ))}
        </div>
      );

    case 'dropdown':
      return (
        <select
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
        >
          <option value="">Select an option…</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );

    case 'single_choice':
      return (
        <div className="space-y-2">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer min-h-[44px]"
            >
              <input
                type="radio"
                name={question.questionId}
                value={opt}
                checked={value === opt}
                onChange={() => onChange(opt)}
                className="w-4 h-4"
              />
              {opt}
            </label>
          ))}
        </div>
      );

    case 'multiple_choice':
    case 'checkbox': {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="space-y-2">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer min-h-[44px]"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={(e) => {
                  if (e.target.checked) onChange([...selected, opt]);
                  else onChange(selected.filter((s) => s !== opt));
                }}
                className="w-4 h-4 rounded"
              />
              {opt}
            </label>
          ))}
        </div>
      );
    }

    case 'rating_scale': {
      const max = getScaleMax(question);
      return (
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`min-w-[44px] min-h-[44px] rounded-lg border text-sm font-medium transition-colors ${
                value === n
                  ? 'bg-primary text-white border-primary'
                  : 'border-slate-300 text-slate-600 hover:border-blue-400'
              }`}
              aria-pressed={value === n}
              aria-label={`Rating ${n}`}
            >
              {n}
            </button>
          ))}
        </div>
      );
    }

    case 'likert_scale':
      return (
        <div className="space-y-2 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(opt)}
                className={`px-3 py-2 min-h-[44px] rounded-lg border text-xs font-medium transition-colors ${
                  value === opt
                    ? 'bg-primary text-white border-primary'
                    : 'border-slate-300 text-slate-600 hover:border-blue-400'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      );

    case 'slider': {
      const min = (question.config?.min as number) ?? 0;
      const max = (question.config?.max as number) ?? 100;
      const current = typeof value === 'number' ? value : min;
      return (
        <div className="space-y-2">
          <input
            type="range"
            min={min}
            max={max}
            value={current}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-sm text-slate-600 text-center">{current}</p>
        </div>
      );
    }

    case 'net_promoter_score':
      return (
        <div className="flex gap-1 flex-wrap">
          {Array.from({ length: 11 }, (_, i) => i).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`min-w-[36px] min-h-[44px] rounded border text-xs font-medium ${
                value === n
                  ? 'bg-primary text-white border-primary'
                  : 'border-slate-300 text-slate-600'
              }`}
              aria-label={`Score ${n}`}
            >
              {n}
            </button>
          ))}
        </div>
      );

    case 'ranking': {
      const ranked = Array.isArray(value) ? (value as string[]) : [...options];
      return (
        <ol className="space-y-2">
          {ranked.map((opt, index) => (
            <li
              key={opt}
              className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg"
            >
              <span className="text-xs text-slate-400 w-6">{index + 1}.</span>
              <span className="flex-1 text-sm">{opt}</span>
              <button
                type="button"
                disabled={index === 0}
                onClick={() => {
                  const next = [...ranked];
                  [next[index - 1], next[index]] = [next[index], next[index - 1]];
                  onChange(next);
                }}
                className="text-xs px-2 py-1 text-slate-500 disabled:opacity-30"
                aria-label={`Move ${opt} up`}
              >
                ↑
              </button>
              <button
                type="button"
                disabled={index === ranked.length - 1}
                onClick={() => {
                  const next = [...ranked];
                  [next[index], next[index + 1]] = [next[index + 1], next[index]];
                  onChange(next);
                }}
                className="text-xs px-2 py-1 text-slate-500 disabled:opacity-30"
                aria-label={`Move ${opt} down`}
              >
                ↓
              </button>
            </li>
          ))}
        </ol>
      );
    }

    case 'matrix': {
      const rows = (question.config?.rows as string[]) ?? ['Row 1', 'Row 2'];
      const cols = options;
      const matrixVal =
        (value as Record<string, string>) ?? {};
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left" />
                {cols.map((col) => (
                  <th key={col} className="p-2 text-center font-medium text-slate-600">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row} className="border-t border-slate-100">
                  <td className="p-2 font-medium text-slate-700">{row}</td>
                  {cols.map((col) => (
                    <td key={col} className="p-2 text-center">
                      <input
                        type="radio"
                        name={`${question.questionId}-${row}`}
                        checked={matrixVal[row] === col}
                        onChange={() =>
                          onChange({ ...matrixVal, [row]: col })
                        }
                        aria-label={`${row}: ${col}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'file_upload':
      return (
        <FileUploadInput
          formId={formId}
          questionId={question.questionId}
          uploadType="file_upload"
          value={(value as UploadedFileValue) ?? null}
          onChange={onChange}
          label={`Upload file for ${question.label}`}
        />
      );

    case 'photo_upload':
      return (
        <FileUploadInput
          formId={formId}
          questionId={question.questionId}
          uploadType="photo_upload"
          value={(value as UploadedFileValue) ?? null}
          onChange={onChange}
          accept="image/*"
          label={`Upload photo for ${question.label}`}
        />
      );

    case 'video_upload':
      return (
        <FileUploadInput
          formId={formId}
          questionId={question.questionId}
          uploadType="video_upload"
          value={(value as UploadedFileValue) ?? null}
          onChange={onChange}
          accept="video/*"
          label={`Upload video for ${question.label}`}
        />
      );

    case 'staff_hierarchy':
    case 'workflow_step':
    case 'approval_chain':
      return (
        <textarea
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          className={`${baseInputClass} resize-none font-mono text-xs`}
          placeholder="Enter structured data as JSON or plain text…"
        />
      );

    case 'section_header':
      return null;

    case 'instruction_block':
      return (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          {question.helperText ||
            question.label ||
            'Please read the instructions before continuing.'}
        </div>
      );

    default:
      return (
        <input
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
          placeholder="Enter your answer…"
        />
      );
  }
}
