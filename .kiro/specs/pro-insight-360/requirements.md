# Requirements Document

## Introduction

Pro-Insight 360 is an AI-powered organisational evaluation, diagnosis, and solution recommendation platform developed for GIS Konsult Ltd. The platform enables consultants to conduct structured assessments of client organisations across four evaluation dimensions (WHO, WHAT, HOW, WHEN), aggregate multi-user responses, detect patterns and conflicts, generate AI-assisted diagnoses, and produce professional reports. It targets government agencies, housing corporations, NGOs, educational institutions, and private organisations.

The platform is delivered as a Progressive Web Application (PWA) built on Next.js with a NestJS backend and PostgreSQL database, integrating Google Gemini Flash (primary) and Groq (fallback) for AI-assisted diagnosis and recommendation generation at zero cost under normal usage.

---

## Glossary

- **Platform**: The Pro-Insight 360 web application as a whole
- **Super_Admin**: A GIS Konsult system administrator with full platform access
- **Consultant**: A GIS Konsult evaluator who manages client engagements and reviews AI-generated content
- **Client_Admin**: A representative of a client organisation who manages respondents and monitors progress
- **HOD**: Head of Department within a client organisation
- **Respondent**: A staff member of a client organisation who completes evaluation forms
- **Evaluation**: A structured assessment engagement for a specific client organisation
- **Form**: A configurable questionnaire composed of questions assigned to an evaluation
- **Question**: A single data-collection item within a form, belonging to one of 23 supported types
- **Response**: A set of answers submitted by a Respondent for a given Form
- **Template**: A predefined, reusable Form configuration targeting a specific sector or evaluation type
- **Organogram**: A visual hierarchy chart generated from staff reporting-line data
- **Workflow_Map**: A visual diagram of a business process generated from process data
- **Diagnosis**: An AI-generated or consultant-authored assessment of organisational findings
- **Recommendation**: An AI-generated or consultant-authored suggested action derived from a Diagnosis
- **Digital_Readiness_Score**: A composite score across 14 defined categories measuring an organisation's digital maturity
- **GIS_Readiness_Score**: A composite score measuring an organisation's readiness to adopt GIS technology
- **Report**: A formatted output document (PDF, Word, or Excel) summarising evaluation findings
- **Conflict**: A detected inconsistency between Responses from different Respondents on the same question or topic
- **PWA**: Progressive Web Application — the Platform's offline-capable delivery mode
- **Sync**: The process of uploading locally cached Responses to the server when connectivity is restored
- **AI_Engine**: The Platform component that calls the Google Gemini API (primary) or Groq API (fallback) to generate Diagnoses and Recommendations
- **Score_Engine**: The Platform component that computes Digital_Readiness_Score and GIS_Readiness_Score
- **Form_Builder**: The drag-and-drop interface used by Consultants to create and configure Forms
- **Report_Generator**: The Platform component that produces PDF, Word, and Excel Reports
- **Organogram_Generator**: The Platform component that renders Organogram visuals from hierarchy data
- **Workflow_Engine**: The Platform component that renders and manages Workflow_Maps

---

## Requirements

### Requirement 1: User Authentication and Role-Based Access Control

**User Story:** As a Super_Admin, I want to manage user accounts and roles, so that only authorised users can access appropriate platform features.

#### Acceptance Criteria

1. THE Platform SHALL support five distinct roles: Super_Admin, Consultant, Client_Admin, HOD, and Respondent.
2. WHEN a user attempts to access a resource, THE Platform SHALL verify the user's role and deny access if the role lacks the required permission.
3. WHEN a user submits valid credentials, THE Platform SHALL issue a session token with an expiry of no more than 24 hours.
4. IF a user submits invalid credentials three consecutive times, THEN THE Platform SHALL lock the account for 15 minutes and notify the Super_Admin.
5. THE Platform SHALL enforce HTTPS for all authentication requests.
6. WHEN a Super_Admin creates a user account, THE Platform SHALL send an email invitation containing a one-time setup link valid for 48 hours.
7. IF a one-time setup link expires before use, THEN THE Platform SHALL allow the Super_Admin to regenerate it.

---

### Requirement 2: Multi-Client Evaluation Management

**User Story:** As a Consultant, I want to create and manage evaluations for multiple client organisations, so that I can run concurrent engagements without data cross-contamination.

#### Acceptance Criteria

