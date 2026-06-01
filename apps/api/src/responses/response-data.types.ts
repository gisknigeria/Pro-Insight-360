/**
 * ResponseData — the JSON schema for offline-cached responses (IndexedDB)
 * Validates: Requirements 24.1, 24.2, Property 39
 */

export interface AnswerData {
  questionId: string;
  value: unknown;
  answeredAt: string; // ISO 8601
}

export interface ResponseData {
  responseId: string;
  formId: string;
  respondentId: string;
  formVersion: number;
  answers: AnswerData[];
  savedAt: string; // ISO 8601
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
}
