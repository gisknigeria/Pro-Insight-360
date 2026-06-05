const dotenv = require('dotenv');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

dotenv.config({ path: path.resolve(__dirname, '.env') });
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'test@pro-insight.local';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`? User already exists: ${email}`);
    console.log(`ID: ${existing.id}`);
    console.log(`Role: ${existing.role}`);
    console.log(`Setup Token: ${existing.setupToken}`);
    console.log(`Setup Token Expires: ${existing.setupTokenExpiresAt}`);
    return;
  }

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

  console.log('? Test user created!');
  console.log(`Email: ${user.email}`);
  console.log(`Role: ${user.role}`);
  console.log(`ID: ${user.id}`);
  console.log(`Setup Token: ${user.setupToken}`);
  console.log(`Setup Token Expires: ${user.setupTokenExpiresAt}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
