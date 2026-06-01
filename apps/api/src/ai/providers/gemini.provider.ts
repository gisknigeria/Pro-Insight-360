import { Injectable, Logger } from '@nestjs/common';
import { AIProvider, AIProviderResponse, EvaluationData } from '../ai.types';
import { buildDiagnosisPrompt, DIAGNOSIS_RESPONSE_SCHEMA } from '../prompt-templates';

/**
 * Google Gemini Flash AI Provider
 * Task 26.2: Implement Google Gemini Flash provider (gemini-1.5-flash via Google AI SDK)
 */

@Injectable()
export class GeminiProvider implements AIProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  readonly name = 'gemini' as const;
  readonly model = 'gemini-1.5-flash';
  private apiKey: string;
  private apiUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey && this.apiKey !== 'your-gemini-api-key';
  }

  async generateDiagnosis(data: EvaluationData): Promise<AIProviderResponse> {
    const startTime = Date.now();

    if (!await this.isAvailable()) {
      return {
        success: false,
        error: 'Gemini API key not configured',
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
        this.logger.error(`Gemini API error: ${response.status} - ${errorText}`);
        
        // Handle rate limiting
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
          error: 'Empty response from Gemini',
          provider: this.name,
          model: this.model,
          duration: Date.now() - startTime,
        };
      }

      // Parse and validate the response
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
      this.logger.error(`Gemini provider error: ${error.message}`);
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
      
      // Validate required fields
      const requiredFields = ['executiveSummary', 'whoFindings', 'whatFindings', 'howFindings', 'whenFindings', 'strengths', 'weaknesses', 'recommendations'];
      for (const field of requiredFields) {
        if (!parsed[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate recommendations structure
      if (!Array.isArray(parsed.recommendations)) {
        throw new Error('Recommendations must be an array');
      }

      return parsed;
    } catch (error) {
      this.logger.error(`Failed to parse Gemini response: ${error.message}`);
      throw new Error('Invalid response format from AI provider');
    }
  }
}