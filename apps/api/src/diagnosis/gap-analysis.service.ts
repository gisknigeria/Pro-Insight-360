import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type GapSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface Gap {
  category: string;
  description: string;
  severity: GapSeverity;
  affectedDepartments: string[];
  evidence: string[];
  recommendedAction: string;
}

@Injectable()
export class GapAnalysisService {
  constructor(private prisma: PrismaService) {}

  async analyseEvaluation(evaluationId: string): Promise<Gap[]> {
    const answers = await this.prisma.answer.findMany({
      where: {
        response: {
          form: { evaluationId },
          status: { in: ['SUBMITTED', 'SYNCED'] },
        },
      },
      include: {
        question: { select: { label: true, type: true, config: true, dimensions: true } },
        response: { include: { respondent: { select: { email: true } } } },
      },
    });

    const gaps: Gap[] = [];

    // Hardware gaps — items marked as unavailable or inadequate
    const hardwareAnswers = answers.filter(
      (a) => (a.question.config as any)?.isHardwareQuestion === true,
    );
    const hardwareGaps = this.detectHardwareGaps(hardwareAnswers);
    gaps.push(...hardwareGaps);

    // Software gaps
    const softwareAnswers = answers.filter(
      (a) => (a.question.config as any)?.isSoftwareQuestion === true,
    );
    const softwareGaps = this.detectSoftwareGaps(softwareAnswers);
    gaps.push(...softwareGaps);

    // Skills gaps — low skill ratings
    const skillAnswers = answers.filter(
      (a) => (a.question.config as any)?.isSkillQuestion === true,
    );
    const skillGaps = this.detectSkillGaps(skillAnswers);
    gaps.push(...skillGaps);

    // Process gaps — manual processes, approval delays
    const processAnswers = answers.filter(
      (a) => (a.question.dimensions as string[])?.includes('HOW'),
    );
    const processGaps = this.detectProcessGaps(processAnswers);
    gaps.push(...processGaps);

    return gaps;
  }

  private detectHardwareGaps(
    answers: { value: unknown; question: { label: string; config: unknown } }[],
  ): Gap[] {
    const gaps: Gap[] = [];
    const unavailable = answers.filter(
      (a) => String(a.value).toLowerCase().includes('no') ||
             String(a.value).toLowerCase().includes('unavailable') ||
             String(a.value) === '0',
    );

    if (unavailable.length > 0) {
      gaps.push({
        category: 'Hardware',
        description: `${unavailable.length} hardware item(s) reported as unavailable or inadequate`,
        severity: unavailable.length >= 3 ? 'critical' : unavailable.length >= 2 ? 'high' : 'medium',
        affectedDepartments: [],
        evidence: unavailable.map((a) => `${a.question.label}: ${a.value}`),
        recommendedAction: 'Procure missing hardware items as a priority to enable digital operations.',
      });
    }

    return gaps;
  }

  private detectSoftwareGaps(
    answers: { value: unknown; question: { label: string } }[],
  ): Gap[] {
    const gaps: Gap[] = [];
    const missing = answers.filter(
      (a) => String(a.value).toLowerCase().includes('no') ||
             String(a.value).toLowerCase().includes('none'),
    );

    if (missing.length > 0) {
      gaps.push({
        category: 'Software',
        description: `${missing.length} software system(s) reported as missing or not in use`,
        severity: missing.length >= 3 ? 'high' : 'medium',
        affectedDepartments: [],
        evidence: missing.map((a) => `${a.question.label}: ${a.value}`),
        recommendedAction: 'Evaluate and deploy appropriate software solutions to fill identified gaps.',
      });
    }

    return gaps;
  }

  private detectSkillGaps(
    answers: { value: unknown; question: { label: string } }[],
  ): Gap[] {
    const gaps: Gap[] = [];
    const lowSkill = answers.filter((a) => {
      const val = String(a.value).toLowerCase();
      return val === 'none' || val === 'basic' || val === '1' || val === '2';
    });

    if (lowSkill.length > 0) {
      gaps.push({
        category: 'Technical Skills',
        description: `${lowSkill.length} skill area(s) rated as None or Basic`,
        severity: lowSkill.length >= 5 ? 'high' : 'medium',
        affectedDepartments: [],
        evidence: lowSkill.map((a) => `${a.question.label}: ${a.value}`),
        recommendedAction: 'Develop a targeted training programme to address identified skill gaps.',
      });
    }

    return gaps;
  }

  private detectProcessGaps(
    answers: { value: unknown; question: { label: string } }[],
  ): Gap[] {
    const gaps: Gap[] = [];
    const manualProcesses = answers.filter((a) => {
      const val = String(a.value).toLowerCase();
      return val.includes('manual') || val.includes('paper') || val.includes('physical');
    });

    if (manualProcesses.length > 0) {
      gaps.push({
        category: 'Process Automation',
        description: `${manualProcesses.length} process(es) identified as manual or paper-based`,
        severity: manualProcesses.length >= 5 ? 'high' : 'medium',
        affectedDepartments: [],
        evidence: manualProcesses.map((a) => `${a.question.label}: ${a.value}`),
        recommendedAction: 'Prioritise automation of manual processes to improve efficiency and reduce errors.',
      });
    }

    return gaps;
  }

  async getGapSummary(evaluationId: string) {
    const gaps = await this.analyseEvaluation(evaluationId);
    const bySeverity = {
      critical: gaps.filter((g) => g.severity === 'critical').length,
      high: gaps.filter((g) => g.severity === 'high').length,
      medium: gaps.filter((g) => g.severity === 'medium').length,
      low: gaps.filter((g) => g.severity === 'low').length,
    };

    return {
      total: gaps.length,
      bySeverity,
      byCategory: this.groupByCategory(gaps),
      gaps,
    };
  }

  private groupByCategory(gaps: Gap[]): Record<string, Gap[]> {
    return gaps.reduce(
      (acc, gap) => {
        if (!acc[gap.category]) acc[gap.category] = [];
        acc[gap.category].push(gap);
        return acc;
      },
      {} as Record<string, Gap[]>,
    );
  }
}
