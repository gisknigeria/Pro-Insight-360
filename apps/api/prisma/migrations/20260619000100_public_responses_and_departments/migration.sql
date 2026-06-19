-- Separate real platform users from public form respondents and units/departments.

CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "organisation_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "lead_name" VARCHAR(255),
    "lead_email" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "departments_organisation_id_name_key" ON "departments"("organisation_id", "name");

ALTER TABLE "departments" ADD CONSTRAINT "departments_organisation_id_fkey"
FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "departments" ("id", "organisation_id", "name", "lead_name", "lead_email", "created_at")
SELECT
    gen_random_uuid()::text,
    "organisation_id",
    TRIM("department"),
    MAX(CASE WHEN "role" = 'HOD' THEN COALESCE("name", "email") END),
    MAX(CASE WHEN "role" = 'HOD' THEN "email" END),
    MIN("created_at")
FROM "users"
WHERE "organisation_id" IS NOT NULL
  AND "department" IS NOT NULL
  AND TRIM("department") <> ''
GROUP BY "organisation_id", TRIM("department")
ON CONFLICT ("organisation_id", "name") DO NOTHING;

ALTER TABLE "responses" ADD COLUMN "respondent_name" VARCHAR(255);
ALTER TABLE "responses" ADD COLUMN "respondent_email" VARCHAR(255);

UPDATE "responses"
SET
  "respondent_name" = COALESCE("users"."name", "users"."email"),
  "respondent_email" = "users"."email"
FROM "users"
WHERE "responses"."respondent_id" = "users"."id"
  AND "users"."email" = COALESCE(current_setting('app.public_respondent_email', true), 'anonymous@public.local');

ALTER TABLE "responses" DROP CONSTRAINT IF EXISTS "responses_respondent_id_fkey";
ALTER TABLE "responses" ALTER COLUMN "respondent_id" DROP NOT NULL;
ALTER TABLE "responses" ADD CONSTRAINT "responses_respondent_id_fkey"
FOREIGN KEY ("respondent_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

UPDATE "responses"
SET "respondent_id" = NULL
WHERE "respondent_email" = COALESCE(current_setting('app.public_respondent_email', true), 'anonymous@public.local');

DELETE FROM "users"
WHERE "email" = COALESCE(current_setting('app.public_respondent_email', true), 'anonymous@public.local');
