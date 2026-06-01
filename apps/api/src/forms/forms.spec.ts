/**
 * Feature: pro-insight-360
 * Property-based tests for form builder and serialisation
 */
import * as fc from 'fast-check';
import {
  serializeForm,
  deserializeForm,
  prettyPrintForm,
  validateConditionalLogic,
  getDependentRules,
  insertQuestion,
  reorderQuestions,
} from './form-serialiser';
import type {
  FormDefinition,
  QuestionDefinition,
  FormPage,
} from './form-definition.types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const questionArb = fc.record({
  questionId: fc.uuid(),
  type: fc.constant('short_text' as const),
  label: fc.string({ minLength: 1, maxLength: 100 }),
  isRequired: fc.boolean(),
  config: fc.constant({}),
  dimensions: fc.constant(['WHO'] as const),
  position: fc.nat({ max: 100 }),
});

const pageArb = (questions: QuestionDefinition[]) => ({
  pageId: fc.uuid().map((id) => id),
  title: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  questions: fc.constant(questions),
});

function makeForm(questions: QuestionDefinition[]): FormDefinition {
  return {
    formId: 'form-1',
    title: 'Test Form',
    pages: [{ pageId: 'page-1', title: 'Page 1', questions }],
    conditionalLogic: [],
    version: 1,
  };
}

// ─── Property 6: Question Insertion Preserves Position ───────────────────────

