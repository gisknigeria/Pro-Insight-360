const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const email = 'test@pro-insight.local';
    const role = 'SUPER_ADMIN';
    const SETUP_TOKEN_EXPIRY_HOURS = 48;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`? User already exists: ${email}`);
      console.log(`  Setup Token: ${existing.setupToken}`);
      console.log(`  Expires At: ${existing.setupTokenExpiresAt}`);
      return;
    }

    const setupToken = crypto.randomBytes(32).toString('hex');
    const setupTokenExpiresAt = new Date(
      Date.now() + SETUP_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    const tempHash = await bcrypt.hash(
      crypto.randomBytes(16).toString('hex'),
      12,
    );

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

    console.log('\n? Test user created successfully!\n');
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`User ID: ${user.id}`);
    console.log(`\nSetup Instructions:`);
    console.log(`1. Go to: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/setup`);
    console.log(`2. Enter setup token: ${user.setupToken}`);
    console.log('3. Set your password');
    console.log(`\nSetup Token Expires: ${user.setupTokenExpiresAt}`);
    console.log('\n---\n');
  } catch (error) {
    console.error('? Error creating test user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
