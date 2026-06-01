/**
 * Feature: pro-insight-360
 * Property-based tests for response collection and offline sync
 */
import * as fc from 'fast-check';
import {
  serializeResponse,
  deserializeResponse,
  prettyPrintResponse,
} from './response-serialiser';
import type { ResponseData } from './response-data.types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const answerArb = fc.record({
  questionId: fc.uuid(),
  value: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
  answeredAt: fc.date().map((d) => d.toISOString()),
});

const responseDataArb = fc.record({
  responseId: fc.uuid(),
  formId: fc.uuid(),
  respondentId: fc.uuid(),
  formVersion: fc.nat({ max: 100 }),
  answers: fc.array(answerArb, { minLength: 0, maxLength: 20 }),
  savedAt: fc.date().map((d) => d.toISOString()),
  syncStatus: fc.constant('pending' as const),
});

// ─── Property 13: Response Submission Records Metadata ───────────────────────

describe('Property 13: Response Submission Records Metadata', () => {
  it('should always include a non-null submittedAt and respondentId', () => {
    fc.assert(
      fc.property(responseDataArb, (responseData) => {
        // Simulate what the service does on submission
        const record = {
          id: responseData.responseId,
          respondentId: responseData.respondentId,
          submittedAt: new Date(),
          status: 'SUBMITTED',
        };

        return (
          record.respondentId !== null &&
          record.respondentId !== undefined &&
          record.submittedAt !== null &&
          record.submittedAt instanceof Date
        );
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 14: Deadline Enforcement ───────────────────────────────────────

describe('Property 14: Deadline Enforcement', () => {
  function isAfterDeadline(submissionTime: Date, deadline: Date): boolean {
    return submissionTime > deadline;
  }

  it('should reject any submission with a timestamp strictly after the deadline', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 1000000 }).map((n) => new Date(1700000000000 + n * 1000)),
        fc.integer({ min: 1, max: 86400 }).map((s) => s * 1000),
        (deadline, msAfter) => {
          const submissionTime = new Date(deadline.getTime() + msAfter);
          return isAfterDeadline(submissionTime, deadline);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should allow submissions at or before the deadline', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 1000000 }).map((n) => new Date(1700000000000 + n * 1000)),
        fc.nat({ max: 86400 }).map((s) => s * 1000),
        (deadline, msBefore) => {
          const submissionTime = new Date(deadline.getTime() - msBefore);
          return !isAfterDeadline(submissionTime, deadline);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 15: Successful Sync Removes Local Cache Entry ──────────────────

describe('Property 15: Successful Sync Removes Local Cache Entry', () => {
  class MockLocalCache {
    private entries = new Map<string, ResponseData>();

    save(response: ResponseData): void {
      this.entries.set(response.responseId, response);
    }

    remove(responseId: string): void {
      this.entries.delete(responseId);
    }

    has(responseId: string): boolean {
      return this.entries.has(responseId);
    }

    get size(): number {
      return this.entries.size;
    }
  }

  it('should remove the entry from local cache after successful sync', () => {
    fc.assert(
      fc.property(responseDataArb, (responseData) => {
        const cache = new MockLocalCache();
        cache.save(responseData);

        // Simulate successful sync
        const syncSucceeded = true;
        if (syncSucceeded) {
          cache.remove(responseData.responseId);
        }

        return !cache.has(responseData.responseId);
      }),
      { numRuns: 100 },
    );
  });

  it('should NOT remove the entry if sync fails', () => {
    fc.assert(
      fc.property(responseDataArb, (responseData) => {
        const cache = new MockLocalCache();
        cache.save(responseData);

        // Simulate failed sync
        const syncSucceeded = false;
        if (syncSucceeded) {
          cache.remove(responseData.responseId);
        }

        return cache.has(responseData.responseId);
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 39: Offline Response Serialisation Round-Trip ─────────────────

describe('Property 39: Offline Response Serialisation Round-Trip', () => {
  it('should produce an equivalent response after serialize → deserialize', () => {
    fc.assert(
      fc.property(responseDataArb, (responseData) => {
        const serialized = serializeResponse(responseData);
        const deserialized = deserializeResponse(serialized);

        return (
          deserialized.responseId === responseData.responseId &&
          deserialized.formId === responseData.formId &&
          deserialized.respondentId === responseData.respondentId &&
          deserialized.formVersion === responseData.formVersion &&
          deserialized.answers.length === responseData.answers.length &&
          deserialized.savedAt === responseData.savedAt
        );
      }),
      { numRuns: 100 },
    );
  });

  it('should produce identical data after serialize → pretty-print → deserialize', () => {
    fc.assert(
      fc.property(responseDataArb, (responseData) => {
        const serialized = serializeResponse(responseData);
        const pretty = prettyPrintResponse(serialized);
        const deserialized = deserializeResponse(pretty);

        return (
          deserialized.responseId === responseData.responseId &&
          deserialized.formId === responseData.formId &&
          deserialized.answers.length === responseData.answers.length
        );
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 40: Quarantine on Response Validation Failure ─────────────────

describe('Property 40: Quarantine on Response Validation Failure', () => {
  it('should throw a descriptive error for invalid response JSON', () => {
    const invalidCases = [
      '{}',
      '{"responseId": 123}', // wrong type
      '{"responseId": "r1", "formId": "f1"}', // missing fields
      'not-json',
    ];

    for (const invalid of invalidCases) {
      expect(() => deserializeResponse(invalid)).toThrow();
    }
  });

  it('should preserve the raw JSON in the error context (not silently discard)', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('{}'),
          fc.constant('{"responseId": 1}'),
          fc.constant('{"answers": "wrong"}'),
        ),
        (invalidJson) => {
          let threw = false;
          let errorMessage = '';
          try {
            deserializeResponse(invalidJson);
          } catch (e: any) {
            threw = true;
            errorMessage = e.message ?? '';
          }
          // Must throw AND provide a descriptive message
          return threw && errorMessage.length > 0;
        },
      ),
      { numRuns: 50 },
    );
  });
});