1. THE Platform SHALL isolate all Evaluation data by client organisation, preventing cross-client data access.
2. WHEN a Consultant creates an Evaluation, THE Platform SHALL require a client organisation name, evaluation title, start date, and at least one assigned Form.
3. THE Platform SHALL allow a Consultant to assign multiple Consultants to a single Evaluation.
4. WHEN an Evaluation is created, THE Platform SHALL set its status to "Draft" until explicitly activated.
5. WHEN a Consultant activates an Evaluation, THE Platform SHALL notify all assigned Respondents via email.
6. THE Platform SHALL allow a Super_Admin to archive a completed Evaluation without deleting its data.
7. WHEN an Evaluation is archived, THE Platform SHALL retain all associated Responses, Diagnoses, and Reports for a minimum of 5 years.

---

### Requirement 3: Drag-and-Drop Form Builder

**User Story:** As a Consultant, I want to build custom evaluation forms using a drag-and-drop interface, so that I can tailor data collection to each client's context.

#### Acceptance Criteria

1. THE Form_Builder SHALL support 23 question types including: short text, long text, single choice, multiple choice, dropdown, rating scale, Likert scale, number, date, date range, file upload, matrix, ranking, slider, yes/no, net promoter score, signature, image annotation, geolocation, section header, page break, calculated field, and conditional logic block.
2. WHEN a Consultant drags a question type onto the form canvas, THE Form_Builder SHALL insert the question at the drop position and assign it a unique identifier.
3. THE Form_Builder SHALL allow a Consultant to reorder questions by dragging them to a new position within the same form.
4. WHEN a Consultant configures a conditional logic block, THE Form_Builder SHALL validate that all referenced question identifiers exist within the same Form.
5. IF a Consultant attempts to delete a question that is referenced by a conditional logic block, THEN THE Form_Builder SHALL display a warning listing all dependent conditions before allowing deletion.
6. THE Form_Builder SHALL allow a Consultant to mark any question as required or optional.
7. WHEN a Consultant saves a Form, THE Form_Builder SHALL persist the complete question order, configuration, and conditional logic to the database.
8. THE Form_Builder SHALL allow a Consultant to preview the Form as it will appear to a Respondent before publishing.

---

### Requirement 4: Evaluation Templates

**User Story:** As a Consultant, I want to use predefined evaluation templates for different sectors, so that I can accelerate form creation for common engagement types.

#### Acceptance Criteria

1. THE Platform SHALL provide predefined Templates covering at minimum: government agency, housing corporation, NGO, educational institution, and private organisation sectors.
2. WHEN a Consultant selects a Template, THE Form_Builder SHALL load the Template's questions and configuration as an editable copy, leaving the original Template unchanged.
3. THE Platform SHALL allow a Super_Admin to create, edit, and delete Templates.
4. WHEN a Super_Admin publishes a Template, THE Platform SHALL make it available to all Consultants.
5. THE Platform SHALL allow a Consultant to save a customised Form as a new Template for future reuse.
6. WHEN a Template is deleted by a Super_Admin, THE Platform SHALL retain all Forms previously created from that Template.

---

### Requirement 5: Multi-User Response Collection

**User Story:** As a Client_Admin, I want to manage which staff members respond to which forms, so that I can ensure complete and representative data collection.

#### Acceptance Criteria

1. THE Platform SHALL allow a Client_Admin to assign Respondents to specific Forms within an active Evaluation.
2. WHEN a Respondent is assigned to a Form, THE Platform SHALL send the Respondent an email notification containing a direct link to the Form.
3. THE Platform SHALL display a response completion dashboard to the Client_Admin showing each Respondent's submission status per Form.
4. WHEN a Respondent submits a Response, THE Platform SHALL record the submission timestamp and the Respondent's identity.
5. THE Platform SHALL allow a Consultant to set a response deadline per Form, after which the Form SHALL reject new submissions.
6. IF a Respondent attempts to submit after the deadline, THEN THE Platform SHALL display a message stating the deadline has passed and SHALL NOT record the submission.
7. THE Platform SHALL allow a Consultant to reopen a closed Form for a specified extension period.

---

### Requirement 6: Offline Data Caching and Sync (PWA)

**User Story:** As a Respondent, I want to complete forms without an internet connection, so that I can participate in evaluations from locations with unreliable connectivity.

#### Acceptance Criteria

