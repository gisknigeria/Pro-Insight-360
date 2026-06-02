import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type DigitalReadinessCategory =
  | 'Leadership & Strategy'
  | 'IT Infrastructure'
  | 'Cybersecurity'
  | 'Data Management'
  | 'Digital Skills'
  | 'Process Automation'
  | 'Customer Experience'
  | 'Innovation Culture'
  | 'Connectivity'
  | 'Software Adoption'
  | 'Change Management'
  | 'Budget & Investment'
  | 'Compliance & Governance'
  | 'Collaboration Tools';

export const DIGITAL_READINESS_BANDS = [
  { label: 'Initial', min: 0, max: 24 },
  { label: 'Developing', min: 25, max: 49 },
  { label: 'Defined', min: 50, max: 74 },
  { label: 'Optimising', min: 75, max: 100 },
];

export const GIS_READINESS_BANDS = [
  { label: 'Nascent', min: 0, max: 24 },
  { label: 'Emerging', min: 25, max: 49 },
  { label: 'Developing', min: 50, max: 74 },
  { label: 'Advanced', min: 75, max: 100 },
];

export const DIMENSION_BANDS = [
  { label: 'Very Low', min: 0, max: 20 },
  { label: 'Low', min: 21, max: 40 },
  { label: 'Moderate', min: 41, max: 60 },
  { label: 'High', min: 61, max: 80 },
  { label: 'Advanced', min: 81, max: 100 },
];

function getBand(score: number, bands: typeof DIGITAL_READINESS_BANDS): string {
  const band = bands.find((b) => score >= b.min && score <= b.max);
  return band?.label ?? 'Unknown';
}

function clamp(val: number): number {
  return Math.min(100, Math.max(0, Math.round(val * 100) / 100));
}

@Injectable()
export class ScoringService {
  constructor(private prisma: PrismaService) {}

  /**
   * Compute Digital Readiness Score across 14 categories.
   * Uses configurable weights from scoring_weights table.
   * Validates: Properties 22, 23, 24, 25
   */
  async computeDigitalReadiness(evaluationId: string) {
    const weights = await this.prisma.scoringWeight.findMany();
    const weightMap = new Map(weights.map((w) => [w.category, Number(w.weight)]));

    // Get all answers tagged with digital readiness dimensions
    const answers = await this.getAnswersForEvaluation(evaluationId);

    // Group answers by category (mapped from question config)
    const categoryScores: Record<string, number> = {};

    for (const [category] of weightMap) {
      const categoryAnswers = answers.filter(
        (a) => (a.question.config as any)?.digitalReadinessCategory === category,
      );

      if (categoryAnswers.length === 0) {
        categoryScores[category] = 0;
        continue;
      }

      // Average numeric/rating answers for this category
      const nums = categoryAnswers
        .map((a) => this.normaliseToScore(a.value, a.question.type))
        .filter((n) => n !== null) as number[];

      categoryScores[category] =
        nums.length > 0
          ? clamp(nums.reduce((s, n) => s + n, 0) / nums.length)
          : 0;
    }

    // Weighted average overall score
    let overallScore = 0;
    let totalWeight = 0;
    const weightsSnapshot: Record<string, number> = {};

    for (const [category, weight] of weightMap) {
      const score = categoryScores[category] ?? 0;
      overallScore += score * weight;
      totalWeight += weight;
      weightsSnapshot[category] = weight;
    }

    if (totalWeight > 0) overallScore = clamp(overallScore / totalWeight);

    const band = getBand(overallScore, DIGITAL_READINESS_BANDS);

    // Persist score results
    await this.upsertScore(evaluationId, 'DIGITAL_READINESS', overallScore, band, weightsSnapshot);

    for (const [category, score] of Object.entries(categoryScores)) {
      await this.upsertScore(evaluationId, 'CATEGORY', score, getBand(score, DIGITAL_READINESS_BANDS), weightsSnapshot, category);
    }

    return {
      overall: overallScore,
      band,
      categories: categoryScores,
      weightsSnapshot,
    };
  }

  /**
   * Compute GIS Readiness Score.
   * Validates: Properties 22, 23
   */
  async computeGISReadiness(evaluationId: string) {
    const answers = await this.getAnswersForEvaluation(evaluationId);
    const gisAnswers = answers.filter(
      (a) => (a.question.dimensions as string[])?.includes('WHO') &&
              (a.question.config as any)?.isGisQuestion === true,
    );

    if (gisAnswers.length === 0) {
      return { overall: 0, band: 'Nascent', departmentScores: {} };
    }

    const nums = gisAnswers
      .map((a) => this.normaliseToScore(a.value, a.question.type))
      .filter((n) => n !== null) as number[];

    const overall = nums.length > 0
      ? clamp(nums.reduce((s, n) => s + n, 0) / nums.length)
      : 0;

    const band = getBand(overall, GIS_READINESS_BANDS);

    await this.upsertScore(evaluationId, 'GIS_READINESS', overall, band);

    return { overall, band, departmentScores: {} };
  }

