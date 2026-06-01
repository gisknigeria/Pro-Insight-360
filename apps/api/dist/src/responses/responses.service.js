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
var ResponsesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponsesService = exports.SyncResponseDto = exports.SaveDraftDto = exports.SubmitResponseDto = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const response_serialiser_1 = require("./response-serialiser");
class SubmitResponseDto {
    formId;
    answers;
}
exports.SubmitResponseDto = SubmitResponseDto;
class SaveDraftDto {
    formId;
    answers;
}
exports.SaveDraftDto = SaveDraftDto;
class SyncResponseDto {
    cachedResponseJson;
}
exports.SyncResponseDto = SyncResponseDto;
let ResponsesService = ResponsesService_1 = class ResponsesService {
    prisma;
    audit;
    logger = new common_1.Logger(ResponsesService_1.name);
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async resolveAnswerQuestionIds(formId, answers) {
        const questions = await this.prisma.question.findMany({
            where: { formId },
            select: { id: true, externalId: true },
        });
        const byExternal = new Map(questions.map((q) => [q.externalId, q.id]));
        return answers.map((a) => {
            const dbId = byExternal.get(a.questionId);
            if (!dbId) {
                throw new common_1.BadRequestException(`Unknown question ID in response: ${a.questionId}`);
            }
            return { questionId: dbId, value: a.value };
        });
    }
    async assertAssignment(formId, respondentId) {
        const assignment = await this.prisma.formAssignment.findUnique({
            where: { formId_respondentId: { formId, respondentId } },
        });
        if (!assignment) {
            throw new common_1.BadRequestException('You are not assigned to this form. Please contact your administrator.');
        }
    }
    assertFormAcceptsResponses(form) {
        if (form.status === 'CLOSED') {
            throw new common_1.BadRequestException('This form is closed and is no longer accepting responses. Please contact your consultant.');
        }
        if (form.responseDeadline && new Date() > form.responseDeadline) {
            throw new common_1.BadRequestException('The deadline for this form has passed. No further responses are being accepted.');
        }
    }
    async saveDraft(dto, respondentId) {
        const form = await this.prisma.form.findUnique({
            where: { id: dto.formId },
        });
        if (!form)
            throw new common_1.NotFoundException('Form not found.');
        await this.assertAssignment(dto.formId, respondentId);
        this.assertFormAcceptsResponses(form);
        const submitted = await this.prisma.response.findFirst({
            where: {
                formId: dto.formId,
                respondentId,
                status: { in: ['SUBMITTED', 'SYNCED'] },
            },
        });
        if (submitted) {
            throw new common_1.ConflictException('You have already submitted this form. Drafts cannot be saved after submission.');
        }
        const resolvedAnswers = await this.resolveAnswerQuestionIds(dto.formId, dto.answers);
        const existingDraft = await this.prisma.response.findFirst({
            where: { formId: dto.formId, respondentId, status: 'DRAFT' },
        });
        if (existingDraft) {
            await this.prisma.answer.deleteMany({
                where: { responseId: existingDraft.id },
            });
            const updated = await this.prisma.response.update({
                where: { id: existingDraft.id },
                data: {
                    answers: {
                        create: resolvedAnswers.map((a) => ({
                            questionId: a.questionId,
                            value: a.value,
                        })),
                    },
                },
                include: { answers: true },
            });
            return updated;
        }
        return this.prisma.response.create({
            data: {
                formId: dto.formId,
                respondentId,
                status: 'DRAFT',
                answers: {
                    create: resolvedAnswers.map((a) => ({
                        questionId: a.questionId,
                        value: a.value,
                    })),
                },
            },
            include: { answers: true },
        });
    }
    async getDraft(formId, respondentId) {
        await this.assertAssignment(formId, respondentId);
        const draft = await this.prisma.response.findFirst({
            where: { formId, respondentId, status: 'DRAFT' },
            include: { answers: true },
        });
        if (!draft)
            return null;
        const questions = await this.prisma.question.findMany({
            where: { formId },
            select: { id: true, externalId: true },
        });
        const byDbId = new Map(questions.map((q) => [q.id, q.externalId]));
        return {
            responseId: draft.id,
            answers: draft.answers.map((a) => ({
                questionId: byDbId.get(a.questionId) ?? a.questionId,
                value: a.value,
            })),
        };
    }
    async submit(dto, respondentId) {
        const form = await this.prisma.form.findUnique({
            where: { id: dto.formId },
        });
        if (!form)
            throw new common_1.NotFoundException('Form not found.');
        await this.assertAssignment(dto.formId, respondentId);
        this.assertFormAcceptsResponses(form);
        const existing = await this.prisma.response.findFirst({
            where: {
                formId: dto.formId,
                respondentId,
                status: { in: ['SUBMITTED', 'SYNCED'] },
            },
        });
        if (existing) {
            throw new common_1.ConflictException('You have already submitted a response for this form.');
        }
        const resolvedAnswers = await this.resolveAnswerQuestionIds(dto.formId, dto.answers);
        const draft = await this.prisma.response.findFirst({
            where: { formId: dto.formId, respondentId, status: 'DRAFT' },
        });
        let response;
        if (draft) {
            await this.prisma.answer.deleteMany({ where: { responseId: draft.id } });
            response = await this.prisma.response.update({
                where: { id: draft.id },
                data: {
                    status: 'SUBMITTED',
                    submittedAt: new Date(),
                    answers: {
                        create: resolvedAnswers.map((a) => ({
                            questionId: a.questionId,
                            value: a.value,
                        })),
                    },
                },
                include: { answers: true },
            });
        }
        else {
            response = await this.prisma.response.create({
                data: {
                    formId: dto.formId,
                    respondentId,
                    status: 'SUBMITTED',
                    submittedAt: new Date(),
                    answers: {
                        create: resolvedAnswers.map((a) => ({
                            questionId: a.questionId,
                            value: a.value,
                        })),
                    },
                },
                include: { answers: true },
            });
        }
        await this.audit.log({
            userId: respondentId,
            action: 'RESPONSE_SUBMITTED',
            resourceType: 'Response',
            resourceId: response.id,
            metadata: { formId: dto.formId, answerCount: dto.answers.length },
        });
        return response;
    }
    async syncOfflineResponse(dto, respondentId) {
        let responseData;
        try {
            responseData = (0, response_serialiser_1.deserializeResponse)(dto.cachedResponseJson);
        }
        catch (error) {
            await this.quarantine(dto.cachedResponseJson, error.message, respondentId);
            throw new common_1.BadRequestException('Your response could not be synced due to a data format issue. Your consultant has been notified. Please contact them for assistance.');
        }
        if (responseData.respondentId !== respondentId) {
            throw new common_1.BadRequestException('This response does not belong to your account.');
        }
        const form = await this.prisma.form.findUnique({
            where: { id: responseData.formId },
        });
        if (!form) {
            throw new common_1.NotFoundException('The form for this response no longer exists.');
        }
        const existing = await this.prisma.response.findFirst({
            where: {
                formId: responseData.formId,
                respondentId,
                status: { in: ['SUBMITTED', 'SYNCED'] },
            },
        });
        if (existing) {
            throw new common_1.ConflictException({
                message: 'A response for this form already exists on the server.',
                conflict: true,
                serverResponseId: existing.id,
                serverSubmittedAt: existing.submittedAt,
            });
        }
        const response = await this.prisma.response.create({
            data: {
                formId: responseData.formId,
                respondentId,
                status: 'SYNCED',
                submittedAt: new Date(responseData.savedAt),
                syncedAt: new Date(),
                answers: {
                    create: responseData.answers.map((a) => ({
                        questionId: a.questionId,
                        value: a.value,
                    })),
                },
            },
        });
        await this.audit.log({
            userId: respondentId,
            action: 'RESPONSE_SYNCED',
            resourceType: 'Response',
            resourceId: response.id,
            metadata: { formId: responseData.formId },
        });
        return { synced: true, responseId: response.id };
    }
    async getFormResponses(formId) {
        return this.prisma.response.findMany({
            where: { formId, status: { in: ['SUBMITTED', 'SYNCED'] } },
            include: {
                respondent: { select: { id: true, email: true } },
                answers: {
                    include: { question: { select: { label: true, type: true } } },
                },
            },
            orderBy: { submittedAt: 'desc' },
        });
    }
    async getMyResponses(respondentId) {
        return this.prisma.response.findMany({
            where: { respondentId },
            include: {
                form: { select: { id: true, title: true, responseDeadline: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getMyAssignedForms(respondentId) {
        const assignments = await this.prisma.formAssignment.findMany({
            where: { respondentId },
            include: {
                form: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        responseDeadline: true,
                        evaluation: { select: { title: true } },
                    },
                },
            },
            orderBy: { assignedAt: 'desc' },
        });
        const responses = await this.prisma.response.findMany({
            where: {
                respondentId,
                formId: { in: assignments.map((a) => a.formId) },
            },
            select: { formId: true, status: true, submittedAt: true },
        });
        return assignments
            .filter((a) => a.form.status === 'PUBLISHED')
            .map((a) => {
            const response = responses.find((r) => r.formId === a.formId);
            let completionStatus = 'not_started';
            if (response?.status === 'DRAFT')
                completionStatus = 'in_progress';
            if (response?.status === 'SUBMITTED' || response?.status === 'SYNCED') {
                completionStatus = 'submitted';
            }
            return {
                formId: a.form.id,
                title: a.form.title,
                evaluationTitle: a.form.evaluation.title,
                responseDeadline: a.form.responseDeadline,
                assignedAt: a.assignedAt,
                completionStatus,
                submittedAt: response?.submittedAt ?? null,
            };
        });
    }
    async quarantine(rawJson, errorMessage, respondentId) {
        this.logger.error(`Response quarantined for respondent ${respondentId}: ${errorMessage}`);
        await this.prisma.response.create({
            data: {
                formId: 'unknown',
                respondentId,
                status: 'QUARANTINED',
                rawCacheJson: rawJson,
            },
        }).catch(() => {
            this.logger.error(`Failed to quarantine response: ${rawJson.substring(0, 200)}`);
        });
        await this.audit.log({
            userId: respondentId,
            action: 'RESPONSE_QUARANTINED',
            resourceType: 'Response',
            metadata: { error: errorMessage },
        });
    }
};
exports.ResponsesService = ResponsesService;
exports.ResponsesService = ResponsesService = ResponsesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], ResponsesService);
//# sourceMappingURL=responses.service.js.map