import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { FormDefinition } from '../forms/form-definition.types';
export declare class CreateTemplateDto {
    name: string;
    sector?: string;
    evaluationType?: string;
    definition: FormDefinition;
}
export declare class UpdateTemplateDto {
    name?: string;
    sector?: string;
    evaluationType?: string;
    definition?: FormDefinition;
}
export declare class TemplatesService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    create(dto: CreateTemplateDto, createdById: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        sector: string | null;
        createdById: string;
        definition: import("@prisma/client/runtime/client").JsonValue;
        version: number;
        evaluationType: string | null;
        isPublished: boolean;
    }>;
    findAll(filters?: {
        sector?: string;
        evaluationType?: string;
        keyword?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        sector: string | null;
        createdById: string;
        definition: import("@prisma/client/runtime/client").JsonValue;
        version: number;
        evaluationType: string | null;
        isPublished: boolean;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        sector: string | null;
        createdById: string;
        definition: import("@prisma/client/runtime/client").JsonValue;
        version: number;
        evaluationType: string | null;
        isPublished: boolean;
    }>;
    update(id: string, dto: UpdateTemplateDto, updatedById: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        sector: string | null;
        createdById: string;
        definition: import("@prisma/client/runtime/client").JsonValue;
        version: number;
        evaluationType: string | null;
        isPublished: boolean;
    }>;
    publish(id: string, publishedById: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        sector: string | null;
        createdById: string;
        definition: import("@prisma/client/runtime/client").JsonValue;
        version: number;
        evaluationType: string | null;
        isPublished: boolean;
    }>;
    delete(id: string, deletedById: string): Promise<{
        id: string;
        deleted: boolean;
    }>;
    instantiateAsForm(templateId: string, evaluationId: string, title: string, createdById: string): Promise<{
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
    getVersionHistory(templateId: string): Promise<{
        id: string;
        createdAt: Date;
        templateId: string;
        definition: import("@prisma/client/runtime/client").JsonValue;
        version: number;
    }[]>;
}
