import { Module, OnModuleInit } from '@nestjs/common';
import { AIService } from './ai.service';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * AI Module
 * Task 26: AI diagnosis engine
 */

@Module({
  imports: [PrismaModule],
  providers: [AIService, GeminiProvider, GroqProvider],
  exports: [AIService],
})
export class AIModule implements OnModuleInit {
  constructor(
    private aiService: AIService,
    private geminiProvider: GeminiProvider,
    private groqProvider: GroqProvider,
  ) {}

  async onModuleInit() {
    // Register providers in order: Gemini (primary), Groq (fallback)
    if (await this.geminiProvider.isAvailable()) {
      this.aiService.registerProvider(this.geminiProvider);
    }
    if (await this.groqProvider.isAvailable()) {
      this.aiService.registerProvider(this.groqProvider);
    }
  }
}