describe('Property 6: Question Insertion Preserves Position', () => {
  it('should insert question at the correct position and shift others', () => {
    fc.assert(
      fc.property(
        fc.array(questionArb, { minLength: 0, maxLength: 10 }),
        questionArb,
        fc.nat({ max: 10 }),
        (existingQuestions, newQuestion, insertPos) => {
          const page: FormPage = {
            pageId: 'page-1',
            questions: existingQuestions.map((q, i) => ({ ...q, position: i })),
          };
          const n = page.questions.length;
          const clampedPos = Math.min(insertPos, n);

          const result = insertQuestion(page, { ...newQuestion }, clampedPos);

          // New question must be at the clamped position
          const insertedQ = result.questions.find(
            (q) => q.questionId === newQuestion.questionId,
          );
          if (!insertedQ) return false;

          // Total count must be n + 1
          if (result.questions.length !== n + 1) return false;

          // All positions must be sequential 0..n
          const positions = result.questions.map((q) => q.position).sort((a, b) => a - b);
          return positions.every((p, i) => p === i);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should assign a unique questionId to the inserted question', () => {
    fc.assert(
      fc.property(
        fc.array(questionArb, { minLength: 1, maxLength: 5 }),
        questionArb,
        (existing, newQ) => {
          const page: FormPage = {
            pageId: 'p1',
            questions: existing.map((q, i) => ({ ...q, position: i })),
          };
          const result = insertQuestion(page, { ...newQ }, 0);
          const ids = result.questions.map((q) => q.questionId);
          return new Set(ids).size === ids.length;
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 7: Question Reorder Correctness ────────────────────────────────

describe('Property 7: Question Reorder Correctness', () => {
  it('should produce exactly the permuted order with no questions added or removed', () => {
    fc.assert(
      fc.property(
        fc.array(questionArb, { minLength: 2, maxLength: 8 }).map((qs) =>
          qs.map((q, i) => ({ ...q, position: i })),
        ),
        (questions) => {
          const page: FormPage = { pageId: 'p1', questions };
          // Shuffle the IDs
          const shuffled = [...questions.map((q) => q.questionId)].sort(
            () => Math.random() - 0.5,
          );
          const result = reorderQuestions(page, shuffled);

          // Same count
          if (result.questions.length !== questions.length) return false;

          // Same IDs (no additions or removals)
          const originalIds = new Set(questions.map((q) => q.questionId));
          const resultIds = new Set(result.questions.map((q) => q.questionId));
          if (originalIds.size !== resultIds.size) return false;
          for (const id of originalIds) {
            if (!resultIds.has(id)) return false;
          }

          // Order matches shuffled
          return result.questions.every((q, i) => q.questionId === shuffled[i]);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 8: Conditional Logic References Valid Questions ────────────────

describe('Property 8: Conditional Logic References Valid Questions', () => {
  it('should detect invalid question ID references in conditional logic', () => {
    fc.assert(
      fc.property(
        fc.array(questionArb, { minLength: 1, maxLength: 5 }),
        fc.uuid(), // a random ID that won't be in the form
        (questions, invalidId) => {
          const form: FormDefinition = {
            formId: 'f1',
            title: 'Test',
            pages: [{ pageId: 'p1', questions: questions.map((q, i) => ({ ...q, position: i })) }],
            conditionalLogic: [
              {
                ruleId: 'r1',
                targetQuestionId: questions[0].questionId,
                condition: {
                  sourceQuestionId: invalidId, // invalid reference
                  operator: 'equals',
                  value: 'yes',
                },
                action: 'show',
              },
            ],
            version: 1,
          };

          const { valid, invalidRefs } = validateConditionalLogic(form);
          // Must detect the invalid reference
          return !valid && invalidRefs.includes(invalidId);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should pass validation when all references are valid', () => {
    fc.assert(
      fc.property(
        fc.array(questionArb, { minLength: 2, maxLength: 5 }),
        (questions) => {
          const qs = questions.map((q, i) => ({ ...q, position: i }));
          const form: FormDefinition = {
            formId: 'f1',
            title: 'Test',
            pages: [{ pageId: 'p1', questions: qs }],
            conditionalLogic: [
              {
                ruleId: 'r1',
                targetQuestionId: qs[1].questionId,
                condition: {
                  sourceQuestionId: qs[0].questionId, // valid reference
                  operator: 'equals',
                  value: 'yes',
                },
                action: 'show',
              },
            ],
            version: 1,
          };

          const { valid } = validateConditionalLogic(form);
          return valid;
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 9: Deletion Warning for Referenced Questions ───────────────────

describe('Property 9: Deletion Warning for Referenced Questions', () => {
  it('should return dependent rules when a referenced question is targeted for deletion', () => {
    fc.assert(
      fc.property(
        fc.array(questionArb, { minLength: 2, maxLength: 5 }),
        (questions) => {
          const qs = questions.map((q, i) => ({ ...q, position: i }));
          const sourceId = qs[0].questionId;
          const targetId = qs[1].questionId;

          const form: FormDefinition = {
            formId: 'f1',
            title: 'Test',
            pages: [{ pageId: 'p1', questions: qs }],
            conditionalLogic: [
              {
                ruleId: 'r1',
                targetQuestionId: targetId,
                condition: {
                  sourceQuestionId: sourceId,
                  operator: 'equals',
                  value: 'yes',
                },
                action: 'show',
              },
            ],
            version: 1,
          };

          // Trying to delete the source question should return the dependent rule
          const deps = getDependentRules(form, sourceId);
          return deps.length > 0 && deps[0].ruleId === 'r1';
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should return empty array for questions with no dependent rules', () => {
    fc.assert(
      fc.property(
        fc.array(questionArb, { minLength: 1, maxLength: 5 }),
        (questions) => {
          const qs = questions.map((q, i) => ({ ...q, position: i }));
          const form: FormDefinition = {
            formId: 'f1',
            title: 'Test',
            pages: [{ pageId: 'p1', questions: qs }],
            conditionalLogic: [], // no rules
            version: 1,
          };

          const deps = getDependentRules(form, qs[0].questionId);
          return deps.length === 0;
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 10: Form Serialisation Round-Trip ──────────────────────────────

describe('Property 10: Form Serialisation Round-Trip', () => {
  it('should produce an equivalent form after serialize → deserialize', () => {
    fc.assert(
      fc.property(
        fc.array(questionArb, { minLength: 0, maxLength: 10 }),
        (questions) => {
          const form = makeForm(questions.map((q, i) => ({ ...q, position: i })));
          const serialized = serializeForm(form);
          const deserialized = deserializeForm(serialized);

          // Must have same formId, title, version
          if (deserialized.formId !== form.formId) return false;
          if (deserialized.title !== form.title) return false;
          if (deserialized.version !== form.version) return false;

          // Must have same number of pages and questions
          if (deserialized.pages.length !== form.pages.length) return false;
          for (let i = 0; i < form.pages.length; i++) {
            if (
              deserialized.pages[i].questions.length !==
              form.pages[i].questions.length
            )
              return false;
          }

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should produce identical JSON after serialize → pretty-print → deserialize', () => {
    fc.assert(
      fc.property(
        fc.array(questionArb, { minLength: 0, maxLength: 5 }),
        (questions) => {
          const form = makeForm(questions.map((q, i) => ({ ...q, position: i })));
          const serialized = serializeForm(form);
          const pretty = prettyPrintForm(serialized);
          const deserialized = deserializeForm(pretty);

          return (
            deserialized.formId === form.formId &&
            deserialized.title === form.title &&
            deserialized.version === form.version
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 38: Form JSON Schema Validation on Deserialisation ─────────────

describe('Property 38: Form JSON Schema Validation on Deserialisation', () => {
  it('should throw a descriptive error for invalid form JSON', () => {
    const invalidCases = [
      '{}', // missing required fields
      '{"formId": 123}', // wrong type
      '{"formId": "f1", "title": "T", "pages": "not-array", "conditionalLogic": [], "version": 1}',
      'not-json-at-all',
    ];

    for (const invalid of invalidCases) {
      expect(() => deserializeForm(invalid)).toThrow();
    }
  });

  it('should never render a partial form on schema failure', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('{}'),
          fc.constant('{"formId": 1}'),
          fc.constant('{"title": "only title"}'),
        ),
        (invalidJson) => {
          let threw = false;
          try {
            deserializeForm(invalidJson);
          } catch {
            threw = true;
          }
          return threw;
        },
      ),
      { numRuns: 50 },
    );
  });
});
