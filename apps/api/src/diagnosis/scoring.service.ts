import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ScoreBand = 'Nascent' | 'Emerging' | 'Developing' | 'Advanced';

export interface GISScoreResult {
  overall: number;
  band: ScoreBand;
  categories: {
    dataContent: number;
    technology: number;
    peopleSkills: number;
    governance: number;
  };
}

export interface InfrastructureScoreResult {
  overall: number;
  band: ScoreBand;
  components: {
    hardware: number;
    software: number;
    connectivity: number;
    backup: number;
  };
}

@Injectable()
export class ScoringService {
  constructor(private prisma: PrismaService) {}

  /**
   * Compute GIS Readiness Score from responses
   * Maps to Task 22.2: GIS Readiness Score computation per respondent (0-100 scale)
   */
  computeGISScoreFromAnswers(answers: {
    questionId: string;
    questionLabel: string;
    value: unknown;
  }[]): GISScoreResult {
    // GIS Readiness categories mapped to question labels
    const dataContentQuestions = [
      'spatial data availability',
      'data quality',
      'data accessibility',
      'data maintenance',
    ];
    const technologyQuestions = [
      'gis software capability',
      'hardware adequacy',
      'network infrastructure',
    ];
    const peopleSkillsQuestions = [
      'staff gis competency',
      'training availability',
    ];
    const governanceQuestions = [
      'gis governance framework',
      'strategic alignment',
    ];

    const getAverage = (questionLabels: string[]) => {
      const matchingAnswers = answers.filter((a) =>
        questionLabels.some((label) =>
          a.questionLabel.toLowerCase().includes(label),
        ),
      );
      if (matchingAnswers.length === 0) return 0;
      const sum = matchingAnswers.reduce((acc, a) => {
        const val = typeof a.value === 'number' ? a.value : parseFloat(String(a.value)) || 0;
        return acc + val;
      }, 0);
      return sum / matchingAnswers.length;
    };

    const dataContent = getAverage(dataContentQuestions);
    const technology = getAverage(technologyQuestions);
    const peopleSkills = getAverage(peopleSkillsQuestions);
    const governance = getAverage(governanceQuestions);

    const overall = (dataContent + technology + peopleSkills + governance) / 4;
    const band = this.classifyGISBand(overall);

    return {
      overall: Math.round(overall),
      band,
      categories: {
        dataContent: Math.round(dataContent),
        technology: Math.round(technology),
        peopleSkills: Math.round(peopleSkills),
        governance: Math.round(governance),
      },
    };
  }

  /**
   * Classify GIS Readiness band based on score
   * Maps to Task 22.4: GIS band classification (Nascent/Emerging/Developing/Advanced)
   */
  classifyGISBand(score: number): ScoreBand {
    if (score >= 80) return 'Advanced';
    if (score >= 60) return 'Developing';
    if (score >= 40) return 'Emerging';
    return 'Nascent';
  }

  /**
   * Compute Infrastructure Readiness Score
   * Maps to Task 24.6: Compute infrastructure readiness sub-score
   */
  computeInfrastructureScore(answers: {
    questionId: string;
    questionLabel: string;
    value: unknown;
  }[]): InfrastructureScoreResult {
    const hardwareLabels = ['hardware', 'device', 'computer', 'cpu', 'ram', 'graphics'];
    const softwareLabels = ['software', 'application', 'program', 'license'];
    const connectivityLabels = ['connectivity', 'network', 'bandwidth', 'internet', 'connection'];
    const backupLabels = ['backup', 'recovery', 'redundancy', 'disaster'];

    const getAverage = (labels: string[]) => {
      const matchingAnswers = answers.filter((a) =>
        labels.some((label) =>
          a.questionLabel.toLowerCase().includes(label),
        ),
      );
      if (matchingAnswers.length === 0) return 0;
      const sum = matchingAnswers.reduce((acc, a) => {
        const val = typeof a.value === 'number' ? a.value : parseFloat(String(a.value)) || 0;
        return acc + val;
      }, 0);
      return sum / matchingAnswers.length;
    };

    const hardware = getAverage(hardwareLabels);
    const software = getAverage(softwareLabels);
    const connectivity = getAverage(connectivityLabels);
    const backup = getAverage(backupLabels);

    const overall = (hardware + software + connectivity + backup) / 4;
    const band = this.classifyGISBand(overall);

    return {
      overall: Math.round(overall),
      band,
      components: {
        hardware: Math.round(hardware),
        software: Math.round(software),
        connectivity: Math.round(connectivity),
        backup: Math.round(backup),
      },
    };
  }

