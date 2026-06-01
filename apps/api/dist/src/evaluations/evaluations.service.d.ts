import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
export declare class CreateEvaluationDto {
    organisationId: string;
    title: string;
    startDate: string;
    endDate?: string;
    consultantIds?: string[];
}
export declare class UpdateEvaluationDto {
    title?: string;
    startDate?: string;
    endDate?: string;
}
export declare class EvaluationsService {
    private prisma;
    private email;
    private audit;
    constructor(prisma: PrismaService, email: EmailService, audit: AuditService);
    create(dto: CreateEvaluationDto, createdById: string): Promise<{
        organisation: {
            name: string;
        };
        consultants: {
            consultantId: string;
        }[];
    } & {
        id: string;
        organisationId: string;
        createdAt: Date;
        startDate: Date | null;
        endDate: Date | null;
        archivedAt: Date | null;
        title: string;
        status: import("@prisma/client").$Enums.EvaluationStatus;
        createdById: string;
    }>;
    findAll(userId: string, role: string): Promise<({
        organisation: {
            id: string;
            name: string;
        };
        _count: {
            forms: number;
        };
    } & {
        id: string;
        organisationId: string;
        createdAt: Date;
        startDate: Date | null;
        endDate: Date | null;
        archivedAt: Date | null;
        title: string;
        status: import("@prisma/client").$Enums.EvaluationStatus;
        createdById: string;
    })[]>;
    findOne(id: string): Promise<{
        organisation: {
            id: string;
            name: string;
        };
        consultants: ({
            consultant: {
                id: string;
                email: string;
            };
        } & {
            assignedAt: Date;
            consultantId: string;
            evaluationId: string;
        })[];
        forms: {
            id: string;
            _count: {
                formAssignments: number;
                responses: number;
            };
            title: string;
            status: import("@prisma/client").$Enums.FormStatus;
            responseDeadline: Date | null;
        }[];
    } & {
        id: string;
        organisationId: string;
        createdAt: Date;
        startDate: Date | null;
        endDate: Date | null;
        archivedAt: Date | null;
        title: string;
        status: import("@prisma/client").$Enums.EvaluationStatus;
        createdById: string;
    }>;
    activate(id: string, activatedById: string): Promise<{
        id: string;
        organisationId: string;
        createdAt: Date;
        startDate: Date | null;
        endDate: Date | null;
        archivedAt: Date | null;
        title: string;
        status: import("@prisma/client").$Enums.EvaluationStatus;
        createdById: string;
    }>;
    archive(id: string, archivedById: string): Promise<{
        id: string;
        organisationId: string;
        createdAt: Date;
        startDate: Date | null;
        endDate: Date | null;
        archivedAt: Date | null;
        title: string;
        status: import("@prisma/client").$Enums.EvaluationStatus;
        createdById: string;
    }>;
    assignConsultants(id: string, consultantIds: string[], assignedById: string): Promise<{
        organisation: {
            id: string;
            name: string;
        };
        consultants: ({
            consultant: {
                id: string;
                email: string;
            };
        } & {
            assignedAt: Date;
            consultantId: string;
            evaluationId: string;
        })[];
        forms: {
            id: string;
            _count: {
                formAssignments: number;
                responses: number;
            };
            title: string;
            status: import("@prisma/client").$Enums.FormStatus;
            responseDeadline: Date | null;
        }[];
    } & {
        id: string;
        organisationId: string;
        createdAt: Date;
        startDate: Date | null;
        endDate: Date | null;
        archivedAt: Date | null;
        title: string;
        status: import("@prisma/client").$Enums.EvaluationStatus;
        createdById: string;
    }>;
}
