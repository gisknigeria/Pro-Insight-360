import { BadRequestException } from '@nestjs/common';
import { ResponseData, AnswerData } from './response-data.types';

/**
 * Serialises a ResponseData to JSON string for offline caching.
 * Validates: Requirement 24.1, Property 39
 */
export function serializeResponse(response: ResponseData): string {
  return JSON.stringify(response);
}

/**
 * Pretty-prints a cached response JSON for debugging/audit.
 * Validates: Requirement 24.3
 */
export function prettyPrintResponse(json: string): string {
  const parsed = JSON.parse(json);
  return JSON.stringify(parsed, null, 2);
}

/**
 * Deserialises and validates a cached response JSON.
 * On failure: throws descriptive error, preserves raw data.
 * Validates: Requirements 24.2, 24.5, Property 39, Property 40
 */
export function deserializeResponse(json: string): ResponseData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new BadRequestException(
      'Cached response is not valid JSON. The response has been quarantined.',
    );
  }

  return validateResponseData(parsed);
}

function validateResponseData(data: unknown): ResponseData {
  if (!data || typeof data !== 'object') {
    throw new BadRequestException(
      'Invalid response data: expected an object.',
    );
  }

  const d = data as Record<string, unknown>;

  if (typeof d.responseId !== 'string') {
    throw new BadRequestException(
      'Invalid response data: "responseId" must be a string.',
    );
  }
  if (typeof d.formId !== 'string') {
    throw new BadRequestException(
      'Invalid response data: "formId" must be a string.',
    );
  }
  if (typeof d.respondentId !== 'string') {
    throw new BadRequestException(
      'Invalid response data: "respondentId" must be a string.',
    );
  }
  if (typeof d.formVersion !== 'number') {
    throw new BadRequestException(
      'Invalid response data: "formVersion" must be a number.',
    );
  }
  if (!Array.isArray(d.answers)) {
    throw new BadRequestException(
      'Invalid response data: "answers" must be an array.',
    );
  }
  if (typeof d.savedAt !== 'string') {
    throw new BadRequestException(
      'Invalid response data: "savedAt" must be an ISO 8601 string.',
    );
  }

  return d as unknown as ResponseData;
}
