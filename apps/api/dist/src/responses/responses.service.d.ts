import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
export declare class SubmitResponseDto {
    formId: string;
    answers: {
        questionId: string;
        value: unknown;
    }[];
}
export declare class SaveDraftDto {
    formId: string;
    answers: {
        questionId: string;
        value: unknown;
    }[];
}
export declare class SyncResponseDto {
    cachedResponseJson: string;
}
export declare class ResponsesService {
    private prisma;
    private audit;
    private readonly logger;
    constructor(prisma: PrismaService, audit: AuditService);
    private resolveAnswerQuestionIds;
    private assertAssignment;
    private assertFormAcceptsResponses;
    saveDraft(dto: SaveDraftDto, respondentId: string): Promise<{
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
    getDraft(formId: string, respondentId: string): Promise<{
        responseId: string;
        answers: {
            questionId: string;
            value: import("@prisma/client/runtime/client").JsonValue;
        }[];
    } | null>;
    submit(dto: SubmitResponseDto, respondentId: string): Promise<any>;
    syncOfflineResponse(dto: SyncResponseDto, respondentId: string): Promise<{
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
    getMyResponses(respondentId: string): Promise<({
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
    getMyAssignedForms(respondentId: string): Promise<{
        formId: string;
        title: string;
        evaluationTitle: string;
        responseDeadline: Date | null;
        assignedAt: Date;
        completionStatus: "submitted" | "not_started" | "in_progress";
        submittedAt: Date | null;
    }[]>;
    private quarantine;
}
