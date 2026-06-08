const path = require('path');
const crypto = require('crypto');
const apiRoot = path.join(__dirname, '..', 'apps', 'api');
const bcrypt = require(require.resolve('bcrypt', { paths: [apiRoot] }));
const dotenv = require(require.resolve('dotenv', { paths: [apiRoot] }));
const { PrismaClient } = require(require.resolve('@prisma/client', { paths: [apiRoot] }));

dotenv.config({ path: path.join(apiRoot, '.env') });
dotenv.config({ path: path.join(apiRoot, '.env.local') });

const prisma = new PrismaClient();

async function createTestUser() {
  const email = 'test@pro-insight.local';

  try {
    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const hasValidToken = user.setupToken && user.setupTokenExpiresAt && new Date(user.setupTokenExpiresAt) > new Date();
      if (hasValidToken) {
        console.log(`\n✓ User already exists: ${email}`);
        console.log(`  Setup Token: ${user.setupToken}`);
        console.log(`  Expires: ${user.setupTokenExpiresAt}\n`);
        return;
      }

      const setupToken = crypto.randomBytes(32).toString('hex');
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          setupToken,
          setupTokenExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
          isActive: true,
        },
      });

      console.log(`\n✓ Refreshed setup token for: ${email}`);
      console.log(`  Setup Token: ${user.setupToken}`);
      console.log(`  Expires: ${user.setupTokenExpiresAt}\n`);
      return;
    }

    const setupToken = crypto.randomBytes(32).toString('hex');
    const tempHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);

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
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
