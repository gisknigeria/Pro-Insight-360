import { EvaluationsService, CreateEvaluationDto } from './evaluations.service';
declare class AssignConsultantsDto {
    consultantIds: string[];
}
export declare class EvaluationsController {
    private evaluationsService;
    constructor(evaluationsService: EvaluationsService);
    create(dto: CreateEvaluationDto, user: any): Promise<{
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
    findAll(user: any): Promise<({
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
    activate(id: string, user: any): Promise<{
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
    archive(id: string, user: any): Promise<{
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
    assignConsultants(id: string, dto: AssignConsultantsDto, user: any): Promise<{
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
export {};
