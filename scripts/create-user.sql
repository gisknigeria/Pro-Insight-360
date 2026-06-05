-- Create test Super Admin user
-- Run with: pnpm prisma db execute --script create-user.sql

INSERT INTO "User" (
  id, email, "passwordHash", role, "setupToken", "setupTokenExpiresAt", "isActive", 
  "createdAt", "updatedAt", "failedLoginCount"
) VALUES (
  gen_random_uuid(),
  'test@pro-insight.local',
  '$2b$12$test.hash.for.testing.purpose.only', -- dummy hash
  'SUPER_ADMIN',
  'test_token_' || encode(gen_random_bytes(32), 'hex'),
  NOW() + INTERVAL '48 hours',
  true,
  NOW(),
  NOW(),
  0
) ON CONFLICT ("email") DO NOTHING;

-- Return the created user
SELECT id, email, "role", "setupToken", "setupTokenExpiresAt" 
FROM "User" 
WHERE email = 'test@pro-insight.local'
LIMIT 1;
