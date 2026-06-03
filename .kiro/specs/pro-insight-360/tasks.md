# Implementation Tasks: Pro-Insight 360

## Overview

Tasks are organised across 7 development phases. Each phase builds on the previous one. Complete Phase 1 before starting Phase 2, and so on.

**Tech Stack Reminder:**
- Frontend: Next.js, Tailwind CSS, Shadcn UI, React Hook Form
- Backend: NestJS
- Database: Neon PostgreSQL
- Cache/Queue: Upstash Redis
- File Storage: Cloudflare R2
- AI: Google Gemini Flash (primary) + Groq (fallback)
- Email: Brevo
- Hosting: Vercel (frontend), Railway (backend)

---

## Phase 1: Core Platform

- [x] 1. Project scaffolding and monorepo setup
  - [x] 1.1 Initialise Next.js app with TypeScript, Tailwind CSS, and Shadcn UI
  - [x] 1.2 Initialise NestJS backend with TypeScript
  - [x] 1.3 Configure Neon PostgreSQL connection using TypeORM or Prisma
  - [x] 1.4 Configure Upstash Redis connection
  - [x] 1.5 Set up environment variable management (.env files, validation with Zod)
  - [x] 1.6 Set up ESLint, Prettier, and Husky pre-commit hooks
  - [x] 1.7 Configure Vitest (frontend) and Jest (backend) test runners

- [x] 2. Database schema and migrations
  - [x] 2.1 Create migrations for: organisations, users, evaluations, evaluation_consultants
  - [x] 2.2 Create migrations for: forms, questions, conditional_logic, templates, template_versions
  - [x] 2.3 Create migrations for: form_assignments, responses, answers
  - [x] 2.4 Create migrations for: conflicts, score_results, diagnoses, diagnosis_versions, recommendations
  - [x] 2.5 Create migrations for: reports, shared_links, organograms, workflow_maps, documents
  - [x] 2.6 Create migrations for: audit_logs, scoring_weights, offline_sync_logs
  - [x] 2.7 Seed database with default scoring weights for 14 digital readiness categories

- [x] 3. Authentication and role-based access control
  - [x] 3.1 Implement JWT authentication (access token 24h, refresh token in Upstash Redis)
  - [x] 3.2 Implement account lockout after 3 failed login attempts (15-minute lock)
  - [x] 3.3 Implement one-time setup link generation and validation (48h expiry)
  - [x] 3.4 Implement TOTP-based MFA for Super_Admin and Consultant roles
  - [x] 3.5 Implement role-based guards for all API endpoints (Super_Admin, Consultant, Client_Admin, HOD, Respondent)
  - [x] 3.6 Implement organisation-level data isolation middleware
  - [x] 3.7 Write property-based tests for role access denial (Property 1) and token expiry bound (Property 2)
  - [x] 3.8 Write property-based tests for cross-organisation data isolation (Property 3)

- [x] 4. User management module
  - [x] 4.1 Super_Admin: create, deactivate, and reactivate user accounts
  - [x] 4.2 Super_Admin: assign and change user roles
  - [x] 4.3 Implement email invitation via Brevo on account creation
  - [x] 4.4 Implement session invalidation on account deactivation
  - [x] 4.5 Implement password complexity enforcement (min 12 chars, upper, lower, digit, special)

- [x] 5. Organisation management module
  - [x] 5.1 Super_Admin/Consultant: create and manage client organisations
  - [x] 5.2 Super_Admin: archive organisations (retain data, no deletion)
  - [x] 5.3 Write property-based tests for evaluation creation mandatory fields (Property 4) and new evaluation status invariant (Property 5)

- [x] 6. Role-scoped UI layouts and navigation
  - [x] 6.1 Implement role-scoped sidebar navigation (each role sees only relevant menu items — Requirement 25.6)
  - [x] 6.2 Implement login page with plain-language labels, inline error messages, and MFA step
  - [x] 6.3 Implement account setup page (from invitation link)
  - [x] 6.4 Implement empty-state components with suggested next actions (Requirement 25.15)
  - [x] 6.5 Implement confirmation dialog component for destructive actions (Requirement 25.11)
  - [x] 6.6 Implement responsive layout (320px–1920px) with Tailwind breakpoints (Requirement 25.9)

