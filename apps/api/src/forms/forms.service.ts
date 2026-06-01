import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { FormDefinition } from './form-definition.types';
import {
  serializeForm,
  deserializeForm,
  prettyPrintForm,
  validateConditionalLogic,
  getDependentRules,
  insertQuestion,
  reorderQuestions,
} from './form-serialiser';

export class CreateFormDto {
  evaluationId: string;
  title: string;
  definition: FormDefinition;
  templateId?: string;
  templateVersion?: number;
  responseDeadline?: string;
}

export class UpdateFormDto {
  title?: string;
  definition?: FormDefinition;
  responseDeadline?: string;
}

@Injectable()
export class FormsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private email: EmailService,
  ) {}

  async create(dto: CreateFormDto, createdById: string) {
    // Validate conditional logic before saving
    const { valid, invalidRefs } = validateConditionalLogic(dto.definition);
    if (!valid) {
      throw new BadRequestException(
        `Form contains conditional logic referencing unknown question IDs: ${invalidRefs.join(', ')}`,
      );
    }

    const form = await this.prisma.form.create({
      data: {
        evaluationId: dto.evaluationId,
        title: dto.title,
        definition: serializeForm(dto.definition) as any,
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

  async findOne(id: string) {
    const form = await this.prisma.form.findUnique({
      where: { id },
      include: {
        _count: { select: { responses: true, formAssignments: true } },
      },
    });
    if (!form) throw new NotFoundException('Form not found.');
    return form;
  }

  async getDefinition(id: string): Promise<FormDefinition> {
    const form = await this.findOne(id);
    return deserializeForm(JSON.stringify(form.definition));
  }

  async update(id: string, dto: UpdateFormDto, updatedById: string) {
    const form = await this.findOne(id);

    if (form.status === 'CLOSED') {
      throw new BadRequestException(
        'This form is closed and cannot be edited.',
      );
    }

    if (dto.definition) {
      const { valid, invalidRefs } = validateConditionalLogic(dto.definition);
      if (!valid) {
        throw new BadRequestException(
          `Conditional logic references unknown question IDs: ${invalidRefs.join(', ')}`,
        );
      }
    }

    const updated = await this.prisma.form.update({
      where: { id },
      data: {
        title: dto.title,
        definition: dto.definition
          ? (serializeForm(dto.definition) as any)
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

  async publish(id: string, publishedById: string) {
    const form = await this.findOne(id);
    if (form.status !== 'DRAFT') {
      throw new BadRequestException('Only draft forms can be published.');
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

  async close(id: string, closedById: string) {
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

  async reopen(id: string, deadline: string, reopenedById: string) {
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

  /** Sync question rows from form definition (externalId = definition questionId) */
  private async syncFormQuestions(formId: string, definition: FormDefinition) {
    const allQuestions = definition.pages.flatMap((p) => p.questions);
    const answerable = allQuestions.filter(
      (q) => q.type !== 'section_header' && q.type !== 'instruction_block',
    );

    await this.prisma.question.deleteMany({ where: { formId } });

    if (answerable.length === 0) return;

    await this.prisma.question.createMany({
      data: answerable.map((q, index) => ({
        formId,
        externalId: q.questionId,
        type: q.type,
        label: q.label || 'Untitled question',
        config: (q.config ?? {}) as object,
        isRequired: q.isRequired,
        position: q.position ?? index,
        dimensions: q.dimensions ?? [],
      })),
    });
  }

  /** Check if deleting a question would break conditional logic */
  async checkQuestionDeletion(
    formId: string,
    questionId: string,
  ): Promise<{ canDelete: boolean; dependentRules: unknown[] }> {
    const definition = await this.getDefinition(formId);
    const dependentRules = getDependentRules(definition, questionId);
    return {
      canDelete: dependentRules.length === 0,
      dependentRules,
    };
  }

  /** Get pretty-printed form JSON for debugging/export */
  async getPrettyJson(id: string): Promise<string> {
    const form = await this.findOne(id);
    return prettyPrintForm(JSON.stringify(form.definition));
  }

  /** Assign respondents to a form and send notifications */
  async assignRespondents(
    formId: string,
    respondentIds: string[],
    assignedById: string,
  ) {
    const form = await this.findOne(formId);

    const assignments = await this.prisma.formAssignment.createMany({
      data: respondentIds.map((respondentId) => ({ formId, respondentId })),
      skipDuplicates: true,
    });

    // Send email notifications to newly assigned respondents
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
        .catch(() => {});

      // Mark as notified
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

  /** Get completion status for all respondents on a form */
  async getCompletionStatus(formId: string) {
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
      const response = a.form.responses.find(
        (r) => r.respondentId === a.respondentId,
      );
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
}
