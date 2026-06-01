-- Pro-Insight 360 — Initial Database Migration
-- Run this in the Neon SQL Editor: https://console.neon.tech → your project → SQL Editor

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'CONSULTANT', 'CLIENT_ADMIN', 'HOD', 'RESPONDENT');
CREATE TYPE "EvaluationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED');
CREATE TYPE "FormStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');
CREATE TYPE "ResponseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'SYNCED', 'QUARANTINED');
CREATE TYPE "DiagnosisStatus" AS ENUM ('PENDING_REVIEW', 'IN_REVIEW', 'APPROVED', 'REJECTED');
CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'DOCX', 'XLSX');
CREATE TYPE "ConflictType" AS ENUM ('NUMERIC_VARIANCE', 'CONTRADICTORY_CHOICE');
CREATE TYPE "ScoreScope" AS ENUM ('ORGANISATION', 'DEPARTMENT', 'RESPONDENT');
CREATE TYPE "ScoreType" AS ENUM ('DIGITAL_READINESS', 'GIS_READINESS', 'DIMENSION', 'CATEGORY', 'INFRASTRUCTURE');
CREATE TYPE "OrganogramRenderStatus" AS ENUM ('PENDING', 'RENDERED', 'ERROR');
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SYNCING', 'SYNCED', 'ERROR');

-- ─── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE "organisations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "sector" VARCHAR(100),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "archived_at" TIMESTAMPTZ
);

CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organisation_id" UUID REFERENCES "organisations"("id"),
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "mfa_enabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "mfa_secret" TEXT,
  "failed_login_count" SMALLINT NOT NULL DEFAULT 0,
  "locked_until" TIMESTAMPTZ,
  "setup_token" VARCHAR(255),
  "setup_token_expires_at" TIMESTAMPTZ,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "evaluations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organisation_id" UUID NOT NULL REFERENCES "organisations"("id"),
  "title" VARCHAR(255) NOT NULL,
  "status" "EvaluationStatus" NOT NULL DEFAULT 'DRAFT',
  "start_date" DATE,
  "end_date" DATE,
  "created_by" UUID NOT NULL REFERENCES "users"("id"),
  "archived_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "evaluation_consultants" (
  "evaluation_id" UUID NOT NULL REFERENCES "evaluations"("id") ON DELETE CASCADE,
  "consultant_id" UUID NOT NULL REFERENCES "users"("id"),
  "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("evaluation_id", "consultant_id")
);

CREATE TABLE "templates" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "sector" VARCHAR(100),
  "evaluation_type" VARCHAR(100),
  "version" INTEGER NOT NULL DEFAULT 1,
  "definition" JSONB NOT NULL,
  "is_published" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_by" UUID NOT NULL REFERENCES "users"("id"),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "template_versions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "template_id" UUID NOT NULL REFERENCES "templates"("id") ON DELETE CASCADE,
  "version" INTEGER NOT NULL,
  "definition" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "forms" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "evaluation_id" UUID NOT NULL REFERENCES "evaluations"("id") ON DELETE CASCADE,
  "template_id" UUID REFERENCES "templates"("id"),
  "template_version" INTEGER,
  "title" VARCHAR(255) NOT NULL,
  "definition" JSONB NOT NULL,
  "status" "FormStatus" NOT NULL DEFAULT 'DRAFT',
  "response_deadline" TIMESTAMPTZ,
  "created_by" UUID NOT NULL REFERENCES "users"("id"),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "questions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "form_id" UUID NOT NULL REFERENCES "forms"("id") ON DELETE CASCADE,
  "external_id" VARCHAR(100) NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "label" TEXT NOT NULL,
  "config" JSONB NOT NULL DEFAULT '{}',
  "is_required" BOOLEAN NOT NULL DEFAULT FALSE,
  "position" INTEGER NOT NULL,
  "dimensions" TEXT[] NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "conditional_logic" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "question_id" UUID NOT NULL REFERENCES "questions"("id") ON DELETE CASCADE,
  "condition" JSONB NOT NULL,
  "action" VARCHAR(20) NOT NULL
);

