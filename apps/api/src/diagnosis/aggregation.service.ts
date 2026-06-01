import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface QuestionAggregation {
  questionId: string;
  questionLabel: string;
  questionType: string;
  totalResponses: number;
  // For choice questions: frequency counts per option
  frequencies?: Record<string, number>;
  // For numeric questions: stats
  average?: number;
  min?: number;
  max?: number;
  // Pattern detected if ≥60% select same option
  pattern?: {
    description: string;
    dominantValue: string;
    percentage: number;
  };
}

export interface AggregationResult {
  evaluationId: string;
  formId: string;
  totalRespondents: number;
  submittedCount: number;
  completionRate: number;
  questions: QuestionAggregation[];
  computedAt: string;
}

const PATTERN_THRESHOLD = 0.6; // 60%

@Injectable()
export class AggregationService {
  constructor(private prisma: PrismaService) {}

  async aggregateForm(formId: string): Promise<AggregationResult> {
    const form = await this.prisma.form.findUniqueOrThrow({
      where: { id: formId },
      include: {
        questions: { orderBy: { position: 'asc' } },
        formAssignments: true,
        responses: {
          where: { status: { in: ['SUBMITTED', 'SYNCED'] } },
          include: { answers: true },
        },
      },
    });

    const totalRespondents = form.formAssignments.length;
    const submittedCount = form.responses.length;
    const completionRate =
      totalRespondents > 0
        ? Math.round((submittedCount / totalRespondents) * 100)
        : 0;

    const questions: QuestionAggregation[] = form.questions.map((q) => {
      const answers = form.responses.flatMap((r) =>
        r.answers.filter((a) => a.questionId === q.id),
      );

      const agg: QuestionAggregation = {
        questionId: q.id,
        questionLabel: q.label,
        questionType: q.type,
        totalResponses: answers.length,
      };

      if (answers.length === 0) return agg;

      const isNumeric = ['number', 'rating_scale', 'slider', 'net_promoter_score'].includes(q.type);
      const isChoice = ['single_choice', 'dropdown', 'yes_no', 'likert_scale'].includes(q.type);

      if (isNumeric) {
        const nums = answers
          .map((a) => Number(a.value))
          .filter((n) => !isNaN(n));
        if (nums.length > 0) {
          agg.average = Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 100) / 100;
          agg.min = Math.min(...nums);
          agg.max = Math.max(...nums);
        }
      }

      if (isChoice || isNumeric) {
        const freq: Record<string, number> = {};
        for (const a of answers) {
          const key = String(a.value);
          freq[key] = (freq[key] ?? 0) + 1;
        }
        agg.frequencies = freq;

        // Detect pattern: ≥60% select same option
        const dominant = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
        if (dominant) {
          const pct = dominant[1] / answers.length;
          if (pct >= PATTERN_THRESHOLD) {
            agg.pattern = {
              description: `${Math.round(pct * 100)}% of respondents selected "${dominant[0]}"`,
              dominantValue: dominant[0],
              percentage: Math.round(pct * 100),
            };
          }
        }
      }

      return agg;
    });

    return {
      evaluationId: form.evaluationId,
      formId,
      totalRespondents,
      submittedCount,
      completionRate,
      questions,
      computedAt: new Date().toISOString(),
    };
  }

  async aggregateEvaluation(evaluationId: string) {
    const forms = await this.prisma.form.findMany({
      where: { evaluationId },
      select: { id: true, title: true },
    });

    const results = await Promise.all(
      forms.map((f) => this.aggregateForm(f.id)),
    );

    return {
      evaluationId,
      forms: results.map((r, i) => ({ ...r, formTitle: forms[i].title })),
      aggregatedAt: new Date().toISOString(),
    };
  }
}
