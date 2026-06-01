import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from the api directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  schema: path.resolve(__dirname, 'prisma/schema.prisma'),
  datasource: {
    // Use direct URL for migrations (not the pooler URL)
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL!,
  },
});