CREATE TABLE "form_assignments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "form_id" UUID NOT NULL REFERENCES "forms"("id") ON DELETE CASCADE,
  "respondent_id" UUID NOT NULL REFERENCES "users"("id"),
  "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "notified_at" TIMESTAMPTZ,
  UNIQUE ("form_id", "respondent_id")
);

CREATE TABLE "responses" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "form_id" UUID NOT NULL REFERENCES "forms"("id") ON DELETE CASCADE,
  "respondent_id" UUID NOT NULL REFERENCES "users"("id"),
  "status" "ResponseStatus" NOT NULL DEFAULT 'DRAFT',
  "submitted_at" TIMESTAMPTZ,
  "synced_at" TIMESTAMPTZ,
  "raw_cache_json" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "answers" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "response_id" UUID NOT NULL REFERENCES "responses"("id") ON DELETE CASCADE,
  "question_id" UUID NOT NULL REFERENCES "questions"("id"),
  "value" JSONB NOT NULL,
  "answered_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "conflicts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "evaluation_id" UUID NOT NULL REFERENCES "evaluations"("id") ON DELETE CASCADE,
  "question_id" UUID NOT NULL REFERENCES "questions"("id"),
  "conflict_type" "ConflictType" NOT NULL,
  "conflicting_values" JSONB NOT NULL,
  "is_resolved" BOOLEAN NOT NULL DEFAULT FALSE,
  "resolution_note" TEXT,
  "resolved_by" UUID REFERENCES "users"("id"),
  "resolved_at" TIMESTAMPTZ
);

CREATE TABLE "score_results" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "evaluation_id" UUID NOT NULL REFERENCES "evaluations"("id") ON DELETE CASCADE,
  "scope" "ScoreScope" NOT NULL,
  "scope_id" UUID NOT NULL,
  "score_type" "ScoreType" NOT NULL,
  "category" VARCHAR(100),
  "score" DECIMAL(5,2) NOT NULL,
  "band" VARCHAR(50),
  "computed_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "weights_snapshot" JSONB
);

CREATE TABLE "diagnoses" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "evaluation_id" UUID NOT NULL REFERENCES "evaluations"("id") ON DELETE CASCADE,
  "version" INTEGER NOT NULL DEFAULT 1,
  "content" JSONB NOT NULL,
  "status" "DiagnosisStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "is_ai_generated" BOOLEAN NOT NULL DEFAULT TRUE,
  "generated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "reviewed_by" UUID REFERENCES "users"("id"),
  "reviewed_at" TIMESTAMPTZ,
  "edits_made" BOOLEAN NOT NULL DEFAULT FALSE,
  "rejection_reason" TEXT
);

CREATE TABLE "diagnosis_versions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "diagnosis_id" UUID NOT NULL REFERENCES "diagnoses"("id") ON DELETE CASCADE,
  "version" INTEGER NOT NULL,
  "content" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "recommendations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "diagnosis_id" UUID NOT NULL REFERENCES "diagnoses"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT NOT NULL,
  "priority" VARCHAR(20) NOT NULL,
  "dimension" VARCHAR(20),
  "effort" VARCHAR(20),
  "expected_benefit" TEXT,
  "timeline" VARCHAR(255),
  "position" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "reports" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "evaluation_id" UUID NOT NULL REFERENCES "evaluations"("id") ON DELETE CASCADE,
  "version" INTEGER NOT NULL DEFAULT 1,
  "format" "ReportFormat" NOT NULL,
  "included_sections" JSONB NOT NULL,
  "storage_key" VARCHAR(500),
  "generated_by" UUID NOT NULL REFERENCES "users"("id"),
  "generated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "file_size_bytes" BIGINT
);

CREATE TABLE "shared_links" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "report_id" UUID NOT NULL REFERENCES "reports"("id") ON DELETE CASCADE,
  "token" VARCHAR(255) NOT NULL UNIQUE,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "revoked_at" TIMESTAMPTZ,
  "created_by" UUID NOT NULL REFERENCES "users"("id")
);

