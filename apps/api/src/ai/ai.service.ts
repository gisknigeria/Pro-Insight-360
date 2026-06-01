import { Injectable, Logger } from '@nestjs/common';
import { AIProvider, AIProviderResponse, EvaluationData, DiagnosisContent } from './ai.types';

/**
 * AI Service with Provider Chain (Gemini → Groq fallback)
 * Task 26.4: Implement provider chain (Gemini → Groq on 429/timeout)
 * Task 26.6: Implement diagnosis parsing and storage
 */

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private providers: AIProvider[] = [];

  registerProvider(provider: AIProvider) {
    this.providers.push(provider);
    this.logger.log(`Registered AI provider: ${provider.name} (${provider.model})`);
  }

  async generateDiagnosis(data: EvaluationData): Promise<{ success: boolean; content?: DiagnosisContent; error?: string }> {
    if (this.providers.length === 0) {
      return { success: false, error: 'No AI providers configured' };
    }

    // Try primary provider first (Gemini), then fallback to secondary (Groq)
    for (const provider of this.providers) {
      try {
        this.logger.log(`Attempting diagnosis generation with ${provider.name}...`);
        const response = await provider.generateDiagnosis(data);

        if (response.success) {
          this.logger.log(`Diagnosis generated successfully by ${provider.name} (${response.duration}ms)`);
          return { success: true, content: response.content };
        }

        // Only fallback on specific errors (rate limit, timeout, unavailable)
        const shouldFallback = 
          response.error?.includes('Rate limit') ||
          response.error?.includes('timeout') ||
          response.error?.includes('not configured') ||
          response.error?.includes('API error: 5');

        if (shouldFallback) {
          this.logger.warn(`${provider.name} failed (${response.error}), trying next provider...`);
          continue;
        }

        // For other errors, don't fallback
        return { success: false, error: response.error };
      } catch (error) {
        this.logger.error(`Provider ${provider.name} threw exception: ${error.message}`);
        continue;
      }
    }

    return { success: false, error: 'All AI providers failed' };
  }

  validateDiagnosisContent(content: unknown): content is DiagnosisContent {
    if (!content || typeof content !== 'object') return false;

    const c = content as Record<string, unknown>;
    const requiredStringFields = ['executiveSummary', 'whoFindings', 'whatFindings', 'howFindings', 'whenFindings'];
    for (const field of requiredStringFields) {
      if (typeof c[field] !== 'string' || !c[field].trim()) return false;
    }

    if (!Array.isArray(c.strengths) || !Array.isArray(c.weaknesses)) return false;
    if (!Array.isArray(c.recommendations) || c.recommendations.length === 0) return false;

    // Validate each recommendation
    for (const rec of c.recommendations) {
      if (!rec || typeof rec !== 'object') return false;
      const r = rec as Record<string, unknown>;
      if (typeof r.title !== 'string' || !r.title.trim()) return false;
      if (typeof r.description !== 'string' || !r.description.trim()) return false;
      if (!['critical', 'high', 'medium', 'low'].includes(r.priority as string)) return false;
      if (!['WHO', 'WHAT', 'HOW', 'WHEN'].includes(r.dimension as string)) return false;
      if (!['low', 'medium', 'high'].includes(r.effort as string)) return false;
      if (typeof r.expectedBenefit !== 'string' || !r.expectedBenefit.trim()) return false;
    }

    return true;
  }
}