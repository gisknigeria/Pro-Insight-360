import { DiagnosisPromptTemplate, EvaluationData } from './ai.types';

/**
 * Structured prompt templates for AI diagnosis generation
 * Task 26.5: Implement structured prompt templates for diagnosis generation
 */

export const DIAGNOSIS_SYSTEM_PROMPT = `You are an expert digital transformation consultant specializing in GIS (Geographic Information Systems) readiness assessments. Your role is to analyze evaluation data and provide comprehensive, actionable diagnoses.

Guidelines:
1. Be objective and evidence-based - base all findings on the provided data
2. Be specific - avoid generic statements, reference actual scores and patterns
3. Be constructive - frame weaknesses as opportunities for improvement
4. Be practical - recommendations should be actionable with clear benefits
5. Consider the organisational context (sector, size, current maturity level)
6. Use professional but accessible language - avoid unnecessary jargon

The diagnosis must include all required sections:
- Executive Summary: High-level overview suitable for senior management
- WHO Findings: Analysis of people, skills, and organisational capacity
- WHAT Findings: Analysis of technology, data, and infrastructure
- HOW Findings: Analysis of processes, workflows, and governance
- WHEN Findings: Analysis of timelines, planning, and change management
- Strengths: Areas where the organisation excels
- Weaknesses: Areas requiring improvement
- Recommendations: Prioritized, actionable recommendations with expected benefits`;

export const DIAGNOSIS_USER_PROMPT_TEMPLATE = `Analyse the following evaluation data for "{title}" ({organisationName}) and generate a comprehensive diagnosis.

ORGANISATIONAL CONTEXT:
- Organisation: {organisationName}
- Sector: {sector}
- Evaluation: {title}

DIGITAL READINESS SCORES:
- Overall Digital Readiness: {digitalReadiness}/100
- GIS Readiness: {gisReadiness}/100
- Category Scores: {categories}

KEY PATTERNS FROM RESPONSES:
{responsesSummary}

IDENTIFIED CONFLICTS (responses with significant disagreement):
{conflictsSummary}

IDENTIFIED GAPS (areas with significant shortfalls):
{gapsSummary}

Generate a structured diagnosis in JSON format with the following structure:
{
  "executiveSummary": "string",
  "whoFindings": "string", 
  "whatFindings": "string",
  "howFindings": "string",
  "whenFindings": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommendations": [
    {
      "title": "string",
      "description": "string",
      "priority": "critical|high|medium|low",
      "dimension": "WHO|WHAT|HOW|WHEN",
      "effort": "low|medium|high",
      "expectedBenefit": "string"
    }
  ]
}`;

export function buildDiagnosisPrompt(
  evaluationData: EvaluationData,
): { systemPrompt: string; userPrompt: string } {
  const responsesSummary = buildResponsesSummary(evaluationData.responses);
  const conflictsSummary = buildConflictsSummary(evaluationData.conflicts);
  const gapsSummary = buildGapsSummary(evaluationData.gaps);

  const userPrompt = DIAGNOSIS_USER_PROMPT_TEMPLATE
    .replace('{title}', evaluationData.title)
    .replace('{organisationName}', evaluationData.organisationName)
    .replace('{sector}', evaluationData.sector || 'Not specified')
    .replace('{digitalReadiness}', evaluationData.scores.digitalReadiness.toString())
    .replace('{gisReadiness}', evaluationData.scores.gisReadiness.toString())
    .replace('{categories}', JSON.stringify(evaluationData.scores.categories, null, 2))
    .replace('{responsesSummary}', responsesSummary)
    .replace('{conflictsSummary}', conflictsSummary)
    .replace('{gapsSummary}', gapsSummary);

  return {
    systemPrompt: DIAGNOSIS_SYSTEM_PROMPT,
    userPrompt,
  };
}

function buildResponsesSummary(
  responses: EvaluationData['responses'],
): string {
  if (responses.length === 0) return 'No response data available.';

  // Group by question type and provide summary statistics
  const summary = responses
    .slice(0, 20) // Limit to top 20 for token efficiency
    .map((r) => `- ${r.questionLabel}: ${formatValue(r.value)}${r.respondentDepartment ? ` (${r.respondentDepartment})` : ''}`)
    .join('\n');

  return summary + (responses.length > 20 ? `\n... and ${responses.length - 20} more responses` : '');
}

function buildConflictsSummary(
  conflicts: EvaluationData['conflicts'],
): string {
  if (conflicts.length === 0) return 'No significant conflicts identified.';

  return conflicts
    .map((c) => `- ${c.questionLabel}: Conflicting responses detected (${c.type})`)
    .join('\n');
}

function buildGapsSummary(
  gaps: EvaluationData['gaps'],
): string {
  if (gaps.length === 0) return 'No significant gaps identified.';

  return gaps
    .map((g) => `- [${g.severity.toUpperCase()}] ${g.category}: ${g.description}`)
    .join('\n');
}

function formatValue(value: unknown): string {
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

export const DIAGNOSIS_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    executiveSummary: { type: 'string' },
    whoFindings: { type: 'string' },
    whatFindings: { type: 'string' },
    howFindings: { type: 'string' },
    whenFindings: { type: 'string' },
    strengths: {
      type: 'array',
      items: { type: 'string' },
    },
    weaknesses: {
      type: 'array',
      items: { type: 'string' },
    },
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          dimension: { type: 'string', enum: ['WHO', 'WHAT', 'HOW', 'WHEN'] },
          effort: { type: 'string', enum: ['low', 'medium', 'high'] },
          expectedBenefit: { type: 'string' },
        },
        required: ['title', 'description', 'priority', 'dimension', 'effort', 'expectedBenefit'],
      },
    },
  },
  required: [
    'executiveSummary',
    'whoFindings',
    'whatFindings',
    'howFindings',
    'whenFindings',
    'strengths',
    'weaknesses',
    'recommendations',
  ],
};