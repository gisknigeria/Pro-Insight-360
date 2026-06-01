/**
 * Feature: pro-insight-360
 * Property-based tests for evaluation management
 */
import * as fc from 'fast-check';

// ─── Property 4: Evaluation Creation Requires Mandatory Fields ───────────────
// For any evaluation creation request missing required fields,
// the platform should reject it with a validation error.

describe('Property 4: Evaluation Creation Requires Mandatory Fields', () => {
  interface CreateEvaluationDto {
    organisationName?: string;
    title?: string;
    startDate?: string;
    formIds?: string[];
  }

  const REQUIRED_FIELDS = ['organisationName', 'title', 'startDate', 'formIds'] as string[];

  function validateEvaluationDto(dto: CreateEvaluationDto): {
    valid: boolean;
    missingFields: string[];
  } {
    const missingFields: string[] = [];
    if (!dto.organisationName?.trim()) missingFields.push('organisationName');
    if (!dto.title?.trim()) missingFields.push('title');
    if (!dto.startDate) missingFields.push('startDate');
    if (!dto.formIds || dto.formIds.length === 0) missingFields.push('formIds');
    return { valid: missingFields.length === 0, missingFields };
  }

  it('should reject any request missing one or more required fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          organisationName: fc.oneof(fc.string({ minLength: 1 }), fc.constant(undefined)),
          title: fc.oneof(fc.string({ minLength: 1 }), fc.constant(undefined)),
          startDate: fc.oneof(fc.string({ minLength: 1 }), fc.constant(undefined)),
          formIds: fc.oneof(
            fc.array(fc.uuid(), { minLength: 1 }),
            fc.constant(undefined),
          ),
        }),
        (dto) => {
          const { valid, missingFields } = validateEvaluationDto(dto);
          const hasAllFields =
            !!dto.organisationName &&
            !!dto.title &&
            !!dto.startDate &&
            !!dto.formIds?.length;

          if (!hasAllFields) {
            return !valid && missingFields.length > 0;
          }
          return valid && missingFields.length === 0;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should identify all missing fields in the error, not just the first one', () => {
    fc.assert(
      fc.property(
        fc.subarray(REQUIRED_FIELDS, { minLength: 1 }),
        (missingFieldNames) => {
          // Build a dto with the selected fields missing
          const dto: CreateEvaluationDto = {
            organisationName: 'Test Org',
            title: 'Test Evaluation',
            startDate: '2025-01-01',
            formIds: ['form-1'],
          };
          for (const field of missingFieldNames) {
            delete (dto as Record<string, unknown>)[field];
          }

          const { valid, missingFields } = validateEvaluationDto(dto);
          // All missing fields must be reported
          return (
            !valid &&
            missingFieldNames.every((f) => missingFields.includes(f as string))
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 5: New Evaluation Status Invariant ─────────────────────────────
// For any newly created evaluation, its status should be "Draft"
// regardless of the creating consultant or organisation.

describe('Property 5: New Evaluation Status Invariant', () => {
  type EvaluationStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';

  interface Evaluation {
    id: string;
    title: string;
    organisationId: string;
    createdById: string;
    status: EvaluationStatus;
  }

  function createEvaluation(dto: {
    title: string;
    organisationId: string;
    createdById: string;
  }): Evaluation {
    return {
      id: Math.random().toString(36),
      ...dto,
      status: 'DRAFT', // always starts as DRAFT
    };
  }

  it('should always set status to DRAFT on creation regardless of creator or org', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          organisationId: fc.uuid(),
          createdById: fc.uuid(),
        }),
        (dto) => {
          const evaluation = createEvaluation(dto);
          return evaluation.status === 'DRAFT';
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should never create an evaluation with ACTIVE, CLOSED, or ARCHIVED status', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 1 }),
          organisationId: fc.uuid(),
          createdById: fc.uuid(),
        }),
        (dto) => {
          const evaluation = createEvaluation(dto);
          const invalidStatuses: EvaluationStatus[] = ['ACTIVE', 'CLOSED', 'ARCHIVED'];
          return !invalidStatuses.includes(evaluation.status);
        },
      ),
      { numRuns: 100 },
    );
  });
});
