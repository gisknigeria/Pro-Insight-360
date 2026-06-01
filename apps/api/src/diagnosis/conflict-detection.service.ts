import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

const NUMERIC_VARIANCE_THRESHOLD = 0.2; // 20%

@Injectable()
export class ConflictDetectionService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async detectConflicts(evaluationId: string): Promise<void> {
    const forms = await this.prisma.form.findMany({
      where: { evaluationId },
      include: {
        questions: true,
        responses: {
          where: { status: { in: ['SUBMITTED', 'SYNCED'] } },
          include: { answers: true },
        },
      },
    });

    for (const form of forms) {
      for (const question of form.questions) {
        const answers = form.responses.flatMap((r) =>
          r.answers
            .filter((a) => a.questionId === question.id)
            .map((a) => ({ respondentId: r.respondentId, value: a.value })),
        );

        if (answers.length < 2) continue;

        const isNumeric = ['number', 'rating_scale', 'slider'].includes(question.type);
        const isChoice = ['single_choice', 'dropdown', 'yes_no'].includes(question.type);

        if (isNumeric) {
          await this.checkNumericConflict(evaluationId, question.id, answers);
        } else if (isChoice) {
          await this.checkChoiceConflict(evaluationId, question.id, answers);
        }
      }
    }
  }

  private async checkNumericConflict(
    evaluationId: string,
    questionId: string,
    answers: { respondentId: string; value: unknown }[],
  ): Promise<void> {
    const nums = answers
      .map((a) => ({ respondentId: a.respondentId, num: Number(a.value) }))
      .filter((a) => !isNaN(a.num));

    if (nums.length < 2) return;

    const values = nums.map((n) => n.num);
    const max = Math.max(...values);
    const min = Math.min(...values);

    if (max === 0) return;
    const variance = (max - min) / max;

    if (variance > NUMERIC_VARIANCE_THRESHOLD) {
      await this.upsertConflict(evaluationId, questionId, 'NUMERIC_VARIANCE',
        nums.map((n) => ({ respondentId: n.respondentId, value: n.num })),
      );
    }
  }

  private async checkChoiceConflict(
    evaluationId: string,
    questionId: string,
    answers: { respondentId: string; value: unknown }[],
  ): Promise<void> {
    const uniqueValues = new Set(answers.map((a) => String(a.value)));
    if (uniqueValues.size > 1) {
      await this.upsertConflict(
        evaluationId,
        questionId,
        'CONTRADICTORY_CHOICE',
        answers.map((a) => ({ respondentId: a.respondentId, value: a.value })),
      );
    }
  }

  private async upsertConflict(
    evaluationId: string,
    questionId: string,
    conflictType: 'NUMERIC_VARIANCE' | 'CONTRADICTORY_CHOICE',
    conflictingValues: { respondentId: string; value: unknown }[],
  ): Promise<void> {
    const existing = await this.prisma.conflict.findFirst({
      where: { evaluationId, questionId, isResolved: false },
    });

    if (existing) {
      await this.prisma.conflict.update({
        where: { id: existing.id },
        data: { conflictingValues: conflictingValues as any },
      });
    } else {
      await this.prisma.conflict.create({
        data: {
          evaluationId,
          questionId,
          conflictType,
          conflictingValues: conflictingValues as any,
        },
      });
    }
  }

  async getConflicts(evaluationId: string) {
    return this.prisma.conflict.findMany({
      where: { evaluationId },
      include: {
        question: { select: { label: true, type: true } },
        resolvedBy: { select: { email: true } },
      },
      orderBy: { isResolved: 'asc' },
    });
  }

  async resolveConflict(
    conflictId: string,
    resolutionNote: string,
    resolvedById: string,
  ) {
    const updated = await this.prisma.conflict.update({
      where: { id: conflictId },
      data: {
        isResolved: true,
        resolutionNote,
        resolvedById,
        resolvedAt: new Date(),
      },
    });

    await this.audit.log({
      userId: resolvedById,
      action: 'CONFLICT_RESOLVED',
      resourceType: 'Conflict',
      resourceId: conflictId,
      metadata: { resolutionNote },
    });

    return updated;
  }
}