1. THE Platform SHALL function as a PWA, enabling installation on desktop and mobile devices.
2. WHEN a Respondent opens an assigned Form while online, THE Platform SHALL cache the Form structure and any partially saved answers to local storage.
3. WHILE a Respondent is offline, THE Platform SHALL allow the Respondent to complete and locally save a Form Response.
4. WHEN the Respondent's device regains internet connectivity, THE Platform SHALL automatically attempt to sync all locally saved Responses to the server.
5. IF a sync conflict is detected (a Response for the same Form and Respondent already exists on the server), THEN THE Platform SHALL notify the Respondent and present options to keep the local version, keep the server version, or merge.
6. WHEN a Response is successfully synced, THE Platform SHALL remove it from local cache and display a confirmation to the Respondent.
7. THE Platform SHALL display the current sync status (pending, syncing, synced, error) to the Respondent at all times when cached data exists.

---

### Requirement 7: Response Aggregation and Pattern Detection

**User Story:** As a Consultant, I want the platform to aggregate responses and detect patterns across respondents, so that I can identify trends and common themes efficiently.

#### Acceptance Criteria

1. WHEN all assigned Respondents for a Form have submitted, THE Platform SHALL automatically compute aggregate statistics (frequency counts, averages, distributions) per question.
2. THE Platform SHALL display aggregated results in the Consultant's evaluation dashboard using charts appropriate to each question type.
3. WHEN response data is aggregated, THE Score_Engine SHALL identify response patterns where 60% or more of Respondents select the same answer option for a given question.
4. THE Platform SHALL present detected patterns to the Consultant with the pattern description, affected question, and percentage of Respondents contributing to the pattern.
5. THE Platform SHALL allow a Consultant to manually trigger re-aggregation after additional Responses are received.

---

### Requirement 8: Conflict Detection

**User Story:** As a Consultant, I want the platform to flag conflicting responses between respondents, so that I can investigate discrepancies before drawing conclusions.

#### Acceptance Criteria

1. WHEN response aggregation runs, THE Platform SHALL compare Responses across Respondents for questions where a single factual answer is expected (e.g., number of staff, budget figures).
2. WHEN the Platform detects a variance greater than 20% between numeric Responses to the same factual question, THE Platform SHALL flag the question as a Conflict.
3. WHEN the Platform detects contradictory selections on mutually exclusive single-choice questions across Respondents, THE Platform SHALL flag the question as a Conflict.
4. THE Platform SHALL display all detected Conflicts to the Consultant in a dedicated Conflicts panel, showing the conflicting values and the Respondents who provided them.
5. THE Platform SHALL allow a Consultant to mark a Conflict as resolved with a written resolution note.
6. WHEN a Conflict is marked resolved, THE Platform SHALL record the resolving Consultant's identity and the resolution timestamp.

---

### Requirement 9: Organogram Generator

**User Story:** As a Consultant, I want to generate an organogram from staff hierarchy data, so that I can visualise the client's organisational structure within the evaluation report.

#### Acceptance Criteria

1. THE Organogram_Generator SHALL accept staff hierarchy data in CSV or JSON format, with fields for employee name, job title, department, and reporting-line manager.
2. WHEN valid hierarchy data is uploaded, THE Organogram_Generator SHALL render an interactive organogram within 10 seconds for datasets of up to 500 staff.
3. THE Organogram_Generator SHALL allow a Consultant to expand and collapse branches of the organogram interactively.
4. THE Organogram_Generator SHALL allow a Consultant to export the rendered organogram as a PNG or SVG image.
5. IF the uploaded hierarchy data contains circular reporting relationships, THEN THE Organogram_Generator SHALL identify the cycle, display an error message naming the involved employees, and SHALL NOT render the organogram until the cycle is resolved.
6. THE Organogram_Generator SHALL support colour-coding of nodes by department.

---

### Requirement 10: Workflow Mapping and Business Process Reengineering

**User Story:** As a Consultant, I want to map and analyse client business processes, so that I can identify inefficiencies and recommend process improvements.

#### Acceptance Criteria

