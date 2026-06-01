import { Injectable, Logger } from '@nestjs/common';
import { AIProvider, AIProviderResponse, EvaluationData } from '../ai.types';
import { buildDiagnosisPrompt } from '../prompt-templates';

/**
 * Groq AI Provider (Fallback)
 * Task 26.3: Implement Groq fallback provider (llama-3.1-70b-versatile via Groq SDK)
 */

@Injectable()
export class GroqProvider implements AIProvider {
  private readonly logger = new Logger(GroqProvider.name);
  readonly name = 'groq' as const;
  readonly model = 'llama-3.1-70b-versatile';
  private apiKey: string;
  private apiUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey && this.apiKey !== 'your-groq-api-key';
  }

  async generateDiagnosis(data: EvaluationData): Promise<AIProviderResponse> {
    const startTime = Date.now();

    if (!await this.isAvailable()) {
      return {
        success: false,
        error: 'Groq API key not configured',
        provider: this.name,
        model: this.model,
        duration: Date.now() - startTime,
      };
    }

    try {
      const { systemPrompt, userPrompt } = buildDiagnosisPrompt(data);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 4096,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Groq API error: ${response.status} - ${errorText}`);

        if (response.status === 429) {
          return {
            success: false,
            error: 'Rate limit exceeded',
            provider: this.name,
            model: this.model,
            duration: Date.now() - startTime,
          };
        }

        return {
          success: false,
          error: `API error: ${response.status}`,
          provider: this.name,
          model: this.model,
          duration: Date.now() - startTime,
        };
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;

      if (!content) {
        return {
          success: false,
          error: 'Empty response from Groq',
          provider: this.name,
          model: this.model,
          duration: Date.now() - startTime,
        };
      }

      const diagnosisContent = this.parseDiagnosisResponse(content);

      return {
        success: true,
        content: diagnosisContent,
        provider: this.name,
        model: this.model,
        tokensUsed: result.usage?.total_tokens,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error(`Groq provider error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        provider: this.name,
        model: this.model,
        duration: Date.now() - startTime,
      };
    }
  }

  private parseDiagnosisResponse(content: string) {
    try {
      const parsed = JSON.parse(content);

      const requiredFields = ['executiveSummary', 'whoFindings', 'whatFindings', 'howFindings', 'whenFindings', 'strengths', 'weaknesses', 'recommendations'];
      for (const field of requiredFields) {
        if (!parsed[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      if (!Array.isArray(parsed.recommendations)) {
        throw new Error('Recommendations must be an array');
      }

      return parsed;
    } catch (error) {
      this.logger.error(`Failed to parse Groq response: ${error.message}`);
      throw new Error('Invalid response format from AI provider');
    }
  }
}