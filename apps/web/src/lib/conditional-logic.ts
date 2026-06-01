import type {
  ConditionalRule,
  QuestionDefinition,
} from '@/components/form-builder/form-builder.types';

export function evaluateCondition(
  rule: ConditionalRule,
  answers: Record<string, unknown>,
): boolean {
  const { sourceQuestionId, operator, value } = rule.condition;
  const answer = answers[sourceQuestionId];

  switch (operator) {
    case 'equals':
      return answer === value;
    case 'not_equals':
      return answer !== value;
    case 'contains':
      if (Array.isArray(answer)) return answer.includes(value);
      return typeof answer === 'string' && answer.includes(String(value));
    case 'greater_than':
      return typeof answer === 'number' && answer > Number(value);
    case 'less_than':
      return typeof answer === 'number' && answer < Number(value);
    default:
      return true;
  }
}

export function isQuestionVisible(
  question: QuestionDefinition,
  rules: ConditionalRule[],
  answers: Record<string, unknown>,
): boolean {
  const applicableRules = rules.filter(
    (r) => r.targetQuestionId === question.questionId,
  );

  for (const rule of applicableRules) {
    const conditionMet = evaluateCondition(rule, answers);
    if (rule.action === 'hide' && conditionMet) return false;
    if (rule.action === 'show' && !conditionMet) return false;
  }

  return true;
}

export function isQuestionRequired(
  question: QuestionDefinition,
  rules: ConditionalRule[],
  answers: Record<string, unknown>,
): boolean {
  if (question.isRequired) return true;

  const requireRules = rules.filter(
    (r) =>
      r.targetQuestionId === question.questionId && r.action === 'require',
  );

  return requireRules.some((rule) => evaluateCondition(rule, answers));
}

export function isLayoutQuestion(type: string): boolean {
  return type === 'section_header' || type === 'instruction_block';
}

export function isAnswerEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}