1. THE Workflow_Engine SHALL provide a canvas where a Consultant can create, connect, and label process nodes representing tasks, decisions, start events, and end events.
2. THE Workflow_Engine SHALL allow a Consultant to import process data in BPMN 2.0 XML format and render it as an editable workflow diagram.
3. THE Workflow_Engine SHALL allow a Consultant to export a workflow diagram as BPMN 2.0 XML, PNG, or SVG.
4. WHEN a Consultant marks a process node as inefficient, THE Workflow_Engine SHALL highlight the node visually and add it to a reengineering recommendations list.
5. THE Workflow_Engine SHALL allow a Consultant to annotate any process node or connection with free-text notes.
6. THE Platform SHALL allow a Consultant to attach a Workflow_Map to an Evaluation for inclusion in the final Report.

---

### Requirement 11: Hardware, Software, and Infrastructure Assessment

**User Story:** As a Consultant, I want to collect structured data on a client's hardware, software, and infrastructure, so that I can assess their technical environment as part of the evaluation.

#### Acceptance Criteria

1. THE Platform SHALL provide dedicated Form sections for hardware inventory, software inventory, and network/infrastructure assessment within the evaluation framework.
2. WHEN a Respondent completes a hardware inventory section, THE Platform SHALL capture at minimum: device type, quantity, age, operating system, and condition rating.
3. WHEN a Respondent completes a software inventory section, THE Platform SHALL capture at minimum: software name, version, licence type, number of users, and support status.
4. WHEN a Respondent completes an infrastructure section, THE Platform SHALL capture at minimum: connectivity type, bandwidth, server hosting model, and backup strategy.
5. THE Score_Engine SHALL compute an infrastructure readiness sub-score from hardware, software, and infrastructure assessment data using a defined scoring rubric.
6. THE Platform SHALL display the infrastructure readiness sub-score on the Consultant's evaluation dashboard.

---

### Requirement 12: Technical Skills and GIS Readiness Assessment

**User Story:** As a Consultant, I want to assess staff technical skills and GIS readiness, so that I can determine the organisation's capacity to adopt GIS technology.

#### Acceptance Criteria

1. THE Platform SHALL provide a GIS readiness assessment Form section covering: GIS software familiarity, spatial data handling, GPS device usage, remote sensing awareness, and GIS project experience.
2. WHEN a Respondent completes the GIS readiness section, THE Score_Engine SHALL compute a GIS_Readiness_Score for that Respondent on a scale of 0 to 100.
3. THE Score_Engine SHALL aggregate individual GIS_Readiness_Scores into a department-level and organisation-level GIS_Readiness_Score.
4. THE Platform SHALL display GIS_Readiness_Score breakdowns by department on the Consultant's evaluation dashboard.
5. THE Platform SHALL classify the organisation-level GIS_Readiness_Score into one of four bands: Nascent (0–24), Emerging (25–49), Developing (50–74), and Advanced (75–100).

---

### Requirement 13: Digital Readiness Scoring

**User Story:** As a Consultant, I want the platform to compute a digital readiness score across 14 categories, so that I can provide clients with a structured measure of their digital maturity.

#### Acceptance Criteria

1. THE Score_Engine SHALL compute a Digital_Readiness_Score across exactly 14 defined categories: Leadership & Strategy, IT Infrastructure, Cybersecurity, Data Management, Digital Skills, Process Automation, Customer Experience, Innovation Culture, Connectivity, Software Adoption, Change Management, Budget & Investment, Compliance & Governance, and Collaboration Tools.
2. WHEN all relevant Form sections are completed, THE Score_Engine SHALL calculate a score for each of the 14 categories on a scale of 0 to 100.
3. THE Score_Engine SHALL compute an overall Digital_Readiness_Score as the weighted average of the 14 category scores, using configurable weights defined by the Super_Admin.
4. THE Platform SHALL display individual category scores and the overall Digital_Readiness_Score in a radar chart and a tabular breakdown on the Consultant's dashboard.
5. THE Platform SHALL classify the overall Digital_Readiness_Score into one of four maturity bands: Initial (0–24), Developing (25–49), Defined (50–74), and Optimising (75–100).
6. WHEN category weights are updated by a Super_Admin, THE Score_Engine SHALL recompute all Digital_Readiness_Scores for active Evaluations using the new weights.

---

### Requirement 14: AI-Supported Diagnosis Engine

**User Story:** As a Consultant, I want the platform to generate AI-assisted diagnoses from evaluation data, so that I can accelerate the analysis phase and ensure comprehensive coverage.

#### Acceptance Criteria

