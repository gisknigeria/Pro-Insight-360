require('dotenv').config({ path: './.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

(async () => {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email: 'admin2@giskonsult.com' } });
    console.log(user ? `FOUND ${user.email}` : 'USER NOT FOUND');
    if (user) {
      console.log('is_active', user.isActive, 'failed', user.failedLoginCount, 'locked_until', user.lockedUntil);
      console.log('hash prefix', user.passwordHash.slice(0, 8));
      console.log('bcrypt compare ->', await bcrypt.compare('NewStrongPassword123!', user.passwordHash));
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();