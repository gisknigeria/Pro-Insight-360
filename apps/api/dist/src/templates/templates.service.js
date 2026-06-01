"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplatesService = exports.UpdateTemplateDto = exports.CreateTemplateDto = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const form_serialiser_1 = require("../forms/form-serialiser");
class CreateTemplateDto {
    name;
    sector;
    evaluationType;
    definition;
}
exports.CreateTemplateDto = CreateTemplateDto;
class UpdateTemplateDto {
    name;
    sector;
    evaluationType;
    definition;
}
exports.UpdateTemplateDto = UpdateTemplateDto;
let TemplatesService = class TemplatesService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async create(dto, createdById) {
        const template = await this.prisma.template.create({
            data: {
                name: dto.name,
                sector: dto.sector,
                evaluationType: dto.evaluationType,
                definition: (0, form_serialiser_1.serializeForm)(dto.definition),
                version: 1,
                createdById,
            },
        });
        await this.prisma.templateVersion.create({
            data: {
                templateId: template.id,
                version: 1,
                definition: (0, form_serialiser_1.serializeForm)(dto.definition),
            },
        });
        await this.audit.log({
            userId: createdById,
            action: 'TEMPLATE_CREATED',
            resourceType: 'Template',
            resourceId: template.id,
            metadata: { name: dto.name },
        });
        return template;
    }
    async findAll(filters) {
        return this.prisma.template.findMany({
            where: {
                isPublished: true,
                sector: filters?.sector ?? undefined,
                evaluationType: filters?.evaluationType ?? undefined,
                name: filters?.keyword
                    ? { contains: filters.keyword, mode: 'insensitive' }
                    : undefined,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const template = await this.prisma.template.findUnique({ where: { id } });
        if (!template)
            throw new common_1.NotFoundException('Template not found.');
        return template;
    }
    async update(id, dto, updatedById) {
        const template = await this.findOne(id);
        const newVersion = template.version + 1;
        const updated = await this.prisma.template.update({
            where: { id },
            data: {
                name: dto.name,
                sector: dto.sector,
                evaluationType: dto.evaluationType,
                definition: dto.definition
                    ? (0, form_serialiser_1.serializeForm)(dto.definition)
                    : undefined,
                version: newVersion,
            },
        });
        if (dto.definition) {
            await this.prisma.templateVersion.create({
                data: {
                    templateId: id,
                    version: newVersion,
                    definition: (0, form_serialiser_1.serializeForm)(dto.definition),
                },
            });
        }
        await this.audit.log({
            userId: updatedById,
            action: 'TEMPLATE_UPDATED',
            resourceType: 'Template',
            resourceId: id,
            metadata: { newVersion },
        });
        return updated;
    }
    async publish(id, publishedById) {
        const template = await this.findOne(id);
        const updated = await this.prisma.template.update({
            where: { id },
            data: { isPublished: true },
        });
        await this.audit.log({
            userId: publishedById,
            action: 'TEMPLATE_PUBLISHED',
            resourceType: 'Template',
            resourceId: id,
        });
        return updated;
    }
    async delete(id, deletedById) {
        await this.findOne(id);
        await this.prisma.template.update({
            where: { id },
            data: { isPublished: false },
        });
        await this.audit.log({
            userId: deletedById,
            action: 'TEMPLATE_DELETED',
            resourceType: 'Template',
            resourceId: id,
        });
        return { id, deleted: true };
    }
    async instantiateAsForm(templateId, evaluationId, title, createdById) {
        const template = await this.findOne(templateId);
        const definition = (0, form_serialiser_1.deserializeForm)(JSON.stringify(template.definition));
        const formDefinition = {
            ...definition,
            formId: `form-${Date.now()}`,
            version: 1,
        };
        const form = await this.prisma.form.create({
            data: {
                evaluationId,
                title,
                definition: (0, form_serialiser_1.serializeForm)(formDefinition),
                templateId,
                templateVersion: template.version,
                createdById,
            },
        });
        await this.audit.log({
            userId: createdById,
            action: 'FORM_CREATED_FROM_TEMPLATE',
            resourceType: 'Form',
            resourceId: form.id,
            metadata: { templateId, templateVersion: template.version },
        });
        return form;
    }
    async getVersionHistory(templateId) {
        return this.prisma.templateVersion.findMany({
            where: { templateId },
            orderBy: { version: 'desc' },
        });
    }
};
exports.TemplatesService = TemplatesService;
exports.TemplatesService = TemplatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], TemplatesService);
//# sourceMappingURL=templates.service.js.map