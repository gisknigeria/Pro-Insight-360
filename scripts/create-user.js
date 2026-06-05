const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestUser() {
  const email = 'test@pro-insight.local';
  const setupToken = crypto.randomBytes(32).toString('hex');
  
  try {
    // Check if exists
    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      console.log(`\n✓ User already exists: ${email}`);
      console.log(`  Setup Token: ${user.setupToken}`);
      console.log(`  Expires: ${user.setupTokenExpiresAt}\n`);
      process.exit(0);
    }

    // Hash temp password
    const tempHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);

    // Create user
    user = await prisma.user.create({
      data: {
        email,
        role: 'SUPER_ADMIN',
        passwordHash: tempHash,
        setupToken,
        setupTokenExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        isActive: true,
      },
    });

    console.log('\n' + '='.repeat(70));
    console.log('✅ TEST USER CREATED!');
    console.log('='.repeat(70));
    console.log(`\nEmail:        ${user.email}`);
    console.log(`Role:         ${user.role}`);
    console.log(`User ID:      ${user.id}`);
    console.log(`\n📝 SETUP TOKEN (valid for 48 hours):`);
    console.log(`${user.setupToken}`);
    console.log(`\n🔗 Next Steps:`);
    console.log(`1. Go to: https://pro-insight-360-web.vercel.app/auth/setup`);
    console.log(`2. Paste the token above`);
    console.log(`3. Create your password`);
    console.log(`4. Login with ${email} + your password`);
    console.log('\n' + '='.repeat(70) + '\n');


import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createUser() {
  const email = 'test@pro-insight.local';
  
  // Check if exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`✓ User exists: ${email}`);
    console.log(`  Setup Token: ${existing.setupToken}`);
    console.log(`  Token Expires: ${existing.setupTokenExpiresAt}`);
    process.exit(0);
  }

  // Create user
  const setupToken = crypto.randomBytes(32).toString('hex');
  const tempHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);

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

  console.log('\n✅ Test User Created!\n');
  console.log(`Email: ${user.email}`);
  console.log(`Role: ${user.role}`);
  console.log(`Setup Token: ${user.setupToken}`);
  console.log(`\n📝 Next Steps:`);
  console.log(`1. Open: https://pro-insight-360-web.vercel.app/auth/setup`);
  console.log(`2. Paste token: ${user.setupToken}`);
  console.log(`3. Create a password`);
  console.log(`4. Login with ${email} and your password\n`);

  process.exit(0);
}

createUser().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