CREATE TABLE "organograms" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "evaluation_id" UUID NOT NULL REFERENCES "evaluations"("id") ON DELETE CASCADE,
  "raw_data" JSONB NOT NULL,
  "render_status" "OrganogramRenderStatus" NOT NULL DEFAULT 'PENDING',
  "error_detail" TEXT,
  "storage_key" VARCHAR(500),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "workflow_maps" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "evaluation_id" UUID NOT NULL REFERENCES "evaluations"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "bpmn_xml" TEXT,
  "nodes" JSONB NOT NULL DEFAULT '[]',
  "edges" JSONB NOT NULL DEFAULT '[]',
  "inefficient_nodes" TEXT[] NOT NULL DEFAULT '{}',
  "storage_key" VARCHAR(500),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "documents" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "evaluation_id" UUID NOT NULL REFERENCES "evaluations"("id") ON DELETE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "mime_type" VARCHAR(100) NOT NULL,
  "storage_key" VARCHAR(500) NOT NULL,
  "file_size_bytes" BIGINT NOT NULL,
  "uploaded_by" UUID NOT NULL REFERENCES "users"("id"),
  "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID REFERENCES "users"("id"),
  "action" VARCHAR(100) NOT NULL,
  "resource_type" VARCHAR(100),
  "resource_id" UUID,
  "metadata" JSONB,
  "ip_address" VARCHAR(45),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "scoring_weights" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "category" VARCHAR(100) NOT NULL UNIQUE,
  "weight" DECIMAL(5,4) NOT NULL,
  "updated_by" UUID NOT NULL REFERENCES "users"("id"),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX "idx_users_email" ON "users"("email");
CREATE INDEX "idx_users_organisation" ON "users"("organisation_id");
CREATE INDEX "idx_evaluations_organisation" ON "evaluations"("organisation_id");
CREATE INDEX "idx_evaluations_status" ON "evaluations"("status");
CREATE INDEX "idx_forms_evaluation" ON "forms"("evaluation_id");
CREATE INDEX "idx_questions_form" ON "questions"("form_id");
CREATE INDEX "idx_responses_form" ON "responses"("form_id");
CREATE INDEX "idx_responses_respondent" ON "responses"("respondent_id");
CREATE INDEX "idx_answers_response" ON "answers"("response_id");
CREATE INDEX "idx_conflicts_evaluation" ON "conflicts"("evaluation_id");
CREATE INDEX "idx_score_results_evaluation" ON "score_results"("evaluation_id");
CREATE INDEX "idx_diagnoses_evaluation" ON "diagnoses"("evaluation_id");
CREATE INDEX "idx_audit_logs_user" ON "audit_logs"("user_id");
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("created_at");

-- ─── Seed: Default Scoring Weights ───────────────────────────────────────────
-- Note: updated_by requires a real user ID — run this after creating the first Super Admin
-- INSERT INTO "scoring_weights" ("category", "weight", "updated_by") VALUES
--   ('Leadership & Strategy', 0.0714, '<super-admin-id>'),
--   ('IT Infrastructure', 0.0714, '<super-admin-id>'),
--   ('Cybersecurity', 0.0714, '<super-admin-id>'),
--   ('Data Management', 0.0714, '<super-admin-id>'),
--   ('Digital Skills', 0.0714, '<super-admin-id>'),
--   ('Process Automation', 0.0714, '<super-admin-id>'),
--   ('Customer Experience', 0.0714, '<super-admin-id>'),
--   ('Innovation Culture', 0.0714, '<super-admin-id>'),
--   ('Connectivity', 0.0714, '<super-admin-id>'),
--   ('Software Adoption', 0.0714, '<super-admin-id>'),
--   ('Change Management', 0.0714, '<super-admin-id>'),
--   ('Budget & Investment', 0.0714, '<super-admin-id>'),
--   ('Compliance & Governance', 0.0714, '<super-admin-id>'),
--   ('Collaboration Tools', 0.0714, '<super-admin-id>');
