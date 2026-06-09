const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('Resetting database data...');

  await prisma.$executeRawUnsafe(`
    DO $$
    DECLARE
      rec record;
    BEGIN
      FOR rec IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'prisma_migrations' LOOP
        EXECUTE 'TRUNCATE TABLE public.' || quote_ident(rec.tablename) || ' RESTART IDENTITY CASCADE';
      END LOOP;
    END $$;
  `);

  const email = 'admin@gisknig.local';
  const password = 'Password@1234';
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      email,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      passwordHash,
      isActive: true,
    },
  });

  console.log(`Database reset complete.`);
  console.log(`Created Super Admin user:`);
  console.log(`  email: ${email}`);
  console.log(`  password: ${password}`);
  console.log(`  id: ${admin.id}`);
}

main()
  .catch((error) => {
    console.error('Database reset failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
