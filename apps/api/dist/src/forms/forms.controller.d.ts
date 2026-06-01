import { FormsService, CreateFormDto, UpdateFormDto } from './forms.service';
declare class AssignRespondentsDto {
    respondentIds: string[];
}
declare class ReopenFormDto {
    deadline: string;
}
export declare class FormsController {
    private formsService;
    constructor(formsService: FormsService);
    create(dto: CreateFormDto, user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        templateVersion: number | null;
        title: string;
        status: import("@prisma/client").$Enums.FormStatus;
        createdById: string;
        evaluationId: string;
        templateId: string | null;
        definition: import("@prisma/client/runtime/client").JsonValue;
        responseDeadline: Date | null;
    }>;
    findOne(id: string): Promise<{
        _count: {
            formAssignments: number;
            responses: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        templateVersion: number | null;
        title: string;
        status: import("@prisma/client").$Enums.FormStatus;
        createdById: string;
        evaluationId: string;
        templateId: string | null;
        definition: import("@prisma/client/runtime/client").JsonValue;
        responseDeadline: Date | null;
    }>;
    getDefinition(id: string): Promise<import("./form-definition.types").FormDefinition>;
    getPrettyJson(id: string): Promise<string>;
    update(id: string, dto: UpdateFormDto, user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        templateVersion: number | null;
        title: string;
        status: import("@prisma/client").$Enums.FormStatus;
        createdById: string;
        evaluationId: string;
        templateId: string | null;
        definition: import("@prisma/client/runtime/client").JsonValue;
        responseDeadline: Date | null;
    }>;
    publish(id: string, user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        templateVersion: number | null;
        title: string;
        status: import("@prisma/client").$Enums.FormStatus;
        createdById: string;
        evaluationId: string;
        templateId: string | null;
        definition: import("@prisma/client/runtime/client").JsonValue;
        responseDeadline: Date | null;
    }>;
    close(id: string, user: any): Promise<{
        id: string;
        status: string;
    }>;
    reopen(id: string, dto: ReopenFormDto, user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        templateVersion: number | null;
        title: string;
        status: import("@prisma/client").$Enums.FormStatus;
        createdById: string;
        evaluationId: string;
        templateId: string | null;
        definition: import("@prisma/client/runtime/client").JsonValue;
        responseDeadline: Date | null;
    }>;
    assignRespondents(id: string, dto: AssignRespondentsDto, user: any): Promise<{
        assigned: number;
    }>;
    getCompletionStatus(id: string): Promise<{
        respondentId: string;
        email: string;
        assignedAt: Date;
        notifiedAt: Date | null;
        status: string;
        submittedAt: Date | null;
    }[]>;
    checkQuestionDeletion(formId: string, questionId: string): Promise<{
        canDelete: boolean;
        dependentRules: unknown[];
    }>;
}
export {};
