-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'CONSULTANT', 'CLIENT_ADMIN', 'HOD', 'RESPONDENT');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FormStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ResponseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'SYNCED', 'QUARANTINED');

-- CreateEnum
CREATE TYPE "DiagnosisStatus" AS ENUM ('PENDING_REVIEW', 'IN_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'DOCX', 'XLSX');

-- CreateEnum
CREATE TYPE "ConflictType" AS ENUM ('NUMERIC_VARIANCE', 'CONTRADICTORY_CHOICE');

-- CreateEnum
CREATE TYPE "ScoreScope" AS ENUM ('ORGANISATION', 'DEPARTMENT', 'RESPONDENT');

-- CreateEnum
CREATE TYPE "ScoreType" AS ENUM ('DIGITAL_READINESS', 'GIS_READINESS', 'DIMENSION', 'CATEGORY', 'INFRASTRUCTURE');

-- CreateEnum
CREATE TYPE "OrganogramRenderStatus" AS ENUM ('PENDING', 'RENDERED', 'ERROR');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SYNCING', 'SYNCED', 'ERROR');

-- CreateTable
CREATE TABLE "organisations" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "sector" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "organisations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "organisation_id" TEXT,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "department" VARCHAR(255),
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "mfa_secret" TEXT,
    "failed_login_count" SMALLINT NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "setup_token" TEXT,
    "setup_token_expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL,
    "organisation_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'DRAFT',
    "start_date" DATE,
    "end_date" DATE,
    "created_by" TEXT NOT NULL,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_consultants" (
    "evaluation_id" TEXT NOT NULL,
    "consultant_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluation_consultants_pkey" PRIMARY KEY ("evaluation_id","consultant_id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "sector" VARCHAR(100),
    "evaluation_type" VARCHAR(100),
    "version" INTEGER NOT NULL DEFAULT 1,
    "definition" JSONB NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_versions" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "definition" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forms" (
    "id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "template_id" TEXT,
    "template_version" INTEGER,
    "title" VARCHAR(255) NOT NULL,
    "definition" JSONB NOT NULL,
    "status" "FormStatus" NOT NULL DEFAULT 'DRAFT',
    "response_deadline" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "external_id" VARCHAR(100) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "label" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "dimensions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conditional_logic" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "condition" JSONB NOT NULL,
    "action" VARCHAR(20) NOT NULL,

    CONSTRAINT "conditional_logic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_assignments" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "respondent_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified_at" TIMESTAMP(3),

    CONSTRAINT "form_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responses" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "respondent_id" TEXT NOT NULL,
    "status" "ResponseStatus" NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMP(3),
    "synced_at" TIMESTAMP(3),
    "raw_cache_json" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "id" TEXT NOT NULL,
    "response_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conflicts" (
    "id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "conflict_type" "ConflictType" NOT NULL,
    "conflicting_values" JSONB NOT NULL,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolution_note" TEXT,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "score_results" (
    "id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "scope" "ScoreScope" NOT NULL,
    "scope_id" TEXT NOT NULL,
    "score_type" "ScoreType" NOT NULL,
    "category" VARCHAR(100),
    "score" DECIMAL(5,2) NOT NULL,
    "band" VARCHAR(50),
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weights_snapshot" JSONB,

    CONSTRAINT "score_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnoses" (
    "id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "content" JSONB NOT NULL,
    "status" "DiagnosisStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "is_ai_generated" BOOLEAN NOT NULL DEFAULT true,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "edits_made" BOOLEAN NOT NULL DEFAULT false,
    "rejection_reason" TEXT,

    CONSTRAINT "diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnosis_versions" (
    "id" TEXT NOT NULL,
    "diagnosis_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnosis_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "diagnosis_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "priority" VARCHAR(20) NOT NULL,
    "dimension" VARCHAR(20),
    "effort" VARCHAR(20),
    "expected_benefit" TEXT,
    "timeline" VARCHAR(255),
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "format" "ReportFormat" NOT NULL,
    "included_sections" JSONB NOT NULL,
    "storage_key" VARCHAR(500),
    "generated_by" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_size_bytes" BIGINT,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_links" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,

    CONSTRAINT "shared_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organograms" (
    "id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "raw_data" JSONB NOT NULL,
    "render_status" "OrganogramRenderStatus" NOT NULL DEFAULT 'PENDING',
    "error_detail" TEXT,
    "storage_key" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organograms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_maps" (
    "id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "bpmn_xml" TEXT,
    "nodes" JSONB NOT NULL DEFAULT '[]',
    "edges" JSONB NOT NULL DEFAULT '[]',
    "inefficient_nodes" TEXT[],
    "storage_key" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "file_size_bytes" BIGINT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" VARCHAR(100) NOT NULL,
    "resource_type" VARCHAR(100),
    "resource_id" TEXT,
    "metadata" JSONB,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scoring_weights" (
    "id" TEXT NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "weight" DECIMAL(5,4) NOT NULL,
    "updated_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scoring_weights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "form_assignments_form_id_respondent_id_key" ON "form_assignments"("form_id", "respondent_id");

-- CreateIndex
CREATE UNIQUE INDEX "shared_links_token_key" ON "shared_links"("token");

-- CreateIndex
CREATE UNIQUE INDEX "scoring_weights_category_key" ON "scoring_weights"("category");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_consultants" ADD CONSTRAINT "evaluation_consultants_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_consultants" ADD CONSTRAINT "evaluation_consultants_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_versions" ADD CONSTRAINT "template_versions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conditional_logic" ADD CONSTRAINT "conditional_logic_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_assignments" ADD CONSTRAINT "form_assignments_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_assignments" ADD CONSTRAINT "form_assignments_respondent_id_fkey" FOREIGN KEY ("respondent_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_respondent_id_fkey" FOREIGN KEY ("respondent_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflicts" ADD CONSTRAINT "conflicts_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflicts" ADD CONSTRAINT "conflicts_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflicts" ADD CONSTRAINT "conflicts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_results" ADD CONSTRAINT "score_results_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosis_versions" ADD CONSTRAINT "diagnosis_versions_diagnosis_id_fkey" FOREIGN KEY ("diagnosis_id") REFERENCES "diagnoses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_diagnosis_id_fkey" FOREIGN KEY ("diagnosis_id") REFERENCES "diagnoses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_links" ADD CONSTRAINT "shared_links_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_links" ADD CONSTRAINT "shared_links_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organograms" ADD CONSTRAINT "organograms_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_maps" ADD CONSTRAINT "workflow_maps_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scoring_weights" ADD CONSTRAINT "scoring_weights_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
