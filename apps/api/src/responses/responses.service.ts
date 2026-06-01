import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { deserializeResponse, serializeResponse } from './response-serialiser';
import { ResponseData } from './response-data.types';

export class SubmitResponseDto {
  formId: string;
  answers: { questionId: string; value: unknown }[];
}

export class SaveDraftDto {
  formId: string;
  answers: { questionId: string; value: unknown }[];
}

export class SyncResponseDto {
  cachedResponseJson: string; // raw JSON from IndexedDB
}

@Injectable()
export class ResponsesService {
  private readonly logger = new Logger(ResponsesService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /** Map form-definition questionIds to database Question.id values */
  private async resolveAnswerQuestionIds(
    formId: string,
    answers: { questionId: string; value: unknown }[],
  ) {
    const questions = await this.prisma.question.findMany({
      where: { formId },
      select: { id: true, externalId: true },
    });
    const byExternal = new Map(questions.map((q) => [q.externalId, q.id]));

    return answers.map((a) => {
      const dbId = byExternal.get(a.questionId);
      if (!dbId) {
        throw new BadRequestException(
          `Unknown question ID in response: ${a.questionId}`,
        );
      }
      return { questionId: dbId, value: a.value };
    });
  }

  /** Ensure respondent is assigned to the form */
  private async assertAssignment(formId: string, respondentId: string) {
    const assignment = await this.prisma.formAssignment.findUnique({
      where: { formId_respondentId: { formId, respondentId } },
    });
    if (!assignment) {
      throw new BadRequestException(
        'You are not assigned to this form. Please contact your administrator.',
      );
    }
  }

  private assertFormAcceptsResponses(form: {
    status: string;
    responseDeadline: Date | null;
  }) {
    if (form.status === 'CLOSED') {
      throw new BadRequestException(
        'This form is closed and is no longer accepting responses. Please contact your consultant.',
      );
    }
    if (form.responseDeadline && new Date() > form.responseDeadline) {
      throw new BadRequestException(
        'The deadline for this form has passed. No further responses are being accepted.',
      );
    }
  }

  /** Save or update a draft (save-and-continue) */
  async saveDraft(dto: SaveDraftDto, respondentId: string) {
    const form = await this.prisma.form.findUnique({
      where: { id: dto.formId },
    });
    if (!form) throw new NotFoundException('Form not found.');

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
      throw new ConflictException(
        'You have already submitted this form. Drafts cannot be saved after submission.',
      );
    }

    const resolvedAnswers = await this.resolveAnswerQuestionIds(
      dto.formId,
      dto.answers,
    );

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
              value: a.value as any,
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
            value: a.value as any,
          })),
        },
      },
      include: { answers: true },
    });
  }

  /** Load an existing draft for save-and-continue */
  async getDraft(formId: string, respondentId: string) {
    await this.assertAssignment(formId, respondentId);

    const draft = await this.prisma.response.findFirst({
      where: { formId, respondentId, status: 'DRAFT' },
      include: { answers: true },
    });

    if (!draft) return null;

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

  /** Submit a response online (upgrades draft if present) */
  async submit(dto: SubmitResponseDto, respondentId: string) {
    const form = await this.prisma.form.findUnique({
      where: { id: dto.formId },
    });

    if (!form) throw new NotFoundException('Form not found.');

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
      throw new ConflictException(
        'You have already submitted a response for this form.',
      );
    }

    const resolvedAnswers = await this.resolveAnswerQuestionIds(
      dto.formId,
      dto.answers,
    );

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
              value: a.value as any,
            })),
          },
        },
        include: { answers: true },
      });
    } else {
      response = await this.prisma.response.create({
        data: {
          formId: dto.formId,
          respondentId,
          status: 'SUBMITTED',
          submittedAt: new Date(),
          answers: {
            create: resolvedAnswers.map((a) => ({
              questionId: a.questionId,
              value: a.value as any,
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

  /** Sync an offline-cached response */
  async syncOfflineResponse(dto: SyncResponseDto, respondentId: string) {
    let responseData: ResponseData;

    // Deserialise and validate — quarantine on failure (Property 40)
    try {
      responseData = deserializeResponse(dto.cachedResponseJson);
    } catch (error: any) {
      // Quarantine: preserve raw JSON, log error, notify consultant
      await this.quarantine(dto.cachedResponseJson, error.message, respondentId);
      throw new BadRequestException(
        'Your response could not be synced due to a data format issue. Your consultant has been notified. Please contact them for assistance.',
      );
    }

    // Validate respondent matches
    if (responseData.respondentId !== respondentId) {
      throw new BadRequestException(
        'This response does not belong to your account.',
      );
    }

    const form = await this.prisma.form.findUnique({
      where: { id: responseData.formId },
    });

    if (!form) {
      throw new NotFoundException('The form for this response no longer exists.');
    }

    // Check for conflict — response already exists on server (Requirement 6.5)
    const existing = await this.prisma.response.findFirst({
      where: {
        formId: responseData.formId,
        respondentId,
        status: { in: ['SUBMITTED', 'SYNCED'] },
      },
    });

    if (existing) {
      // Return conflict info for client to resolve
      throw new ConflictException({
        message: 'A response for this form already exists on the server.',
        conflict: true,
        serverResponseId: existing.id,
        serverSubmittedAt: existing.submittedAt,
      });
    }

    // Persist the synced response
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
            value: a.value as any,
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

  /** Get all responses for a form (consultant view) */
  async getFormResponses(formId: string) {
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

  /** Get a respondent's own responses */
  async getMyResponses(respondentId: string) {
    return this.prisma.response.findMany({
      where: { respondentId },
      include: {
        form: { select: { id: true, title: true, responseDeadline: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Forms assigned to the current respondent with completion status */
  async getMyAssignedForms(respondentId: string) {
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
        let completionStatus: 'not_started' | 'in_progress' | 'submitted' =
          'not_started';
        if (response?.status === 'DRAFT') completionStatus = 'in_progress';
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

  /** Quarantine a failed response — preserve raw data, log error */
  private async quarantine(
    rawJson: string,
    errorMessage: string,
    respondentId: string,
  ): Promise<void> {
    this.logger.error(
      `Response quarantined for respondent ${respondentId}: ${errorMessage}`,
    );

    // Store quarantined response with raw JSON preserved
    await this.prisma.response.create({
      data: {
        formId: 'unknown', // will be extracted if possible
        respondentId,
        status: 'QUARANTINED',
        rawCacheJson: rawJson,
      },
    }).catch(() => {
      // If we can't even save the quarantine record, just log it
      this.logger.error(`Failed to quarantine response: ${rawJson.substring(0, 200)}`);
    });

    await this.audit.log({
      userId: respondentId,
      action: 'RESPONSE_QUARANTINED',
      resourceType: 'Response',
      metadata: { error: errorMessage },
    });
  }
}
