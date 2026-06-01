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
exports.EvaluationsService = exports.UpdateEvaluationDto = exports.CreateEvaluationDto = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
const audit_service_1 = require("../audit/audit.service");
class CreateEvaluationDto {
    organisationId;
    title;
    startDate;
    endDate;
    consultantIds;
}
exports.CreateEvaluationDto = CreateEvaluationDto;
class UpdateEvaluationDto {
    title;
    startDate;
    endDate;
}
exports.UpdateEvaluationDto = UpdateEvaluationDto;
let EvaluationsService = class EvaluationsService {
    prisma;
    email;
    audit;
    constructor(prisma, email, audit) {
        this.prisma = prisma;
        this.email = email;
        this.audit = audit;
    }
    async create(dto, createdById) {
        if (!dto.organisationId || !dto.title || !dto.startDate) {
            throw new common_1.BadRequestException('Organisation, title, and start date are required to create an evaluation.');
        }
        const evaluation = await this.prisma.evaluation.create({
            data: {
                organisationId: dto.organisationId,
                title: dto.title,
                startDate: new Date(dto.startDate),
                endDate: dto.endDate ? new Date(dto.endDate) : null,
                createdById,
                status: 'DRAFT',
                consultants: dto.consultantIds?.length
                    ? {
                        create: dto.consultantIds.map((id) => ({
                            consultantId: id,
                        })),
                    }
                    : undefined,
            },
            include: {
                organisation: { select: { name: true } },
                consultants: { select: { consultantId: true } },
            },
        });
        await this.audit.log({
            userId: createdById,
            action: 'EVALUATION_CREATED',
            resourceType: 'Evaluation',
            resourceId: evaluation.id,
            metadata: { title: dto.title, organisationId: dto.organisationId },
        });
        return evaluation;
    }
    async findAll(userId, role) {
        const where = role === 'SUPER_ADMIN'
            ? {}
            : {
                OR: [
                    { createdById: userId },
                    { consultants: { some: { consultantId: userId } } },
                ],
            };
        return this.prisma.evaluation.findMany({
            where,
            include: {
                organisation: { select: { id: true, name: true } },
                _count: { select: { forms: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const evaluation = await this.prisma.evaluation.findUnique({
            where: { id },
            include: {
                organisation: { select: { id: true, name: true } },
                consultants: {
                    include: { consultant: { select: { id: true, email: true } } },
                },
                forms: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        responseDeadline: true,
                        _count: { select: { responses: true, formAssignments: true } },
                    },
                },
            },
        });
        if (!evaluation)
            throw new common_1.NotFoundException('Evaluation not found.');
        return evaluation;
    }
    async activate(id, activatedById) {
        const evaluation = await this.findOne(id);
        if (evaluation.status !== 'DRAFT') {
            throw new common_1.BadRequestException('Only evaluations in Draft status can be activated.');
        }
        const updated = await this.prisma.evaluation.update({
            where: { id },
            data: { status: 'ACTIVE' },
        });
        const assignments = await this.prisma.formAssignment.findMany({
            where: { form: { evaluationId: id } },
            include: {
                respondent: { select: { email: true } },
                form: { select: { title: true } },
            },
        });
        const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
        for (const assignment of assignments) {
            await this.email
                .sendEmail({
                to: assignment.respondent.email,
                subject: `Evaluation ready: ${evaluation.title}`,
                htmlContent: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1d4ed8;">You have been assigned an evaluation form</h2>
              <p>The evaluation <strong>${evaluation.title}</strong> is now active.</p>
              <p>You have been assigned the form: <strong>${assignment.form.title}</strong></p>
              <a href="${frontendUrl}/my-forms"
                 style="display: inline-block; padding: 12px 24px; background: #1d4ed8;
                        color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
                View My Forms
              </a>
            </div>
          `,
            })
                .catch(() => { });
        }
        await this.audit.log({
            userId: activatedById,
            action: 'EVALUATION_ACTIVATED',
            resourceType: 'Evaluation',
            resourceId: id,
        });
        return updated;
    }
    async archive(id, archivedById) {
        const evaluation = await this.findOne(id);
        if (evaluation.status === 'ARCHIVED') {
            throw new common_1.BadRequestException('Evaluation is already archived.');
        }
        const updated = await this.prisma.evaluation.update({
            where: { id },
            data: { status: 'ARCHIVED', archivedAt: new Date() },
        });
        await this.audit.log({
            userId: archivedById,
            action: 'EVALUATION_ARCHIVED',
            resourceType: 'Evaluation',
            resourceId: id,
        });
        return updated;
    }
    async assignConsultants(id, consultantIds, assignedById) {
        await this.findOne(id);
        await this.prisma.evaluationConsultant.createMany({
            data: consultantIds.map((consultantId) => ({ evaluationId: id, consultantId })),
            skipDuplicates: true,
        });
        await this.audit.log({
            userId: assignedById,
            action: 'EVALUATION_CONSULTANTS_ASSIGNED',
            resourceType: 'Evaluation',
            resourceId: id,
            metadata: { consultantIds },
        });
        return this.findOne(id);
    }
};
exports.EvaluationsService = EvaluationsService;
exports.EvaluationsService = EvaluationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService,
        audit_service_1.AuditService])
], EvaluationsService);
//# sourceMappingURL=evaluations.service.js.map