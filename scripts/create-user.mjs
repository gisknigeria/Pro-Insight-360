#!/usr/bin/env node

/**
 * Create test user - plain JavaScript version
 * Run: node scripts/create-user.mjs
 */

import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../apps/api/.env') });

const prisma = new PrismaClient();

async function main() {
  const email = 'test@pro-insight.local';
  const password = 'TestPassword123!'; // Simple password for testing

  try {
    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`\n✓ User already exists: ${email}`);
      console.log(`  ID: ${existing.id}`);
      console.log(`  Role: ${existing.role}`);
      if (existing.setupToken) {
        console.log(`  Setup Token: ${existing.setupToken}`);
        console.log(`  Expires: ${existing.setupTokenExpiresAt}\n`);
      }
      return;
    }

    // Generate setup token and temp password
    const setupToken = crypto.randomBytes(32).toString('hex');
    const tempHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        role: 'SUPER_ADMIN',
        passwordHash: tempHash,
        setupToken,
        setupTokenExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        isActive: true,
      },
    });

    console.log('\n✅ TEST USER CREATED!\n');
    console.log('━'.repeat(60));
    console.log(`Email:        ${user.email}`);
    console.log(`Role:         ${user.role}`);
    console.log(`User ID:      ${user.id}`);
    console.log('━'.repeat(60));
    console.log('\n📝 SETUP INSTRUCTIONS:\n');
    console.log('1. Go to your frontend app:');
    console.log('   https://pro-insight-360-web.vercel.app/auth/setup\n');
    console.log('2. Paste this setup token:');
    console.log(`   ${user.setupToken}\n`);
    console.log('3. Set a password\n');
    console.log('4. Login with:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: (the one you just created)\n`);
    console.log('━'.repeat(60));
    console.log(`\nToken expires at: ${user.setupTokenExpiresAt}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
