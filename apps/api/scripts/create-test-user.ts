/**
 * Script to create a test user for development/testing
 * Usage: pnpm ts-node scripts/create-test-user.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaNeon(pool as any);
const prisma = new PrismaClient({ adapter } as any);

async function createTestUser() {
  try {
    const email = 'test@pro-insight.local';
    const role = 'SUPER_ADMIN';
    const SETUP_TOKEN_EXPIRY_HOURS = 48;

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`✓ User already exists: ${email}`);
      console.log(`  Setup Token: ${existing.setupToken}`);
      console.log(`  Expires At: ${existing.setupTokenExpiresAt}`);
      return;
    }

    // Generate setup token
    const setupToken = crypto.randomBytes(32).toString('hex');
    const setupTokenExpiresAt = new Date(
      Date.now() + SETUP_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );
    
    // Create a temporary password hash
    const tempHash = await bcrypt.hash(
      crypto.randomBytes(16).toString('hex'),
      12,
    );

    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        role,
        passwordHash: tempHash,
        setupToken,
        setupTokenExpiresAt,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        setupToken: true,
        setupTokenExpiresAt: true,
      },
    });

    console.log('\n✅ Test user created successfully!\n');
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`User ID: ${user.id}`);
    console.log(`\nSetup Instructions:`);
    console.log(`1. Go to: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/setup`);
    console.log(`2. Enter setup token: ${user.setupToken}`);
    console.log(`3. Set your password`);
    console.log(`\nSetup Token Expires: ${user.setupTokenExpiresAt}`);
    console.log(`\n---\n`);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

createTestUser();