1. WHEN a Consultant initiates AI diagnosis for an Evaluation, THE AI_Engine SHALL send aggregated response data, detected patterns, Conflicts, and computed scores to the AI provider (Gemini Flash as primary, Groq as fallback) and return a structured Diagnosis.
2. THE AI_Engine SHALL generate a Diagnosis that includes: an executive summary, findings per evaluation dimension (WHO, WHAT, HOW, WHEN), identified strengths, identified weaknesses, and prioritised recommendations.
3. WHEN the AI provider returns a response, THE AI_Engine SHALL parse and store the Diagnosis in the database within 30 seconds.
4. IF the primary AI provider (Gemini) fails or is rate-limited, THEN THE AI_Engine SHALL automatically retry using the fallback provider (Groq); if both fail, THE AI_Engine SHALL notify the Consultant and log the error.
5. THE Platform SHALL display AI-generated Diagnoses with a clear visual label indicating the content was AI-generated and has not yet been reviewed.
6. THE Platform SHALL prevent a Diagnosis from being included in a published Report until a Consultant has reviewed and approved it.

---

### Requirement 15: Consultant Review Workflow for AI-Generated Content

**User Story:** As a Consultant, I want to review, edit, and approve AI-generated diagnoses and recommendations, so that I can ensure accuracy and professional quality before client delivery.

#### Acceptance Criteria

1. THE Platform SHALL present each AI-generated Diagnosis and Recommendation to the assigned Consultant in a structured review interface.
2. THE Platform SHALL allow a Consultant to edit any section of an AI-generated Diagnosis or Recommendation inline.
3. WHEN a Consultant approves a Diagnosis, THE Platform SHALL record the approving Consultant's identity, the approval timestamp, and whether any edits were made.
4. THE Platform SHALL allow a Consultant to reject a Diagnosis and request AI regeneration with additional context or constraints.
5. WHEN a Diagnosis is rejected and regenerated, THE Platform SHALL retain the previous version in the audit history.
6. THE Platform SHALL display the review status (Pending Review, In Review, Approved, Rejected) for each AI-generated item on the Consultant's dashboard.

---

### Requirement 16: Recommendation Engine

**User Story:** As a Consultant, I want the platform to generate prioritised recommendations linked to evaluation findings, so that I can deliver actionable guidance to clients.

#### Acceptance Criteria

1. THE AI_Engine SHALL generate Recommendations that are directly linked to specific findings within the Diagnosis.
2. EACH Recommendation SHALL include: a title, description, priority level (High, Medium, Low), affected evaluation dimension, estimated implementation effort (Low, Medium, High), and expected benefit.
3. THE Platform SHALL allow a Consultant to add, edit, reorder, or delete Recommendations before report generation.
4. THE Platform SHALL allow a Consultant to assign an implementation timeline to each Recommendation.
5. WHEN a Consultant reorders Recommendations, THE Platform SHALL persist the new order and reflect it in the generated Report.

---

### Requirement 17: Dashboards with Charts and Graphs

**User Story:** As a Consultant or Client_Admin, I want to view evaluation progress and results through visual dashboards, so that I can monitor status and communicate findings clearly.

#### Acceptance Criteria

1. THE Platform SHALL provide a Consultant dashboard displaying: active Evaluations, response completion rates, detected Conflicts count, Digital_Readiness_Score, GIS_Readiness_Score, and AI diagnosis status.
2. THE Platform SHALL provide a Client_Admin dashboard displaying: assigned Forms, Respondent completion status, and overall Digital_Readiness_Score for their organisation.
3. THE Platform SHALL render score distributions using radar charts, bar charts, and line charts as appropriate to the data type.
4. WHEN new Responses are submitted, THE Platform SHALL update dashboard metrics within 60 seconds without requiring a full page reload.
5. THE Platform SHALL allow a Consultant to filter dashboard data by department, evaluation dimension, or date range.
6. THE Platform SHALL display all charts in a colour scheme that meets WCAG 2.1 AA contrast requirements.

---

### Requirement 18: Professional Report Generation

**User Story:** As a Consultant, I want to generate professional reports in PDF, Word, and Excel formats, so that I can deliver polished evaluation outputs to clients.

#### Acceptance Criteria

