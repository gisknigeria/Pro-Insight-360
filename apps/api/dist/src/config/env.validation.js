"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = validateEnv;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    DATABASE_URL: zod_1.z.string().url(),
    JWT_SECRET: zod_1.z.string().min(16),
    JWT_EXPIRES_IN: zod_1.z.string().default('24h'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(16),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    UPSTASH_REDIS_REST_URL: zod_1.z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: zod_1.z.string().optional(),
    B2_KEY_ID: zod_1.z.string().optional(),
    B2_APPLICATION_KEY: zod_1.z.string().optional(),
    B2_BUCKET_NAME: zod_1.z.string().default('pro-insight-360-files'),
    B2_BUCKET_ID: zod_1.z.string().optional(),
    B2_ENDPOINT: zod_1.z.string().url().default('https://s3.us-east-005.backblazeb2.com'),
    GEMINI_API_KEY: zod_1.z.string().optional(),
    GROQ_API_KEY: zod_1.z.string().optional(),
    BREVO_API_KEY: zod_1.z.string().optional(),
    BREVO_FROM_EMAIL: zod_1.z.string().email().default('noreply@pro-insight-360.com'),
    BREVO_FROM_NAME: zod_1.z.string().default('Pro-Insight 360'),
    PORT: zod_1.z.coerce.number().default(3001),
    NODE_ENV: zod_1.z
        .enum(['development', 'production', 'test'])
        .default('development'),
    FRONTEND_URL: zod_1.z.string().url().default('http://localhost:3000'),
});
function validateEnv(config) {
    const result = envSchema.safeParse(config);
    if (!result.success) {
        const errors = result.error.issues
            .map((e) => `${e.path.join('.')}: ${e.message}`)
            .join('\n');
        throw new Error(`Environment validation failed:\n${errors}`);
    }
    return result.data;
}
//# sourceMappingURL=env.validation.js.map