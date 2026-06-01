export interface AnswerData {
    questionId: string;
    value: unknown;
    answeredAt: string;
}
export interface ResponseData {
    responseId: string;
    formId: string;
    respondentId: string;
    formVersion: number;
    answers: AnswerData[];
    savedAt: string;
    syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
}