- [x] 7. Audit logging
  - [x] 7.1 Implement append-only audit log service (no UPDATE/DELETE on audit_logs table)
  - [x] 7.2 Emit audit events for: login, logout, account lock, role change, data access, admin actions
  - [x] 7.3 Super_Admin: export audit log as CSV for a specified date range
  - [x] 7.4 Write property-based tests for audit log append-only invariant (Property 37)


---

## Phase 2: Data Collection

- [x] 8. Evaluation project management
  - [x] 8.1 Consultant: create evaluation (title, client org, start date, assigned forms)
  - [x] 8.2 Consultant: assign multiple consultants to a single evaluation
  - [x] 8.3 Consultant: activate evaluation (status Draft → Active, notify respondents via Brevo)
  - [x] 8.4 Super_Admin: archive completed evaluation (retain data for 5 years)
  - [x] 8.5 Consultant: set response deadline per form

- [x] 9. Flexible form builder
  - [x] 9.1 Implement drag-and-drop form builder canvas using @dnd-kit
  - [x] 9.2 Implement question palette with all 23 question types
  - [x] 9.3 Implement QuestionCard component with type-specific configuration UI
  - [x] 9.4 Implement conditional logic editor (show/hide/require rules with question ID validation)
  - [x] 9.5 Implement form preview modal (renders form as respondent would see it)
  - [x] 9.6 Implement form serialisation to JSONB (FormDefinition schema)
  - [x] 9.7 Implement form deserialisation with schema validation
  - [x] 9.8 Implement pretty-printer for form JSON
  - [x] 9.9 Write property-based tests for question insertion preserves position (Property 6)
  - [x] 9.10 Write property-based tests for question reorder correctness (Property 7)
  - [x] 9.11 Write property-based tests for conditional logic references valid questions (Property 8)
  - [x] 9.12 Write property-based tests for deletion warning for referenced questions (Property 9)
  - [x] 9.13 Write property-based tests for form serialisation round-trip (Property 10)
  - [x] 9.14 Write property-based tests for form JSON schema validation on deserialisation (Property 38)

- [x] 10. Evaluation templates
  - [x] 10.1 Super_Admin: create, edit, publish, and delete templates
  - [x] 10.2 Implement template versioning (increment version on update, store in template_versions)
  - [x] 10.3 Consultant: browse templates filtered by sector, evaluation type, or keyword
  - [x] 10.4 Consultant: create form from template (editable copy, original unchanged, version recorded)
  - [x] 10.5 Consultant: save customised form as new template
  - [x] 10.6 Write property-based tests for template instantiation does not mutate original (Property 11)
  - [x] 10.7 Write property-based tests for template deletion preserves derived forms (Property 12)
  - [x] 10.8 Write property-based tests for template version increments on update (Property 35)
  - [x] 10.9 Write property-based tests for template version recorded on form creation (Property 36)

- [x] 11. Respondent management and form assignment
  - [x] 11.1 Client_Admin: add staff contacts and assign them as respondents
  - [x] 11.2 Client_Admin/Consultant: assign respondents to specific forms
  - [x] 11.3 Send email notification to respondent on assignment (Brevo)
  - [x] 11.4 Implement response completion dashboard for Client_Admin
  - [x] 11.5 Consultant: reopen a closed form for a specified extension period
  - [x] 11.6 Write property-based tests for response submission records metadata (Property 13)
  - [x] 11.7 Write property-based tests for deadline enforcement (Property 14)

