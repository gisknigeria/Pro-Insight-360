import type { AppIconName } from '../ui/app-icons';

export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'date'
  | 'date_range'
  | 'time'
  | 'dropdown'
  | 'single_choice'
  | 'multiple_choice'
  | 'checkbox'
  | 'yes_no'
  | 'rating_scale'
  | 'likert_scale'
  | 'matrix'
  | 'ranking'
  | 'slider'
  | 'net_promoter_score'
  | 'file_upload'
  | 'photo_upload'
  | 'video_upload'
  | 'staff_hierarchy'
  | 'workflow_step'
  | 'approval_chain'
  | 'section_header'
  | 'instruction_block';

export interface QuestionTypeConfig {
  type: QuestionType;
  label: string;
  icon: AppIconName;
  description: string;
  category: 'text' | 'choice' | 'scale' | 'media' | 'structured' | 'layout';
}

export const QUESTION_TYPES: QuestionTypeConfig[] = [
  { type: 'short_text', label: 'Short Text', icon: 'edit', description: 'Single line text answer', category: 'text' },
  { type: 'long_text', label: 'Long Text', icon: 'form', description: 'Multi-line text answer', category: 'text' },
  { type: 'number', label: 'Number', icon: 'grid', description: 'Numeric answer', category: 'text' },
  { type: 'date', label: 'Date', icon: 'calendar', description: 'Date picker', category: 'text' },
  { type: 'date_range', label: 'Date Range', icon: 'calendar', description: 'Start and end date', category: 'text' },
  { type: 'time', label: 'Time', icon: 'activity', description: 'Time picker', category: 'text' },

  { type: 'dropdown', label: 'Dropdown', icon: 'chevronRight', description: 'Select one from a list', category: 'choice' },
  { type: 'single_choice', label: 'Single Choice', icon: 'check', description: 'Radio button selection', category: 'choice' },
  { type: 'multiple_choice', label: 'Multiple Choice', icon: 'clipboard', description: 'Select multiple options', category: 'choice' },
  { type: 'checkbox', label: 'Checkbox', icon: 'check', description: 'Yes/No checkbox', category: 'choice' },
  { type: 'yes_no', label: 'Yes / No', icon: 'check', description: 'Simple yes or no', category: 'choice' },

  { type: 'rating_scale', label: 'Rating Scale', icon: 'activity', description: '1-5 or 1-10 rating', category: 'scale' },
  { type: 'likert_scale', label: 'Likert Scale', icon: 'chart', description: 'Strongly agree to strongly disagree', category: 'scale' },
  { type: 'matrix', label: 'Matrix / Table', icon: 'grid', description: 'Grid of questions and options', category: 'scale' },
  { type: 'ranking', label: 'Ranking', icon: 'chart', description: 'Order items by preference', category: 'scale' },
  { type: 'slider', label: 'Slider', icon: 'settings', description: 'Drag to select a value', category: 'scale' },
  { type: 'net_promoter_score', label: 'NPS Score', icon: 'chart', description: '0-10 Net Promoter Score', category: 'scale' },

  { type: 'file_upload', label: 'File Upload', icon: 'upload', description: 'Upload any file', category: 'media' },
  { type: 'photo_upload', label: 'Photo Upload', icon: 'file', description: 'Upload a photo', category: 'media' },
  { type: 'video_upload', label: 'Video Upload', icon: 'play', description: 'Upload a video', category: 'media' },

  { type: 'staff_hierarchy', label: 'Staff Hierarchy', icon: 'users', description: 'Capture reporting structure', category: 'structured' },
  { type: 'workflow_step', label: 'Workflow Step', icon: 'activity', description: 'Describe a process step', category: 'structured' },
  { type: 'approval_chain', label: 'Approval Chain', icon: 'check', description: 'Map approval sequence', category: 'structured' },

  { type: 'section_header', label: 'Section Header', icon: 'file', description: 'Add a section title', category: 'layout' },
  { type: 'instruction_block', label: 'Instructions', icon: 'info', description: 'Add guidance text', category: 'layout' },
];

export const CATEGORY_LABELS: Record<QuestionTypeConfig['category'], string> = {
  text: 'Text & Numbers',
  choice: 'Choice & Selection',
  scale: 'Scales & Ratings',
  media: 'File & Media',
  structured: 'Structured Data',
  layout: 'Layout',
};
