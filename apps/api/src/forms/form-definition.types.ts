/**
 * FormDefinition — the JSON schema stored in forms.definition (JSONB)
 * This is the canonical type for form serialisation/deserialisation.
 */

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

export type EvaluationDimension = 'WHO' | 'WHAT' | 'HOW' | 'WHEN';

export type ConditionalOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'greater_than'
  | 'less_than';

export type ConditionalAction = 'show' | 'hide' | 'require';

export interface ConditionalRule {
  ruleId: string;
  targetQuestionId: string;
  condition: {
    sourceQuestionId: string;
    operator: ConditionalOperator;
    value: unknown;
  };
  action: ConditionalAction;
}

export interface QuestionDefinition {
  questionId: string;
  type: QuestionType;
  label: string;
  helperText?: string;
  isRequired: boolean;
  config: Record<string, unknown>;
  dimensions: EvaluationDimension[];
  position: number;
}

export interface FormPage {
  pageId: string;
  title?: string;
  questions: QuestionDefinition[];
  conditionalLogic?: ConditionalRule[];
}

export interface FormDefinition {
  formId: string;
  title: string;
  pages: FormPage[];
  conditionalLogic: ConditionalRule[];
  version: number;
}