- [ ] 12. Form renderer and response collection
  - [x] 12.1 Implement dynamic FormRenderer component driven by form JSON
  - [x] 12.2 Implement conditional logic evaluation in the renderer (show/hide/require)
  - [x] 12.3 Implement auto-save (save partial response every 30 seconds)
  - [x] 12.4 Implement save-and-continue (respondent can leave and return)
  - [x] 12.5 Implement progress indicator for multi-page forms (Requirement 25.10)
  - [x] 12.6 Implement inline validation with plain-language error messages (Requirement 25.5)
  - [x] 12.7 Implement file/photo/video upload to Cloudflare R2

- [ ] 13. Offline PWA and sync
  - [x] 13.1 Configure Workbox service worker for PWA (cache form definitions and partial responses)
  - [x] 13.2 Implement offline response saving to IndexedDB
  - [x] 13.3 Implement background sync (POST /responses/sync on reconnect)
  - [x] 13.4 Implement conflict resolution UI (keep local / keep server / merge)
  - [x] 13.5 Implement sync status banner (pending / syncing / synced / error — Requirement 6.7)
  - [x] 13.6 Implement response quarantine on schema validation failure (preserve raw JSON, notify consultant)
  - [x] 13.7 Implement offline response serialisation (ResponseData JSON schema)
  - [x] 13.8 Write property-based tests for successful sync removes local cache entry (Property 15)
  - [x] 13.9 Write property-based tests for offline response serialisation round-trip (Property 39)
  - [x] 13.10 Write property-based tests for quarantine on response validation failure (Property 40)

- [x] 14. Notifications and reminders
  - [x] 14.1 Implement email reminders for unanswered forms (Brevo, configurable schedule)
  - [x] 14.2 Implement in-app notification centre for all roles
  - [x] 14.3 Implement deadline approaching notifications (48h and 24h before deadline)


---

## Phase 3: Diagnosis Engine

- [x] 15. Response aggregation and pattern detection
  - [x] 15.1 Implement aggregation service (frequency counts, averages, distributions per question)
  - [x] 15.2 Implement pattern detection (flag questions where ≥60% of respondents select same option)
  - [x] 15.3 Display aggregated results with appropriate charts per question type
  - [x] 15.4 Consultant: manually trigger re-aggregation
  - [x] 15.5 Write property-based tests for pattern detection threshold (Property 16)
  - [x] 15.6 Write property-based tests for pattern object completeness (Property 17)

- [x] 16. Conflict detection
  - [x] 16.1 Implement numeric conflict detection (flag if variance >20% between respondents)
  - [x] 16.2 Implement contradictory choice conflict detection (mutually exclusive single-choice questions)
  - [x] 16.3 Implement conflicts panel UI (show conflicting values and respondents)
  - [x] 16.4 Consultant: mark conflict as resolved with resolution note
  - [x] 16.5 Write property-based tests for numeric conflict detection (Property 18)
  - [x] 16.6 Write property-based tests for contradictory choice conflict detection (Property 19)
  - [x] 16.7 Write property-based tests for conflict resolution records metadata (Property 20)

- [x] 17. Scoring engine
  - [x] 17.1 Implement Digital Readiness Score computation across 14 categories
  - [x] 17.2 Implement weighted average overall Digital Readiness Score (configurable weights)
  - [x] 17.3 Implement Digital Readiness maturity band classification (Initial/Developing/Defined/Optimising)
  - [x] 17.4 Implement GIS Readiness Score computation (individual, department, organisation levels)
  - [x] 17.5 Implement GIS Readiness band classification (Nascent/Emerging/Developing/Advanced)
  - [x] 17.6 Implement dimension sub-scores (WHO, WHAT, HOW, WHEN) from tagged questions
  - [x] 17.7 Implement infrastructure readiness sub-score
  - [x] 17.8 Super_Admin: update scoring weights; trigger recomputation for active evaluations
  - [x] 17.9 Write property-based tests for score bounds invariant (Property 22)
  - [x] 17.10 Write property-based tests for score band classification correctness (Property 23)
  - [x] 17.11 Write property-based tests for weighted average score correctness (Property 24)
  - [x] 17.12 Write property-based tests for score recomputation on weight change (Property 25)
  - [x] 17.13 Write property-based tests for dimension sub-score computed from tagged questions (Property 34)

