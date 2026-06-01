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
  icon: string;
  description: string;
  category: 'text' | 'choice' | 'scale' | 'media' | 'structured' | 'layout';
}

export const QUESTION_TYPES: QuestionTypeConfig[] = [
  // Text
  { type: 'short_text', label: 'Short Text', icon: '✏️', description: 'Single line text answer', category: 'text' },
  { type: 'long_text', label: 'Long Text', icon: '📝', description: 'Multi-line text answer', category: 'text' },
  { type: 'number', label: 'Number', icon: '🔢', description: 'Numeric answer', category: 'text' },
  { type: 'date', label: 'Date', icon: '📅', description: 'Date picker', category: 'text' },
  { type: 'date_range', label: 'Date Range', icon: '📆', description: 'Start and end date', category: 'text' },
  { type: 'time', label: 'Time', icon: '🕐', description: 'Time picker', category: 'text' },
  // Choice
  { type: 'dropdown', label: 'Dropdown', icon: '▼', description: 'Select one from a list', category: 'choice' },
  { type: 'single_choice', label: 'Single Choice', icon: '🔘', description: 'Radio button selection', category: 'choice' },
  { type: 'multiple_choice', label: 'Multiple Choice', icon: '☑️', description: 'Select multiple options', category: 'choice' },
  { type: 'checkbox', label: 'Checkbox', icon: '✅', description: 'Yes/No checkbox', category: 'choice' },
  { type: 'yes_no', label: 'Yes / No', icon: '👍', description: 'Simple yes or no', category: 'choice' },
  // Scale
  { type: 'rating_scale', label: 'Rating Scale', icon: '⭐', description: '1–5 or 1–10 rating', category: 'scale' },
  { type: 'likert_scale', label: 'Likert Scale', icon: '📊', description: 'Strongly agree to strongly disagree', category: 'scale' },
  { type: 'matrix', label: 'Matrix / Table', icon: '🗂️', description: 'Grid of questions and options', category: 'scale' },
  { type: 'ranking', label: 'Ranking', icon: '🏆', description: 'Order items by preference', category: 'scale' },
  { type: 'slider', label: 'Slider', icon: '🎚️', description: 'Drag to select a value', category: 'scale' },
  { type: 'net_promoter_score', label: 'NPS Score', icon: '📈', description: '0–10 Net Promoter Score', category: 'scale' },
  // Media
  { type: 'file_upload', label: 'File Upload', icon: '📎', description: 'Upload any file', category: 'media' },
  { type: 'photo_upload', label: 'Photo Upload', icon: '📷', description: 'Upload a photo', category: 'media' },
  { type: 'video_upload', label: 'Video Upload', icon: '🎥', description: 'Upload a video', category: 'media' },
  // Structured
  { type: 'staff_hierarchy', label: 'Staff Hierarchy', icon: '👥', description: 'Capture reporting structure', category: 'structured' },
  { type: 'workflow_step', label: 'Workflow Step', icon: '🔄', description: 'Describe a process step', category: 'structured' },
  { type: 'approval_chain', label: 'Approval Chain', icon: '✔️', description: 'Map approval sequence', category: 'structured' },
  // Layout
  { type: 'section_header', label: 'Section Header', icon: '📌', description: 'Add a section title', category: 'layout' },
  { type: 'instruction_block', label: 'Instructions', icon: 'ℹ️', description: 'Add guidance text', category: 'layout' },
];

export const CATEGORY_LABELS: Record<QuestionTypeConfig['category'], string> = {
  text: 'Text & Numbers',
  choice: 'Choice & Selection',
  scale: 'Scales & Ratings',
  media: 'File & Media',
  structured: 'Structured Data',
  layout: 'Layout',
};
