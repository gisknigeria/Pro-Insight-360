import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  // Backblaze B2 Storage
  B2_KEY_ID: z.string().optional(),
  B2_APPLICATION_KEY: z.string().optional(),
  B2_BUCKET_NAME: z.string().default('pro-insight-360-files'),
  B2_BUCKET_ID: z.string().optional(),
  B2_ENDPOINT: z.string().url().default('https://s3.us-east-005.backblazeb2.com'),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  BREVO_API_KEY: z.string().optional(),
  BREVO_FROM_EMAIL: z.string().email().default('noreply@pro-insight-360.com'),
  BREVO_FROM_NAME: z.string().default('Pro-Insight 360'),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const errors = result.error.issues
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${errors}`);
  }
  return result.data;
}
