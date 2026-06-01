/**
 * AI Provider Types and Interfaces
 * Phase 6: AI and Reporting - Task 26
 */

export type AIProviderName = 'gemini' | 'groq';

export interface DiagnosisContent {
  executiveSummary: string;
  whoFindings: string;
  whatFindings: string;
  howFindings: string;
  whenFindings: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: GeneratedRecommendation[];
}

export interface GeneratedRecommendation {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  dimension: 'WHO' | 'WHAT' | 'HOW' | 'WHEN';
  effort: 'low' | 'medium' | 'high';
  expectedBenefit: string;
}

export interface AIProviderResponse {
  success: boolean;
  content?: DiagnosisContent;
  error?: string;
  provider: AIProviderName;
  model: string;
  tokensUsed?: number;
  duration: number;
}

export interface EvaluationData {
  evaluationId: string;
  title: string;
  organisationName: string;
  sector?: string;
  responses: {
    questionLabel: string;
    questionType: string;
    value: unknown;
    respondentDepartment?: string;
  }[];
  scores: {
    digitalReadiness: number;
    gisReadiness: number;
    categories: Record<string, number>;
  };
  conflicts: {
    questionLabel: string;
    conflictingValues: unknown[];
    type: string;
  }[];
  gaps: {
    category: string;
    description: string;
    severity: string;
  }[];
}

/**
 * AI Provider Interface
 * All AI providers must implement this interface
 */
export interface AIProvider {
  readonly name: AIProviderName;
  readonly model: string;
  
  /**
   * Generate a diagnosis from evaluation data
   */
  generateDiagnosis(data: EvaluationData): Promise<AIProviderResponse>;
  
  /**
   * Check if the provider is available
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Structured prompt template for diagnosis generation
 */
export interface DiagnosisPromptTemplate {
  systemPrompt: string;
  userPromptTemplate: string;
  responseSchema: object;
}