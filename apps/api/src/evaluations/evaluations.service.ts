import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import { EvaluationStatus } from '@prisma/client';

export class CreateEvaluationDto {
  organisationId: string;
  title: string;
  startDate: string;
  endDate?: string;
  consultantIds?: string[];
}

export class UpdateEvaluationDto {
  title?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class EvaluationsService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private audit: AuditService,
  ) {}

  async create(dto: CreateEvaluationDto, createdById: string) {
    if (!dto.organisationId || !dto.title || !dto.startDate) {
      throw new BadRequestException(
        'Organisation, title, and start date are required to create an evaluation.',
      );
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

  async findAll(userId: string, role: string) {
    // Super admins see all; consultants see assigned ones
    const where =
      role === 'SUPER_ADMIN'
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

  async findOne(id: string) {
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

    if (!evaluation) throw new NotFoundException('Evaluation not found.');
    return evaluation;
  }

  async activate(id: string, activatedById: string) {
    const evaluation = await this.findOne(id);

    if (evaluation.status !== 'DRAFT') {
      throw new BadRequestException(
        'Only evaluations in Draft status can be activated.',
      );
    }

    const updated = await this.prisma.evaluation.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    // Notify all assigned respondents
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
        .catch(() => {}); // don't block activation on email failure
    }

    await this.audit.log({
      userId: activatedById,
      action: 'EVALUATION_ACTIVATED',
      resourceType: 'Evaluation',
      resourceId: id,
    });

    return updated;
  }

  async archive(id: string, archivedById: string) {
    const evaluation = await this.findOne(id);

    if (evaluation.status === 'ARCHIVED') {
      throw new BadRequestException('Evaluation is already archived.');
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

  async assignConsultants(
    id: string,
    consultantIds: string[],
    assignedById: string,
  ) {
    await this.findOne(id);

    // Upsert consultants — skip duplicates
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
}