  /**
   * Compute dimension sub-scores (WHO, WHAT, HOW, WHEN).
   * Validates: Property 34
   */
  async computeDimensionScores(evaluationId: string) {
    const answers = await this.getAnswersForEvaluation(evaluationId);
    const dimensions = ['WHO', 'WHAT', 'HOW', 'WHEN'] as const;
    const results: Record<string, { score: number; band: string }> = {};

    for (const dim of dimensions) {
      const dimAnswers = answers.filter((a) =>
        (a.question.dimensions as string[])?.includes(dim),
      );

      const nums = dimAnswers
        .map((a) => this.normaliseToScore(a.value, a.question.type))
        .filter((n) => n !== null) as number[];

      const score = nums.length > 0
        ? clamp(nums.reduce((s, n) => s + n, 0) / nums.length)
        : 0;

      const band = getBand(score, DIMENSION_BANDS);
      results[dim] = { score, band };

      await this.upsertScore(evaluationId, 'DIMENSION', score, band, undefined, dim);
    }

    return results;
  }

  /**
   * Compute infrastructure readiness sub-score.
   */
  async computeInfrastructureScore(evaluationId: string) {
    const answers = await this.getAnswersForEvaluation(evaluationId);
    const infraAnswers = answers.filter(
      (a) => (a.question.config as any)?.isInfrastructureQuestion === true,
    );

    const nums = infraAnswers
      .map((a) => this.normaliseToScore(a.value, a.question.type))
      .filter((n) => n !== null) as number[];

    const score = nums.length > 0
      ? clamp(nums.reduce((s, n) => s + n, 0) / nums.length)
      : 0;

    const band = getBand(score, DIMENSION_BANDS);
    await this.upsertScore(evaluationId, 'INFRASTRUCTURE', score, band);

    return { score, band };
  }

  /** Run all scoring computations for an evaluation */
  async computeAll(evaluationId: string) {
    const [digital, gis, dimensions, infrastructure] = await Promise.all([
      this.computeDigitalReadiness(evaluationId),
      this.computeGISReadiness(evaluationId),
      this.computeDimensionScores(evaluationId),
      this.computeInfrastructureScore(evaluationId),
    ]);

    return { digital, gis, dimensions, infrastructure };
  }

  /** Get all stored scores for an evaluation */
  async getScores(evaluationId: string) {
    return this.prisma.scoreResult.findMany({
      where: { evaluationId },
      orderBy: { computedAt: 'desc' },
    });
  }

  /** Update scoring weights and recompute all active evaluations */
  async updateWeightsAndRecompute(
    weights: { category: string; weight: number }[],
    updatedById: string,
  ) {
    for (const w of weights) {
      await this.prisma.scoringWeight.upsert({
        where: { category: w.category },
        update: { weight: w.weight, updatedById },
        create: { category: w.category, weight: w.weight, updatedById },
      });
    }

    // Recompute for all active evaluations
    const activeEvals = await this.prisma.evaluation.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    await Promise.all(
      activeEvals.map((e) => this.computeDigitalReadiness(e.id)),
    );

    return { updated: weights.length, recomputed: activeEvals.length };
  }

  private async getAnswersForEvaluation(evaluationId: string) {
    return this.prisma.answer.findMany({
      where: {
        response: {
          form: { evaluationId },
          status: { in: ['SUBMITTED', 'SYNCED'] },
        },
      },
      include: {
        question: {
          select: { type: true, dimensions: true, config: true },
        },
      },
    });
  }

  private normaliseToScore(value: unknown, questionType: string): number | null {
    if (value === null || value === undefined) return null;

    switch (questionType) {
      case 'rating_scale':
        // Assume 1-5 scale → 0-100
        return clamp(((Number(value) - 1) / 4) * 100);
      case 'likert_scale':
        // Assume 1-5 → 0-100
        return clamp(((Number(value) - 1) / 4) * 100);
      case 'net_promoter_score':
        // 0-10 → 0-100
        return clamp((Number(value) / 10) * 100);
      case 'slider':
        return clamp(Number(value));
      case 'yes_no':
        return value === 'Yes' || value === true ? 100 : 0;
      case 'number':
        return clamp(Number(value));
      default:
        return null;
    }
  }

  private async upsertScore(
    evaluationId: string,
    scoreType: string,
    score: number,
    band: string,
    weightsSnapshot?: Record<string, number>,
    category?: string,
  ) {
    await this.prisma.scoreResult.create({
      data: {
        evaluationId,
        scope: 'ORGANISATION',
        scopeId: evaluationId,
        scoreType: scoreType as any,
        category: category ?? null,
        score,
        band,
        weightsSnapshot: weightsSnapshot ? (weightsSnapshot as any) : undefined,
      },
    });
  }
}