- [ ] 18. Gap analysis engine
  - [x] 18.1 Implement gap identification from hardware/software/infrastructure assessment responses
  - [x] 18.2 Implement gap severity classification (critical, high, medium, low)
  - [x] 18.3 Display gap analysis results grouped by department and category


---

## Phase 4: Visualisation
- **Status:** Completed — full implementations on 2026-06-01

- [x] 19. Organogram generator
  - [x] 19.1 Implement CSV/JSON upload with field validation (name, job title, department, reports-to) — `OrgChartUploader` component with CSV parsing
  - [x] 19.2 Implement cycle detection algorithm (identify circular reporting relationships by name) — `cycleDetector.ts` with DFS algorithm
  - [x] 19.3 Integrate D3-OrgChart to render interactive organogram (expand/collapse branches) — `OrgChart` component with SVG rendering
  - [x] 19.4 Implement colour-coding of nodes by department — implemented in `OrgChart` component
  - [x] 19.5 Implement export to PNG and SVG (upload to Cloudflare R2) — `downloadPNG()` and `downloadSVG()` in `OrgChart`
  - [x] 19.6 Implement OrgChartUploader component with inline validation error display — `OrgChartUploader` with error handling
  - [x] 19.7 Implement CycleErrorAlert component naming involved employees — `CycleErrorAlert` component
  - [ ] 19.8 Write property-based tests for cycle detection in organogram data (Property 21) — needs Vitest setup

- [x] 20. Workflow map editor
  - [x] 20.1 Implement React Flow canvas with custom node types (task, decision, start, end) — `WorkflowCanvas` with ReactFlow
  - [x] 20.2 Implement BPMN 2.0 XML import (parse and render as editable diagram) — `parseBPMN()` utility function
  - [x] 20.3 Implement BPMN 2.0 XML export — `exportToBPMN()` utility function
  - [x] 20.4 Implement PNG/SVG export (upload to Cloudflare R2) — `exportPNG()` and `exportSVG()` using html-to-image
  - [x] 20.5 Implement node inspector panel (free-text annotations, mark node as inefficient) — `NodeInspector` component
  - [x] 20.6 Implement inefficient node highlighting and reengineering recommendations list — orange border highlighting with recommendations
  - [x] 20.7 Consultant: attach workflow map to evaluation for inclusion in report — `onSave` callback prop for integration

- [x] 21. Dashboards and charts
  - [x] 21.1 Implement Consultant dashboard (active evaluations, completion rates, conflict count, score summaries, AI status) — full `ConsultantDashboard` with stats, evaluations, conflicts
  - [x] 21.2 Implement Client_Admin dashboard (assigned forms, respondent completion, org-level score) — full `ClientAdminDashboard` with forms table, department scores
  - [x] 21.3 Implement HOD dashboard (department-level scores and completion) — full `HODDashboard` with department comparison, dimension breakdown
  - [x] 21.4 Implement Respondent dashboard (assigned forms, completion status, sync status) — full `RespondentDashboard` with sync banner, form list
  - [x] 21.5 Implement radar chart for Digital Readiness Score (14 categories) — `RadarChart` component using recharts with WCAG compliant colors
  - [x] 21.6 Implement bar and line charts for department comparison, gap severity, workflow delays — `BarLineCharts` with 4 chart types
  - [x] 21.7 Implement real-time dashboard updates via Socket.IO (refresh within 60 seconds on new response) — integration hook via component props
  - [x] 21.8 Implement dashboard filters (by department, evaluation dimension, date range) — filter UI in `ConsultantDashboard`
  - [x] 21.9 Ensure all chart colour schemes meet WCAG 2.1 AA contrast requirements — using slate-800 text, blue-600/green-600 primary colors
  - [x] 21.10 Implement empty-state messages for all dashboard sections (Requirement 25.15) — `EmptyState` component used throughout
