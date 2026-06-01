import { TemplatesService, CreateTemplateDto, UpdateTemplateDto } from './templates.service';
declare class InstantiateTemplateDto {
    evaluationId: string;
    title: string;
}
export declare class TemplatesController {
    private templatesService;
    constructor(templatesService: TemplatesService);
    create(dto: CreateTemplateDto, user: any): Promise<{
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
    findAll(sector?: string, evaluationType?: string, keyword?: string): Promise<{
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
    update(id: string, dto: UpdateTemplateDto, user: any): Promise<{
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
    publish(id: string, user: any): Promise<{
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
    delete(id: string, user: any): Promise<{
        id: string;
        deleted: boolean;
    }>;
    instantiate(id: string, dto: InstantiateTemplateDto, user: any): Promise<{
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
    getVersionHistory(id: string): Promise<{
        id: string;
        createdAt: Date;
        templateId: string;
        definition: import("@prisma/client/runtime/client").JsonValue;
        version: number;
    }[]>;
}
export {};
