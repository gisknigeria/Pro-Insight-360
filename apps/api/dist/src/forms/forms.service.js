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
exports.FormsService = exports.UpdateFormDto = exports.CreateFormDto = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const email_service_1 = require("../email/email.service");
const form_serialiser_1 = require("./form-serialiser");
class CreateFormDto {
    evaluationId;
    title;
    definition;
    templateId;
    templateVersion;
    responseDeadline;
}
exports.CreateFormDto = CreateFormDto;
class UpdateFormDto {
    title;
    definition;
    responseDeadline;
}
exports.UpdateFormDto = UpdateFormDto;
let FormsService = class FormsService {
    prisma;
    audit;
    email;
    constructor(prisma, audit, email) {
        this.prisma = prisma;
        this.audit = audit;
        this.email = email;
    }
    async create(dto, createdById) {
        const { valid, invalidRefs } = (0, form_serialiser_1.validateConditionalLogic)(dto.definition);
        if (!valid) {
            throw new common_1.BadRequestException(`Form contains conditional logic referencing unknown question IDs: ${invalidRefs.join(', ')}`);
        }
        const form = await this.prisma.form.create({
            data: {
                evaluationId: dto.evaluationId,
                title: dto.title,
                definition: (0, form_serialiser_1.serializeForm)(dto.definition),
                templateId: dto.templateId ?? null,
                templateVersion: dto.templateVersion ?? null,
                responseDeadline: dto.responseDeadline
                    ? new Date(dto.responseDeadline)
                    : null,
                createdById,
            },
        });
        await this.syncFormQuestions(form.id, dto.definition);
        await this.audit.log({
            userId: createdById,
            action: 'FORM_CREATED',
            resourceType: 'Form',
            resourceId: form.id,
            metadata: { title: dto.title, evaluationId: dto.evaluationId },
        });
        return form;
    }
    async findOne(id) {
        const form = await this.prisma.form.findUnique({
            where: { id },
            include: {
                _count: { select: { responses: true, formAssignments: true } },
            },
        });
        if (!form)
            throw new common_1.NotFoundException('Form not found.');
        return form;
    }
    async getDefinition(id) {
        const form = await this.findOne(id);
        return (0, form_serialiser_1.deserializeForm)(JSON.stringify(form.definition));
    }
    async update(id, dto, updatedById) {
        const form = await this.findOne(id);
        if (form.status === 'CLOSED') {
            throw new common_1.BadRequestException('This form is closed and cannot be edited.');
        }
        if (dto.definition) {
            const { valid, invalidRefs } = (0, form_serialiser_1.validateConditionalLogic)(dto.definition);
            if (!valid) {
                throw new common_1.BadRequestException(`Conditional logic references unknown question IDs: ${invalidRefs.join(', ')}`);
            }
        }
        const updated = await this.prisma.form.update({
            where: { id },
            data: {
                title: dto.title,
                definition: dto.definition
                    ? (0, form_serialiser_1.serializeForm)(dto.definition)
                    : undefined,
                responseDeadline: dto.responseDeadline
                    ? new Date(dto.responseDeadline)
                    : undefined,
            },
        });
        if (dto.definition) {
            await this.syncFormQuestions(id, dto.definition);
        }
        await this.audit.log({
            userId: updatedById,
            action: 'FORM_UPDATED',
            resourceType: 'Form',
            resourceId: id,
        });
        return updated;
    }
    async publish(id, publishedById) {
        const form = await this.findOne(id);
        if (form.status !== 'DRAFT') {
            throw new common_1.BadRequestException('Only draft forms can be published.');
        }
        const updated = await this.prisma.form.update({
            where: { id },
            data: { status: 'PUBLISHED' },
        });
        await this.audit.log({
            userId: publishedById,
            action: 'FORM_PUBLISHED',
            resourceType: 'Form',
            resourceId: id,
        });
        return updated;
    }
    async close(id, closedById) {
        await this.prisma.form.update({
            where: { id },
            data: { status: 'CLOSED' },
        });
        await this.audit.log({
            userId: closedById,
            action: 'FORM_CLOSED',
            resourceType: 'Form',
            resourceId: id,
        });
        return { id, status: 'CLOSED' };
    }
    async reopen(id, deadline, reopenedById) {
        const updated = await this.prisma.form.update({
            where: { id },
            data: {
                status: 'PUBLISHED',
                responseDeadline: new Date(deadline),
            },
        });
        await this.audit.log({
            userId: reopenedById,
            action: 'FORM_REOPENED',
            resourceType: 'Form',
            resourceId: id,
            metadata: { newDeadline: deadline },
        });
        return updated;
    }
    async syncFormQuestions(formId, definition) {
        const allQuestions = definition.pages.flatMap((p) => p.questions);
        const answerable = allQuestions.filter((q) => q.type !== 'section_header' && q.type !== 'instruction_block');
        await this.prisma.question.deleteMany({ where: { formId } });
        if (answerable.length === 0)
            return;
        await this.prisma.question.createMany({
            data: answerable.map((q, index) => ({
                formId,
                externalId: q.questionId,
                type: q.type,
                label: q.label || 'Untitled question',
                config: (q.config ?? {}),
                isRequired: q.isRequired,
                position: q.position ?? index,
                dimensions: q.dimensions ?? [],
            })),
        });
    }
    async checkQuestionDeletion(formId, questionId) {
        const definition = await this.getDefinition(formId);
        const dependentRules = (0, form_serialiser_1.getDependentRules)(definition, questionId);
        return {
            canDelete: dependentRules.length === 0,
            dependentRules,
        };
    }
    async getPrettyJson(id) {
        const form = await this.findOne(id);
        return (0, form_serialiser_1.prettyPrintForm)(JSON.stringify(form.definition));
    }
    async assignRespondents(formId, respondentIds, assignedById) {
        const form = await this.findOne(formId);
        const assignments = await this.prisma.formAssignment.createMany({
            data: respondentIds.map((respondentId) => ({ formId, respondentId })),
            skipDuplicates: true,
        });
        const respondents = await this.prisma.user.findMany({
            where: { id: { in: respondentIds } },
            select: { id: true, email: true },
        });
        const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
        for (const respondent of respondents) {
            await this.email
                .sendEmail({
                to: respondent.email,
                subject: `You have been assigned a form: ${form.title}`,
                htmlContent: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1d4ed8;">New form assigned to you</h2>
              <p>You have been asked to complete the form: <strong>${form.title}</strong></p>
              <a href="${frontendUrl}/my-forms"
                 style="display: inline-block; padding: 12px 24px; background: #1d4ed8;
                        color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
                Complete My Form
              </a>
              ${form.responseDeadline ? `<p style="color: #64748b; font-size: 14px;">Deadline: ${new Date(form.responseDeadline).toLocaleDateString()}</p>` : ''}
            </div>
          `,
            })
                .catch(() => { });
            await this.prisma.formAssignment.updateMany({
                where: { formId, respondentId: respondent.id },
                data: { notifiedAt: new Date() },
            });
        }
        await this.audit.log({
            userId: assignedById,
            action: 'FORM_RESPONDENTS_ASSIGNED',
            resourceType: 'Form',
            resourceId: formId,
            metadata: { respondentCount: respondentIds.length },
        });
        return { assigned: assignments.count };
    }
    async getCompletionStatus(formId) {
        const assignments = await this.prisma.formAssignment.findMany({
            where: { formId },
            include: {
                respondent: { select: { id: true, email: true } },
                form: {
                    include: {
                        responses: {
                            where: { status: { in: ['SUBMITTED', 'SYNCED'] } },
                            select: { respondentId: true, submittedAt: true },
                        },
                    },
                },
            },
        });
        return assignments.map((a) => {
            const response = a.form.responses.find((r) => r.respondentId === a.respondentId);
            return {
                respondentId: a.respondentId,
                email: a.respondent.email,
                assignedAt: a.assignedAt,
                notifiedAt: a.notifiedAt,
                status: response ? 'submitted' : 'pending',
                submittedAt: response?.submittedAt ?? null,
            };
        });
    }
};
exports.FormsService = FormsService;
exports.FormsService = FormsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        email_service_1.EmailService])
], FormsService);
//# sourceMappingURL=forms.service.js.map