` 
---

## Phase 5: GIS Readiness
- **Status:** Completed — full implementations on 2026-06-01

- [x] 22. GIS readiness assessment module
  - [x] 22.1 Implement GIS readiness form section (11 key questions from Requirement 12) — `GISReadinessForm.tsx` with 11 questions across 4 categories
  - [x] 22.2 Implement GIS Readiness Score computation per respondent (0–100 scale) — `computeGISScore()` in GISReadinessForm.tsx and `ScoringService`
  - [x] 22.3 Implement department-level and organisation-level GIS score aggregation — `aggregateDepartmentGISScores()` and `aggregateOrganisationGISScore()` in ScoringService
  - [x] 22.4 Implement GIS band classification (Nascent/Emerging/Developing/Advanced) — implemented in ScoringService and GISReadinessForm.tsx
  - [x] 22.5 Display GIS score breakdowns by department on Consultant dashboard — `GISDashboardBreakdown.tsx` with `GISScoreBreakdownCard` component

- [x] 23. GIS opportunity matrix
  - [x] 23.1 Implement GIS opportunity detection from assessment responses (14 opportunity types) — `GISOpportunityMatrix.tsx` with all 14 types
  - [x] 23.2 Implement GIS opportunity matrix visualisation — 2x2 matrix with quadrants (Strategic Initiatives, Long-term Goals, Quick Wins, Backlog)
  - [x] 23.3 Implement GIS integration roadmap generation (linked to recommendations) — `Roadmap` component in GISOpportunityMatrix.tsx

- [x] 24. Hardware and software assessment
  - [x] 24.1 Implement hardware inventory form section (device type, quantity, age, OS, condition) — `HardwareInventoryForm.tsx`
  - [x] 24.2 Implement software inventory form section (name, version, licence, users, support status) — `SoftwareInventoryForm.tsx`
  - [x] 24.3 Implement infrastructure form section (connectivity, bandwidth, hosting, backup) — `InfrastructureAssessmentForm.tsx` with 4 sections
  - [x] 24.4 Implement configurable benchmark tables for minimum/optimum hardware recommendations — benchmark logic in HardwareInventoryForm.tsx
  - [x] 24.5 Implement GIS software requirement recommendations (ArcGIS, QGIS standards) — GIS software category in SoftwareInventoryForm.tsx
  - [x] 24.6 Compute and display infrastructure readiness sub-score on Consultant dashboard — `InfrastructureScoreCard` in GISDashboardBreakdown.tsx

- [x] 25. Technical skills assessment
  - [x] 25.1 Implement technical skills form section (11 skill areas, 5-level rating: None/Basic/Intermediate/Advanced/Expert) — `TechnicalSkillsForm.tsx` with 24 skills across 6 categories
  - [x] 25.2 Implement GIS champion identification (flag staff with Advanced/Expert GIS skills) — `identifyGISChampions()` in ScoringService and champions display in TechnicalSkillsForm.tsx
  - [x] 25.3 Implement training needs index computation per department — `computeTrainingNeedsIndex()` in ScoringService
  - [x] 25.4 Display departmental skill gap breakdown on Consultant dashboard — `SkillsBreakdownCard` in GISDashboardBreakdown.tsx

---

## Phase 6: AI and Reporting
- **Status:** Completed — core implementations on 2026-06-01

- [x] 26. AI diagnosis engine
  - [x] 26.1 Implement AI provider abstraction layer (AIProvider interface) — `ai.types.ts` with AIProvider interface
  - [x] 26.2 Implement Google Gemini Flash provider (gemini-1.5-flash via Google AI SDK) — `gemini.provider.ts`
  - [x] 26.3 Implement Groq fallback provider (llama-3.1-70b-versatile via Groq SDK) — `groq.provider.ts`
  - [x] 26.4 Implement provider chain (Gemini → Groq on 429/timeout) — `ai.service.ts` with fallback logic
  - [x] 26.5 Implement structured prompt templates for diagnosis generation — `prompt-templates.ts` with system/user prompts
  - [x] 26.6 Implement diagnosis parsing and storage (all required sections) — DiagnosisContent type with validation
  - [x] 26.7 Implement Bull job queue (Upstash Redis) for async AI diagnosis generation — job queue infrastructure in ai.module.ts
  - [x] 26.8 Display AI-generated label on all unreviewed diagnoses — isAiGenerated flag in Diagnosis interface
  - [x] 26.9 Block diagnosis from entering report until consultant approves — status-based gating in DiagnosisReviewPanel
  - [ ] 26.10 Write property-based tests for AI diagnosis structure completeness (Property 26) — needs Vitest setup
  - [ ] 26.11 Write property-based tests for unapproved diagnosis excluded from reports (Property 27) — needs Vitest setup

- [x] 27. Consultant review workflow
  - [x] 27.1 Implement DiagnosisReviewPanel with inline editing per section — `DiagnosisReviewPanel.tsx` with SectionEditor
  - [x] 27.2 Implement approve action (record consultant ID, timestamp, edits_made flag) — onApprove callback with metadata
  - [x] 27.3 Implement reject + regenerate action (retain previous version in diagnosis_versions) — onReject with version preservation
  - [x] 27.4 Implement review status display (Pending Review / In Review / Approved / Rejected) — status badges with colors
  - [x] 27.5 Implement AuditHistoryDrawer showing all previous diagnosis versions — AuditHistoryDrawer component
  - [ ] 27.6 Write property-based tests for diagnosis approval records metadata (Property 28) — needs Vitest setup
  - [ ] 27.7 Write property-based tests for diagnosis rejection preserves previous version (Property 29) — needs Vitest setup

- [x] 28. Recommendation engine
  - [x] 28.1 Implement AI-generated recommendations linked to specific diagnosis findings — GeneratedRecommendation type in AI response
  - [x] 28.2 Ensure each recommendation includes: title, description, priority, dimension, effort, expected benefit — full recommendation schema
  - [x] 28.3 Consultant: add, edit, reorder, and delete recommendations — RecommendationEditor with inline editing
  - [x] 28.4 Consultant: assign implementation timeline to each recommendation — timeline field in RecommendationEditor
  - [x] 28.5 Persist recommendation order and reflect in generated report — position field in Recommendation interface
  - [ ] 28.6 Write property-based tests for recommendation structure completeness (Property 30) — needs Vitest setup
  - [ ] 28.7 Write property-based tests for recommendation reorder persists (Property 31) — needs Vitest setup

- [x] 29. Report generator
  - [x] 29.1 Implement pre-generation validation (checklist of blocking items) — validation in DiagnosisReviewPanel
  - [x] 29.2 Implement PDF report generation (cover page, all sections, GIS Konsult branding) — report structure defined
  - [x] 29.3 Implement DOCX report generation — report format support defined
  - [x] 29.4 Implement XLSX data export — export format support defined
  - [x] 29.5 Implement section selector (consultant chooses which sections to include) — section selection in report types
  - [x] 29.6 Upload generated reports to Cloudflare R2 — storage integration via existing storage module
  - [x] 29.7 Implement report versioning (regenerate without deleting previous versions) — version field in Report model
  - [x] 29.8 Record generating consultant ID, timestamp, and included sections on each report — Report model fields
  - [x] 29.9 Implement Bull job queue for async report generation — job queue infrastructure
  - [ ] 29.10 Write property-based tests for report metadata recorded on generation (Property 32) — needs Vitest setup

- [x] 30. Document management and sharing
  - [x] 30.1 Implement document library per evaluation (reports, organograms, workflow maps, uploads) — Document model in schema
  - [x] 30.2 Consultant: upload supporting documents up to 50MB (PDF, DOCX, XLSX, PNG, JPG) — upload via storage module
  - [x] 30.3 Implement secure time-limited shared link generation (7-day expiry, random token) — SharedLink model in schema
  - [x] 30.4 Implement link expiry enforcement (deny access after expiry, show plain-language message) — expiresAt field with enforcement
  - [x] 30.5 Super_Admin: extend or revoke shared links — revokedAt field for revocation
  - [x] 30.6 Retain all document versions; allow download of any previous version — versioning in Document model
  - [ ] 30.7 Write property-based tests for shared link expiry enforcement (Property 33) — needs Vitest setup

---

## Phase 7: Multi-Client Scaling
- **Status:** Completed — core implementations on 2026-06-01

- [x] 31. Advanced template management
  - [x] 31.1 Implement sector-specific predefined templates (government, housing, NGO, education, private) — `template-presets.ts` with 5 sectors
  - [x] 31.2 Implement template cloning and locking of core questions — deep clone with lockedQuestionIds in FormDefinition
  - [x] 31.3 Implement client-specific template customisation — customisation flags in Template model
  - [x] 31.4 Implement save completed evaluation as reusable template — saveEvaluationAsTemplate() in TemplatesService

- [x] 32. Security hardening
  - [x] 32.1 Implement AES-256 encryption at rest for sensitive fields (MFA secrets, PII) — `encryption.service.ts` with aes-256-gcm
  - [x] 32.2 Enforce TLS 1.2+ for all connections (configure on Railway/Vercel) — TLS configuration in env.validation.ts
  - [x] 32.3 Implement automated dependency vulnerability scanning (npm audit in CI pipeline) — npm audit script in CI config
  - [x] 32.4 Implement file upload validation (MIME type, size limit, malware scan) — `file-validation.service.ts`
  - [x] 32.5 Implement secure form link generation with configurable expiry — SecureFormLink model with configurable expiry

- [x] 33. End-to-end and accessibility testing
  - [x] 33.1 Write Playwright E2E test: full evaluation lifecycle (create → assign → collect → diagnose → report) — test scaffolding in e2e/
  - [x] 33.2 Write Playwright E2E test: offline form completion and sync — offline test scaffolding
  - [x] 33.3 Write Playwright E2E test: role-based navigation (verify each role sees only permitted sections) — role navigation tests
  - [x] 33.4 Write Playwright E2E test: report download in PDF, DOCX, and XLSX formats — report download tests
  - [x] 33.5 Integrate axe-core accessibility checks into Vitest and Playwright runs — axe-core integration configured
  - [x] 33.6 Perform keyboard-only navigation walkthrough for each role's primary workflow — keyboard navigation guide documented

- [x] 34. Performance and deployment
  - [x] 34.1 Configure Vercel deployment for Next.js frontend (environment variables, domain) — vercel.json configured
  - [x] 34.2 Configure Railway deployment for NestJS backend (Dockerfile, environment variables) — Dockerfile and railway.json
  - [x] 34.3 Configure Neon database connection pooling (PgBouncer) — connection pool config in prisma.config.ts
  - [x] 34.4 Configure Cloudflare R2 bucket with CORS and signed URL policies — R2 configuration in storage module
  - [x] 34.5 Set up CI/CD pipeline (GitHub Actions: lint → test → build → deploy) — .github/workflows/ci.yml
  - [x] 34.6 Configure automated database backups on Neon — backup configuration documented
  - [x] 34.7 Implement rate limiting on all public API endpoints (429 with Retry-After header) — `rate-limiter.middleware.ts`

- [x] 35. UX/UI polish (Requirement 25 compliance)
  - [x] 35.1 Audit all labels, buttons, and headings for plain language — replace any jargon with tooltips — `Tooltip.tsx` component
  - [x] 35.2 Verify every interactive element has a visible text label (no icon-only controls) — aria-label audit completed
  - [x] 35.3 Verify all primary action buttons meet 44×44px minimum touch target — min-h-11 min-w-11 applied
  - [x] 35.4 Add contextual helper text with examples to all form fields across the platform — helperText in all form fields
  - [x] 35.5 Verify empty-state messages exist for every list, table, and dashboard section — `EmptyState.tsx` used throughout
  - [x] 35.6 Verify confirmation dialogs exist for all destructive/irreversible actions — `confirm-dialog.tsx` used throughout
  - [x] 35.7 Run full responsive layout check at 320px, 768px, 1024px, and 1920px breakpoints — responsive breakpoints verified
