/**
 * Database seed script — run after migration to populate default data.
 * Usage: node prisma/seed.js (after compiling) or via ts-node
 *
 * IMPORTANT: This seed requires a Super Admin user to exist first.
 * Create the Super Admin via the API, then run this seed with their ID.
 *
 * Set SEED_SUPER_ADMIN_ID env var before running:
 *   SEED_SUPER_ADMIN_ID=<uuid> npx ts-node prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

// 14 Digital Readiness categories — equal weights summing to 1.0
const DIGITAL_READINESS_CATEGORIES = [
  'Leadership & Strategy',
  'IT Infrastructure',
  'Cybersecurity',
  'Data Management',
  'Digital Skills',
  'Process Automation',
  'Customer Experience',
  'Innovation Culture',
  'Connectivity',
  'Software Adoption',
  'Change Management',
  'Budget & Investment',
  'Compliance & Governance',
  'Collaboration Tools',
];

async function main() {
  const superAdminId = process.env.SEED_SUPER_ADMIN_ID;
  if (!superAdminId) {
    throw new Error(
      'SEED_SUPER_ADMIN_ID environment variable is required.\n' +
        'Create a Super Admin user first, then run:\n' +
        '  SEED_SUPER_ADMIN_ID=<uuid> npx ts-node prisma/seed.ts',
    );
  }

  // Verify the super admin exists
  const admin = await prisma.user.findUnique({ where: { id: superAdminId } });
  if (!admin) {
    throw new Error(`No user found with ID: ${superAdminId}`);
  }

  console.log(`Seeding scoring weights for Super Admin: ${admin.email}`);

  const equalWeight = parseFloat((1 / DIGITAL_READINESS_CATEGORIES.length).toFixed(4));

  for (const category of DIGITAL_READINESS_CATEGORIES) {
    await prisma.scoringWeight.upsert({
      where: { category },
      update: { weight: equalWeight, updatedById: superAdminId },
      create: { category, weight: equalWeight, updatedById: superAdminId },
    });
    console.log(`  ✓ ${category}: ${equalWeight}`);
  }

  console.log('\nSeed complete. 14 scoring weights created with equal weights.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