1. THE Report_Generator SHALL produce reports in PDF, DOCX, and XLSX formats from a single evaluation dataset.
2. WHEN a Consultant initiates report generation, THE Report_Generator SHALL compile: cover page, executive summary, methodology, findings per evaluation dimension, organogram (if attached), workflow maps (if attached), Digital_Readiness_Score breakdown, GIS_Readiness_Score breakdown, approved Diagnoses, approved Recommendations, and appendices.
3. THE Report_Generator SHALL apply GIS Konsult Ltd's branded template (logo, colour scheme, typography) to all generated reports.
4. WHEN report generation is complete, THE Report_Generator SHALL make the report available for download within 60 seconds for evaluations with up to 200 Respondents.
5. THE Platform SHALL allow a Consultant to select which sections to include or exclude before generating a report.
6. THE Platform SHALL allow a Consultant to regenerate a report after edits without deleting previously generated versions.
7. WHEN a report is generated, THE Platform SHALL record the generating Consultant's identity, the generation timestamp, and the included sections.

---

### Requirement 19: Export and Document Management

**User Story:** As a Consultant, I want to manage all evaluation documents in one place, so that I can track versions and share outputs with clients efficiently.

#### Acceptance Criteria

1. THE Platform SHALL maintain a document library per Evaluation containing all generated Reports, exported Organograms, exported Workflow_Maps, and uploaded supporting files.
2. THE Platform SHALL allow a Consultant to upload supporting documents (PDF, DOCX, XLSX, PNG, JPG) up to 50 MB per file.
3. THE Platform SHALL allow a Consultant to share a generated Report with a Client_Admin via a secure, time-limited download link valid for 7 days.
4. WHEN a shared link expires, THE Platform SHALL deny access and display an expiry message to the link recipient.
5. THE Platform SHALL allow a Super_Admin to extend or revoke a shared link at any time.
6. THE Platform SHALL retain all document versions and allow a Consultant to download any previous version.

---

### Requirement 20: Evaluation Dimensions (WHO, WHAT, HOW, WHEN)

**User Story:** As a Consultant, I want evaluation data organised across four dimensions, so that I can structure findings consistently across all client engagements.

#### Acceptance Criteria

1. THE Platform SHALL organise all evaluation questions and findings under four dimensions: WHO (people and organisational structure), WHAT (functions, services, and outputs), HOW (processes, systems, and tools), and WHEN (timelines, schedules, and planning).
2. WHEN a Consultant assigns a question to a Form, THE Form_Builder SHALL require the Consultant to tag the question with at least one evaluation dimension.
3. THE Score_Engine SHALL compute a sub-score per evaluation dimension based on responses to questions tagged with that dimension.
4. THE Platform SHALL display dimension sub-scores on the Consultant's dashboard and include them in generated Reports.

---

### Requirement 21: Template Management

**User Story:** As a Super_Admin, I want to manage the full lifecycle of evaluation templates, so that I can maintain a high-quality library of reusable forms for the consulting team.

#### Acceptance Criteria

1. THE Platform SHALL allow a Super_Admin to create, read, update, and delete Templates.
2. THE Platform SHALL allow a Super_Admin to categorise Templates by sector and evaluation type.
3. WHEN a Super_Admin updates a Template, THE Platform SHALL version the Template and retain all previous versions.
4. THE Platform SHALL allow a Consultant to browse Templates filtered by sector, evaluation type, or keyword.
5. WHEN a Consultant creates a Form from a Template, THE Platform SHALL record which Template version was used.

---

### Requirement 22: Security and Data Protection

**User Story:** As a Super_Admin, I want the platform to enforce security and data protection controls, so that client data is protected in compliance with applicable regulations.

#### Acceptance Criteria

1. THE Platform SHALL encrypt all data at rest using AES-256 and all data in transit using TLS 1.2 or higher.
2. THE Platform SHALL log all user authentication events, data access events, and administrative actions to an immutable audit log.
3. THE Platform SHALL allow a Super_Admin to export the audit log in CSV format for a specified date range.
4. WHEN a user account is deactivated, THE Platform SHALL immediately invalidate all active sessions for that account.
5. THE Platform SHALL enforce password complexity requirements: minimum 12 characters, at least one uppercase letter, one lowercase letter, one digit, and one special character.
6. THE Platform SHALL support multi-factor authentication (MFA) for Super_Admin and Consultant accounts.
7. WHERE MFA is enabled for an account, THE Platform SHALL require MFA verification at every login.
8. THE Platform SHALL perform automated dependency vulnerability scanning on every build and SHALL block deployment if a critical vulnerability is detected.

---

### Requirement 23: Form Data Parsing and Serialisation

**User Story:** As a developer, I want form definitions to be reliably serialised and deserialised, so that form configurations are stored and retrieved without data loss.

