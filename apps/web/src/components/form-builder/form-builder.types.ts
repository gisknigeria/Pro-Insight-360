import type { QuestionType } from './question-types';

export type EvaluationDimension = 'WHO' | 'WHAT' | 'HOW' | 'WHEN';

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

export interface ConditionalRule {
  ruleId: string;
  targetQuestionId: string;
  condition: {
    sourceQuestionId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: unknown;
  };
  action: 'show' | 'hide' | 'require';
}

export interface FormPage {
  pageId: string;
  title?: string;
  questions: QuestionDefinition[];
}

export interface FormDefinition {
  formId: string;
  title: string;
  description?: string;
  pages: FormPage[];
  conditionalLogic: ConditionalRule[];
  version: number;
}