  /**
   * Aggregate GIS scores at department level
   * Maps to Task 22.3: Department-level GIS score aggregation
   */
  async aggregateDepartmentGISScores(evaluationId: string) {
    // Get all responses for this evaluation with department info
    const responses = await this.prisma.response.findMany({
      where: {
        form: { evaluationId },
        status: { in: ['SUBMITTED', 'SYNCED'] },
      },
      include: {
        respondent: {
          select: {
            id: true,
            email: true,
            department: true,
          },
        },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                label: true,
                type: true,
              },
            },
          },
        },
      },
    });

    // Group by department
    const departmentScores: Record<string, GISScoreResult[]> = {};

    for (const response of responses) {
      const department = response.respondent.department || 'Unassigned';
      if (!departmentScores[department]) {
        departmentScores[department] = [];
      }

      // Filter GIS-related answers
      const gisAnswers = response.answers.filter((a) =>
        this.isGISQuestion(a.question.label),
      );

      if (gisAnswers.length > 0) {
        const score = this.computeGISScoreFromAnswers(
          gisAnswers.map((a) => ({
            questionId: a.questionId,
            questionLabel: a.question.label,
            value: a.value,
          })),
        );
        departmentScores[department].push(score);
      }
    }

    // Calculate averages per department
    const departmentAverages: Record<string, GISScoreResult> = {};
    for (const [dept, scores] of Object.entries(departmentScores)) {
      const avgOverall = scores.reduce((sum, s) => sum + s.overall, 0) / scores.length;
      const avgDataContent = scores.reduce((sum, s) => sum + s.categories.dataContent, 0) / scores.length;
      const avgTechnology = scores.reduce((sum, s) => sum + s.categories.technology, 0) / scores.length;
      const avgPeopleSkills = scores.reduce((sum, s) => sum + s.categories.peopleSkills, 0) / scores.length;
      const avgGovernance = scores.reduce((sum, s) => sum + s.categories.governance, 0) / scores.length;

      departmentAverages[dept] = {
        overall: Math.round(avgOverall),
        band: this.classifyGISBand(avgOverall),
        categories: {
          dataContent: Math.round(avgDataContent),
          technology: Math.round(avgTechnology),
          peopleSkills: Math.round(avgPeopleSkills),
          governance: Math.round(avgGovernance),
        },
      };
    }

    return departmentAverages;
  }

  /**
   * Aggregate GIS scores at organisation level
   * Maps to Task 22.3: Organisation-level GIS score aggregation
   */
  async aggregateOrganisationGISScore(evaluationId: string): Promise<GISScoreResult> {
    const departmentScores = await this.aggregateDepartmentGISScores(evaluationId);
    const departments = Object.values(departmentScores);

    if (departments.length === 0) {
      return {
        overall: 0,
        band: 'Nascent',
        categories: { dataContent: 0, technology: 0, peopleSkills: 0, governance: 0 },
      };
    }

    const avgOverall = departments.reduce((sum, s) => sum + s.overall, 0) / departments.length;
    const avgDataContent = departments.reduce((sum, s) => sum + s.categories.dataContent, 0) / departments.length;
    const avgTechnology = departments.reduce((sum, s) => sum + s.categories.technology, 0) / departments.length;
    const avgPeopleSkills = departments.reduce((sum, s) => sum + s.categories.peopleSkills, 0) / departments.length;
    const avgGovernance = departments.reduce((sum, s) => sum + s.categories.governance, 0) / departments.length;

    return {
      overall: Math.round(avgOverall),
      band: this.classifyGISBand(avgOverall),
      categories: {
        dataContent: Math.round(avgDataContent),
        technology: Math.round(avgTechnology),
        peopleSkills: Math.round(avgPeopleSkills),
        governance: Math.round(avgGovernance),
      },
    };
  }

  /**
   * Save GIS score results to database
   */
  async saveGISScores(evaluationId: string) {
    const orgScore = await this.aggregateOrganisationGISScore(evaluationId);
    const deptScores = await this.aggregateDepartmentGISScores(evaluationId);

    // Save organisation-level score
    await this.prisma.scoreResult.create({
      data: {
        evaluationId,
        scope: 'ORGANISATION',
        scopeId: evaluationId,
        scoreType: 'GIS_READINESS',
        score: orgScore.overall,
        band: orgScore.band,
        weightsSnapshot: orgScore.categories as any,
      },
    });

    // Save department-level scores
    for (const [department, score] of Object.entries(deptScores)) {
      await this.prisma.scoreResult.create({
        data: {
          evaluationId,
          scope: 'DEPARTMENT',
          scopeId: department,
          scoreType: 'GIS_READINESS',
          category: department,
          score: score.overall,
          band: score.band,
          weightsSnapshot: score.categories as any,
        },
      });
    }

    return { organisationScore: orgScore, departmentScores: deptScores };
  }

  /**
   * Check if a question label is GIS-related
   */
  private isGISQuestion(label: string): boolean {
    const gisKeywords = [
      'gis', 'spatial', 'geo', 'map', 'mapping',
      'data availability', 'data quality', 'data accessibility', 'data maintenance',
      'software capability', 'hardware adequacy', 'network infrastructure',
      'staff competency', 'training availability',
      'governance framework', 'strategic alignment',
    ];
    return gisKeywords.some((keyword) =>
      label.toLowerCase().includes(keyword),
    );
  }

  /**
   * Compute training needs index per department
   * Maps to Task 25.3: Training needs index computation per department
   */
  async computeTrainingNeedsIndex(evaluationId: string) {
    const responses = await this.prisma.response.findMany({
      where: {
        form: { evaluationId },
        status: { in: ['SUBMITTED', 'SYNCED'] },
      },
      include: {
        respondent: { select: { department: true } },
        answers: {
          include: {
            question: { select: { label: true, type: true } },
          },
        },
      },
    });

    const departmentSkills: Record<string, { total: number; lowSkill: number }> = {};

    for (const response of responses) {
      const department = response.respondent.department || 'Unassigned';
      if (!departmentSkills[department]) {
        departmentSkills[department] = { total: 0, lowSkill: 0 };
      }

      // Filter skill-related answers
      const skillAnswers = response.answers.filter((a) =>
        a.question.label.toLowerCase().includes('skill') ||
        a.question.label.toLowerCase().includes('competency') ||
        a.question.label.toLowerCase().includes('training') ||
        a.question.type === 'rating_scale' ||
        a.question.type === 'likert_scale',
      );

      for (const answer of skillAnswers) {
        departmentSkills[department].total++;
        const val = String(answer.value).toLowerCase();
        if (val === 'none' || val === 'basic' || val === '1' || val === '2') {
          departmentSkills[department].lowSkill++;
        }
      }
    }

    // Calculate training needs index (percentage of low-skill responses)
    const trainingNeedsIndex: Record<string, number> = {};
    for (const [dept, data] of Object.entries(departmentSkills)) {
      trainingNeedsIndex[dept] = data.total > 0
        ? Math.round((data.lowSkill / data.total) * 100)
        : 0;
    }

    return trainingNeedsIndex;
  }

  /**
   * Identify GIS champions (staff with Advanced/Expert GIS skills)
   * Maps to Task 25.2: GIS champion identification
   */
  async identifyGISChampions(evaluationId: string) {
    const responses = await this.prisma.response.findMany({
      where: {
        form: { evaluationId },
        status: { in: ['SUBMITTED', 'SYNCED'] },
      },
      include: {
        respondent: {
          select: {
            id: true,
            email: true,
            name: true,
            department: true,
          },
        },
        answers: {
          include: {
            question: { select: { label: true } },
          },
        },
      },
    });

    const champions: Array<{
      respondentId: string;
      email: string;
      name?: string;
      department?: string;
      gisSkillLevel: string;
      evidence: string[];
    }> = [];

    for (const response of responses) {
      const gisSkillAnswers = response.answers.filter((a) =>
        a.question.label.toLowerCase().includes('gis') &&
        (a.question.label.toLowerCase().includes('skill') ||
         a.question.label.toLowerCase().includes('competency') ||
         a.question.label.toLowerCase().includes('experience')),
      );

      for (const answer of gisSkillAnswers) {
        const val = String(answer.value).toLowerCase();
        if (val === 'advanced' || val === 'expert' || val === '4' || val === '5') {
          champions.push({
            respondentId: response.respondent.id,
            email: response.respondent.email,
            name: response.respondent.name,
            department: response.respondent.department,
            gisSkillLevel: val === 'expert' || val === '5' ? 'Expert' : 'Advanced',
            evidence: [`${answer.question.label}: ${answer.value}`],
          });
        }
      }
    }

    return champions;
  }
}