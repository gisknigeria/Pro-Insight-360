import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from the api directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export default defineConfig({
  schema: path.resolve(__dirname, 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