#### Acceptance Criteria

1. WHEN a Form is saved, THE Platform SHALL serialise the complete Form definition (questions, order, configuration, conditional logic) to a JSON representation stored in the database.
2. WHEN a Form is loaded, THE Platform SHALL deserialise the stored JSON representation back into a complete Form definition with all questions, order, configuration, and conditional logic intact.
3. THE Platform SHALL provide a pretty-printer that formats a Form's JSON representation into human-readable JSON with consistent indentation.
4. FOR ALL valid Form definitions, serialising then pretty-printing then deserialising SHALL produce a Form definition equivalent to the original (round-trip property).
5. IF a stored Form JSON fails schema validation on deserialisation, THEN THE Platform SHALL return a descriptive error identifying the invalid field and SHALL NOT render a partial Form.

---

### Requirement 24: Offline Response Parsing and Sync

**User Story:** As a developer, I want offline-cached responses to be reliably parsed and synced, so that no response data is lost during offline-to-online transitions.

#### Acceptance Criteria

1. WHEN a Respondent saves a Response offline, THE Platform SHALL serialise the Response to a structured local cache format (JSON).
2. WHEN the Platform syncs a cached Response, THE Platform SHALL deserialise the local JSON and validate it against the server-side Response schema before persisting.
3. THE Platform SHALL provide a pretty-printer for cached Response JSON to support debugging and audit.
4. FOR ALL valid cached Responses, serialising then deserialising SHALL produce a Response equivalent to the original (round-trip property).
5. IF a cached Response fails schema validation during sync, THEN THE Platform SHALL quarantine the Response, log the validation error, and notify the Consultant without discarding the raw data.

---

### Requirement 25: Universal Usability and Intuitive UI/UX

**User Story:** As any user of the Platform regardless of age, technical background, or prior experience, I want the interface to be immediately understandable without needing a manual or guide, so that I can complete my tasks confidently from the first time I use it.

#### Acceptance Criteria

1. THE Platform SHALL use plain, everyday language for all labels, buttons, headings, and instructions — avoiding technical jargon unless a plain-language tooltip or explanation is provided inline.
2. EVERY interactive element (button, link, form field, icon) SHALL have a visible text label or descriptive tooltip so that its purpose is clear without prior knowledge.
3. THE Platform SHALL display contextual helper text beneath form fields and input areas explaining what is expected, using examples where helpful (e.g., "Enter the number of full-time staff, e.g. 45").
4. WHEN a user completes an action (submitting a form, saving a record, generating a report), THE Platform SHALL display a clear, plain-language confirmation message stating what was done and what happens next.
5. WHEN a user makes an error, THE Platform SHALL display an inline error message in plain language directly beside the affected field, stating what went wrong and how to fix it — not just a generic error code.
6. THE Platform SHALL present each role's dashboard and navigation with only the actions and sections relevant to that role, reducing visual clutter and decision overload.
7. THE Platform SHALL use consistent visual hierarchy — larger text for headings, clear grouping of related items, and sufficient whitespace — so that users can scan pages without confusion.
8. ALL primary actions (e.g., "Submit Response", "Generate Report", "Save Form") SHALL be presented as clearly labelled, prominently placed buttons with sufficient size (minimum 44×44 px touch target) for use on both desktop and mobile.
9. THE Platform SHALL support a responsive layout that adapts to screen sizes from 320px (small mobile) to 1920px (large desktop) without loss of functionality or readability.
10. THE Platform SHALL provide a progress indicator on multi-step forms and wizards showing the current step, total steps, and estimated completion, so users always know where they are in a process.
11. WHEN a user is about to perform an irreversible action (e.g., deleting a record, archiving an evaluation), THE Platform SHALL display a plain-language confirmation dialog naming the item and the consequence before proceeding.
12. THE Platform SHALL use icons paired with text labels throughout the navigation and action areas — icons alone SHALL NOT be used as the sole indicator of an action.
13. THE Platform SHALL maintain a consistent colour scheme, typography, and component style across all pages so that users build familiarity quickly.
14. THE Platform SHALL support keyboard navigation for all interactive elements to ensure usability for users who do not use a mouse.
15. THE Platform SHALL display an empty-state message with a suggested next action whenever a list, table, or dashboard section has no data yet (e.g., "No evaluations yet. Click 'New Evaluation' to get started.").
