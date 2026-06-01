import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { FormDefinition } from './form-definition.types';
export declare class CreateFormDto {
    evaluationId: string;
    title: string;
    definition: FormDefinition;
    templateId?: string;
    templateVersion?: number;
    responseDeadline?: string;
}
export declare class UpdateFormDto {
    title?: string;
    definition?: FormDefinition;
    responseDeadline?: string;
}
export declare class FormsService {
    private prisma;
    private audit;
    private email;
    constructor(prisma: PrismaService, audit: AuditService, email: EmailService);
    create(dto: CreateFormDto, createdById: string): Promise<{
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
    getDefinition(id: string): Promise<FormDefinition>;
    update(id: string, dto: UpdateFormDto, updatedById: string): Promise<{
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
    publish(id: string, publishedById: string): Promise<{
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
    close(id: string, closedById: string): Promise<{
        id: string;
        status: string;
    }>;
    reopen(id: string, deadline: string, reopenedById: string): Promise<{
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
    private syncFormQuestions;
    checkQuestionDeletion(formId: string, questionId: string): Promise<{
        canDelete: boolean;
        dependentRules: unknown[];
    }>;
    getPrettyJson(id: string): Promise<string>;
    assignRespondents(formId: string, respondentIds: string[], assignedById: string): Promise<{
        assigned: number;
    }>;
    getCompletionStatus(formId: string): Promise<{
        respondentId: string;
        email: string;
        assignedAt: Date;
        notifiedAt: Date | null;
        status: string;
        submittedAt: Date | null;
    }[]>;
}
