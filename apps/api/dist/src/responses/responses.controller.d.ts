import { ResponsesService, SubmitResponseDto, SaveDraftDto, SyncResponseDto } from './responses.service';
export declare class ResponsesController {
    private responsesService;
    constructor(responsesService: ResponsesService);
    saveDraft(dto: SaveDraftDto, user: any): Promise<{
        answers: {
            id: string;
            questionId: string;
            responseId: string;
            value: import("@prisma/client/runtime/client").JsonValue;
            answeredAt: Date;
        }[];
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ResponseStatus;
        formId: string;
        respondentId: string;
        submittedAt: Date | null;
        syncedAt: Date | null;
        rawCacheJson: string | null;
    }>;
    getDraft(formId: string, user: any): Promise<{
        responseId: string;
        answers: {
            questionId: string;
            value: import("@prisma/client/runtime/client").JsonValue;
        }[];
    } | null>;
    getAssignedForms(user: any): Promise<{
        formId: string;
        title: string;
        evaluationTitle: string;
        responseDeadline: Date | null;
        assignedAt: Date;
        completionStatus: "submitted" | "not_started" | "in_progress";
        submittedAt: Date | null;
    }[]>;
    submit(dto: SubmitResponseDto, user: any): Promise<any>;
    sync(dto: SyncResponseDto, user: any): Promise<{
        synced: boolean;
        responseId: string;
    }>;
    getFormResponses(formId: string): Promise<({
        respondent: {
            id: string;
            email: string;
        };
        answers: ({
            question: {
                type: string;
                label: string;
            };
        } & {
            id: string;
            questionId: string;
            responseId: string;
            value: import("@prisma/client/runtime/client").JsonValue;
            answeredAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ResponseStatus;
        formId: string;
        respondentId: string;
        submittedAt: Date | null;
        syncedAt: Date | null;
        rawCacheJson: string | null;
    })[]>;
    getMyResponses(user: any): Promise<({
        form: {
            id: string;
            title: string;
            responseDeadline: Date | null;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ResponseStatus;
        formId: string;
        respondentId: string;
        submittedAt: Date | null;
        syncedAt: Date | null;
        rawCacheJson: string | null;
    })[]>;
}
