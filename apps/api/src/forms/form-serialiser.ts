import { BadRequestException } from '@nestjs/common';
import { FormDefinition, QuestionDefinition, ConditionalRule } from './form-definition.types';

/**
 * Serialises a FormDefinition to a JSON string.
 * Validates: Property 10 (form serialisation round-trip)
 */
export function serializeForm(form: FormDefinition): string {
  return JSON.stringify(form);
}

/**
 * Pretty-prints a form JSON string with consistent indentation.
 * Validates: Requirements 23.3
 */
export function prettyPrintForm(json: string): string {
  const parsed = JSON.parse(json);
  return JSON.stringify(parsed, null, 2);
}

/**
 * Deserialises a JSON string back to a FormDefinition.
 * Validates schema and throws descriptive errors on failure.
 * Validates: Requirements 23.2, 23.5, Property 38
 */
export function deserializeForm(json: string): FormDefinition {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new BadRequestException(
      'Form definition is not valid JSON. Please check the format.',
    );
  }

  return validateFormDefinition(parsed);
}

function validateFormDefinition(data: unknown): FormDefinition {
  if (!data || typeof data !== 'object') {
    throw new BadRequestException(
      'Invalid form definition: expected an object.',
    );
  }

  const d = data as Record<string, unknown>;

  if (typeof d.formId !== 'string') {
    throw new BadRequestException(
      'Invalid form definition: "formId" must be a string.',
    );
  }
  if (typeof d.title !== 'string') {
    throw new BadRequestException(
      'Invalid form definition: "title" must be a string.',
    );
  }
  if (!Array.isArray(d.pages)) {
    throw new BadRequestException(
      'Invalid form definition: "pages" must be an array.',
    );
  }
  if (!Array.isArray(d.conditionalLogic)) {
    throw new BadRequestException(
      'Invalid form definition: "conditionalLogic" must be an array.',
    );
  }
  if (typeof d.version !== 'number') {
    throw new BadRequestException(
      'Invalid form definition: "version" must be a number.',
    );
  }

  return d as unknown as FormDefinition;
}

/**
 * Validates that all conditional logic rules reference question IDs
 * that exist within the form. Returns list of invalid references.
 * Validates: Requirement 3.4, Property 8
 */
export function validateConditionalLogic(
  form: FormDefinition,
): { valid: boolean; invalidRefs: string[] } {
  const allQuestionIds = new Set<string>();
  for (const page of form.pages) {
    for (const q of page.questions) {
      allQuestionIds.add(q.questionId);
    }
  }

  const invalidRefs: string[] = [];
  for (const rule of form.conditionalLogic) {
    if (!allQuestionIds.has(rule.condition.sourceQuestionId)) {
      invalidRefs.push(rule.condition.sourceQuestionId);
    }
    if (!allQuestionIds.has(rule.targetQuestionId)) {
      invalidRefs.push(rule.targetQuestionId);
    }
  }

  return { valid: invalidRefs.length === 0, invalidRefs };
}

/**
 * Checks if a question is referenced by any conditional logic rule.
 * Returns the dependent rules if any exist.
 * Validates: Requirement 3.5, Property 9
 */
export function getDependentRules(
  form: FormDefinition,
  questionId: string,
): ConditionalRule[] {
  return form.conditionalLogic.filter(
    (rule) =>
      rule.condition.sourceQuestionId === questionId ||
      rule.targetQuestionId === questionId,
  );
}

/**
 * Inserts a question at a given position, shifting others down.
 * Validates: Property 6 (question insertion preserves position)
 */
export function insertQuestion(
  page: FormDefinition['pages'][0],
  question: QuestionDefinition,
  position: number,
): FormDefinition['pages'][0] {
  const questions = [...page.questions];
  const clampedPos = Math.max(0, Math.min(position, questions.length));

  // Assign the position
  question.position = clampedPos;

  // Insert at position
  questions.splice(clampedPos, 0, question);

  // Re-number positions sequentially
  const reordered = questions.map((q, i) => ({ ...q, position: i }));

  return { ...page, questions: reordered };
}

/**
 * Reorders questions by applying a new position permutation.
 * Validates: Property 7 (question reorder correctness)
 */
export function reorderQuestions(
  page: FormDefinition['pages'][0],
  orderedIds: string[],
): FormDefinition['pages'][0] {
  const questionMap = new Map(page.questions.map((q) => [q.questionId, q]));
  const reordered = orderedIds
    .filter((id) => questionMap.has(id))
    .map((id, i) => ({ ...questionMap.get(id)!, position: i }));

  return { ...page, questions: reordered };
}
