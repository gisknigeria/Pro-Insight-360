/**
 * One-time seed: upsert the AI diagnosis for Oyo State Housing Corporation
 * evaluation ID: bc61bf84-0394-473d-a60a-a74f797d54d4
 *
 * Run with: node prisma/seed-oyo-diagnosis.js
 */

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config();

if (process.env.DIRECT_DATABASE_URL && process.env.NODE_ENV !== 'production') {
  process.env.DATABASE_URL = process.env.DIRECT_DATABASE_URL;
}

const prisma = new PrismaClient();

const EVALUATION_ID = 'bc61bf84-0394-473d-a60a-a74f797d54d4';

const analysis = {
  questions: [
    { question: 'Organisation', answer: 'Oyo State Housing Corporation' },
    { question: 'Departments Represented', answer: 'Finance & Accounts, Information & Public Relations, Legal Services, Marketing & Commercial, Admin Department, DTS/Town Planning (x2), PRS/ICT, Admin & Supplies, Works & Maintenance' },
    { question: 'GIS system exists?', answer: 'No — confirmed across all 10 respondents' },
    { question: 'Property database exists?', answer: 'Mostly No — one respondent (Marketing) indicated Yes, one (Works) indicated Yes, majority No' },
    { question: 'Internet availability', answer: "No — across all departments; Finance noted it 'has been abandoned for years'" },
    { question: 'Server/cloud readiness', answer: 'No across all departments' },
    { question: 'Hardware condition', answer: 'Ranges from Poor to Fair; most departments report No or Poor hardware' },
    { question: 'IT support capacity', answer: 'Absent or minimal across all departments' },
    { question: 'Change readiness', answer: 'Generally positive/willing — multiple respondents expressed readiness for digital transformation' },
    { question: 'Current systems in use', answer: 'MS Word, Excel, Manual/Paper-based filing predominantly' },
  ],
  executiveSummary:
    "Oyo State Housing Corporation is operating at a critically pre-digital state, with all ten surveyed departments confirming fully manual, paper-based processes across finance, legal, town planning, marketing, administration, and works functions. No GIS infrastructure exists anywhere in the organisation, internet connectivity has been absent or abandoned, and hardware assets range from poor to fair condition with virtually no IT support capacity on the ground. Despite this, a strong and consistent thread of change readiness and willingness to adopt digital systems runs through every department, providing a valuable human foundation upon which a transformation programme can be built. The organisation's most urgent needs are basic ICT infrastructure provisioning, structured training across all cadres, and the phased introduction of a GIS-linked property database and document management system to address chronic challenges around file retrieval, missing records, and bureaucratic bottlenecks.",
  strengths: [
    'High and consistent change readiness expressed across all ten departments — staff are willing and in some cases eager for digital transformation',
    'Existing hierarchical staff structure provides clear reporting lines that can underpin governance of a new digital system',
    'Some departments (Finance, Legal, Marketing, Works) have basic indexing systems in place, providing a starting framework for data migration',
    'Legal department already uses spatial data for land acquisition and boundary disputes, demonstrating latent GIS appetite',
    'Town Planning and DTS departments maintain both analogue and some digital layout plans, indicating partial digitisation has occurred before',
    'Revenue streams are clearly defined across departments (ground rent, assessment fees, TOL fees, renovation fees, penal fees) providing a solid billing data model',
    'ICT/PRS department exists with a staff member who has moderate ICT skill and awareness of OWASP security standards',
    'Finance department has an active payment system and HR/payroll system in place, which can serve as anchors for broader ERP integration',
    'The appointment of a Supervising Technical Consultant for GIS and Digital Transformation signals executive-level commitment to change',
    'Multiple respondents could articulate specific GIS dashboard requirements (plot allocation, encroachment alerts, road dimensions, allottee demographics), demonstrating domain awareness',
  ],
  weaknesses: [
    'Complete absence of internet connectivity across all departments — the backbone of any digital transformation is missing',
    'No server or cloud infrastructure exists anywhere in the organisation',
    'Hardware is absent, poor, or outdated in the majority of departments; some departments have no computers at all',
    'No IT support personnel on the ground in most departments; the ICT unit is severely understaffed',
    'All core processes are manual and paper-based: approvals, billing, record retrieval, audit, legal case tracking, building plan approvals',
    'Chronic file retrieval failures — files go missing, are misplaced, or are abandoned by responsible officers, causing operational paralysis',
    'No GIS system exists in any department, including Town Planning which critically depends on spatial data',
    'No property database exists corporately, undermining the organisation's core mandate as a housing corporation',
    'Previous digitisation attempts failed — attributed to failed user acceptance tests and inadequate materials, suggesting poor implementation methodology in the past',
    'ICT/GIS skill levels are rated as absent, lacking, or basic across all departments including the ICT unit itself',
    'Severe bureaucratic bottlenecks in approval workflows — the Works & Maintenance approval chain alone spans eight sequential stops (Engr → Director → GM → Audit → DAS → Chairman → GM → Audit → DFA)',
    'No formal security policies in most departments; absence of data protection frameworks for sensitive legal and financial records',
    'Staff structure is thin — low staff strength noted in Public Relations; ICT unit lacks sufficient officers',
    'Revenue data is entirely unstructured and paper-based, making financial reporting, forecasting, and audit extremely difficult',
    'No standardised document management or indexing system across departments — each unit manages records independently with no corporate standard',
  ],
  opportunities: [
    "Deployment of a GIS-linked property database would directly address the organisation's core mandate and unlock new revenue through improved ground rent recovery and debt collection",
    "Cloud-first infrastructure strategy can bypass the need for expensive on-premise server investment, leveraging Nigeria's expanding mobile broadband coverage",
    'Digitisation of legal records and title documents would accelerate property verification, reduce litigation exposure, and support debt recovery',
    'Automation of the ground rent billing and collection cycle (currently annual paper-based) offers immediate, measurable ROI',
    'Integration of existing HR/Payroll and payment systems into a unified ERP platform would eliminate redundant manual reconciliation',
    'Building plan approval workflow automation could dramatically reduce turnaround time and eliminate file abandonment bottlenecks',
    "Staff's expressed willingness to be trained represents a low-resistance environment for structured capacity building programmes",
    'The Supervising Technical Consultant role provides a legitimate change agent to drive the transformation from within with external expertise',
    'Revenue diversification opportunities identified (parking fees, stacking fees) could be operationalised through a digital billing platform',
    'Spatial data from town planning (layout plans, survey plans) can be georeferenced and digitised to build a foundational GIS asset layer',
    "The audit department's desire to have its schedule of work captured on GIS opens a pathway for compliance monitoring and asset inspection tracking",
    'Phased rollout starting with quick wins (hardware procurement, connectivity, basic document scanning) can build trust and momentum before complex systems are deployed',
  ],
  gaps: [
    'CRITICAL: Zero internet infrastructure — no digital system can function without resolving connectivity first',
    'CRITICAL: No GIS capability whatsoever in a housing corporation that manages land, estates, and property — a fundamental mission-critical gap',
    'CRITICAL: No corporate property database — core business asset data is entirely absent in digital form',
    'CRITICAL: IT human capital near-zero — one partially skilled ICT officer cannot support organisation-wide digital transformation',
    'CRITICAL: No formal data governance framework — no policies on data ownership, retention, access control, or backup',
    'CRITICAL: Document management failure — files are lost, misplaced, and abandoned with no tracking or accountability mechanism',
    'HIGH: No cloud or server infrastructure, making data storage, backup, and remote access impossible',
    'HIGH: Hardware deficit across most departments — computers and printers are absent or non-functional in Admin, Town Planning, Works, and Public Relations',
    'HIGH: No security policies in most departments — sensitive legal, financial, and property records are unprotected',
    'HIGH: Approval workflow complexity — multi-step manual chains averaging 6–10 sequential approvals create systemic delays',
    'HIGH: No standardised billing or invoicing system — ground rent billing is manual, annual, and unintegrated with finance records',
    'MEDIUM: No change management framework — willingness to change exists but there is no structured programme to manage the transition',
    'MEDIUM: No training curriculum or schedule — training needs are universally acknowledged but no plan exists',
    'MEDIUM: Spatial data in Town Planning is in poor condition (analogue, unindexed, cabinet-stored) and at risk of permanent loss',
    'MEDIUM: No audit trail or version control on any document — regulatory compliance risk is significant',
  ],
  recommendations: [
    '1. [IMMEDIATE — 0–30 days] Commission a full hardware and connectivity audit; procure emergency internet connectivity (LTE/fibre) for at minimum the GM office, ICT unit, Finance, Legal, and Town Planning departments to unblock all downstream digital work',
    '2. [IMMEDIATE — 0–30 days] Recruit or second at least two additional ICT officers and engage an external implementation partner to supplement the single existing ICT staff member — no transformation is possible without human technical capacity',
    '3. [SHORT TERM — 30–90 days] Procure and deploy basic hardware (computers, printers, scanners) to all departments using a prioritised list: Town Planning, Legal, Finance, Marketing, then Admin units',
    '4. [SHORT TERM — 30–90 days] Launch an emergency document digitisation programme starting with Legal title documents and Town Planning layout plans — these are the highest-risk records due to poor storage conditions and irreplaceability',
    '5. [SHORT TERM — 60–90 days] Deploy a lightweight cloud-based Document Management System (DMS) — e.g. SharePoint, Google Workspace, or a local EDMS — with scanning stations to eliminate file loss and enable search-based retrieval',
    '6. [MEDIUM TERM — 90–180 days] Design and deploy a GIS-linked property database integrating allottee records, plot allocation status, survey plans, and ground rent accounts — this is the single highest-impact system for the corporation\'s core mandate',
    '7. [MEDIUM TERM — 90–180 days] Automate the ground rent billing, collection, and reconciliation cycle — integrate with designated bank accounts and generate digital receipts; this directly improves revenue capture',
    '8. [MEDIUM TERM — 90–180 days] Implement a digital workflow and approval management system to replace the 8–10 step manual file circulation process — include escalation timers and accountability tracking',
    '9. [MEDIUM TERM — 120–180 days] Deliver a structured ICT and GIS training programme for all staff levels, starting with departmental heads and technical staff (Town Planning, Legal, Finance), then cascading to all table staff',
    '10. [MEDIUM TERM — 120–180 days] Establish a formal Data Governance Policy and IT Security Policy framework, including data ownership assignments, access control, backup schedules, and incident response procedures aligned to OWASP guidance already referenced by ICT',
    '11. [LONG TERM — 180–365 days] Deploy a full GIS dashboard covering: allottee demographics, plot allocation status, encroachment alerts, litigation-affected properties, infrastructure dimensions, and revenue by estate — fulfilling the specific requirements articulated by Town Planning, Legal, and Works departments',
    '12. [LONG TERM — 180–365 days] Integrate all sub-systems (DMS, GIS, billing, HR/payroll, audit) into a unified Enterprise Resource Planning environment with role-based access, ensuring the GM and Chairman have real-time executive dashboards',
    '13. [ONGOING] Establish a permanent Change Management Committee chaired by the Supervising Technical Consultant with representatives from each directorate to govern the transformation, manage resistance, and report progress to the GM quarterly',
  ],
  actionPlan: [
    { who: 'Supervising Technical Consultant + GM', what: 'Hardware & Connectivity Needs Assessment Report', how: 'Physical audit of all departmental computers, printers, and network points; benchmark against minimum viable digital infrastructure requirements; produce a costed procurement plan', when: 'Within 14 days' },
    { who: 'GM + Board Chairman', what: 'Emergency budget approval for ICT infrastructure procurement', how: 'Present needs assessment report to board; secure line-item budget for hardware, internet subscription, and implementation partner engagement', when: 'Within 30 days' },
    { who: 'ICT/PRS Department (Akinpelu Akinwale) + External Partner', what: 'Internet connectivity deployed in priority departments', how: 'Procure LTE routers or negotiate ISP fibre contract; install at GM office, ICT, Finance, Legal, Town Planning', when: 'Within 45 days' },
    { who: 'GM + HR/Admin', what: 'Recruitment of 2 additional ICT officers', how: 'Post vacancies, shortlist candidates with GIS/database skills, interview and deploy; alternatively second from Oyo State ICTO', when: 'Within 60 days' },
    { who: 'ICT/PRS + Admin & Supplies', what: 'Hardware procurement and deployment to all departments', how: 'Use approved budget; procure computers, printers, scanners per departmental priority list; configure on local network', when: 'Within 75 days' },
    { who: 'Legal Department (Omojuwa O.O.) + ICT', what: 'Emergency digitisation of legal title documents and court records', how: 'Deploy scanners; assign dedicated scanning staff; use OCR software; upload to secure cloud folder with access controls', when: 'Within 90 days' },
    { who: 'DTS/Town Planning (Isola Akeem + Eniade Oluwasegun) + ICT', what: 'Digitisation and georeferencing of layout plans', how: 'Scan all analogue layout plans; georeference in QGIS or ArcGIS; create a master index of all estate layouts', when: 'Within 90 days' },
    { who: 'ICT/PRS + Supervising Technical Consultant', what: 'Deploy cloud-based Document Management System', how: 'Evaluate and procure EDMS (SharePoint Online or equivalent); configure department folders, naming conventions, and access roles; migrate scanned documents', when: 'Within 120 days' },
    { who: 'Finance (Kayode Abiodun) + ICT + Marketing (Lawal Olatunde)', what: 'Automated ground rent billing and collection system', how: 'Map current manual billing workflow; configure digital invoicing module linked to allottee database and bank payment gateway; pilot with one estate', when: 'Within 150 days' },
    { who: 'Supervising Technical Consultant + DTS/Town Planning + Legal + ICT', what: 'GIS-linked property database — Phase 1 deployment', how: 'Select GIS platform (QGIS/PostGIS or ArcGIS Online); populate with digitised survey plans, allottee records, plot allocations; integrate with billing module', when: 'Within 180 days' },
    { who: 'ICT/PRS + HR/Admin (Falola O.S.)', what: 'Organisation-wide ICT and GIS training programme', how: 'Design curriculum by role level: Executive (dashboards), Technical (GIS/EDMS), Administrative (data entry/scanning); deliver in batches; certify completion', when: 'Within 180 days' },
    { who: 'ICT/PRS (Akinpelu) + Legal + GM Office', what: 'Formal IT Security and Data Governance Policy', how: 'Draft policy aligned to OWASP standards; include data classification, access control, backup, incident response; obtain GM/Chairman approval; distribute and train all staff', when: 'Within 150 days' },
    { who: 'Supervising Technical Consultant + All Directors', what: 'Digital workflow and approval management system', how: 'Map all approval chains (Works, Legal, Town Planning); configure digital workflow tool (e.g. Kissflow or custom); set SLA timers; pilot in Works & Maintenance department', when: 'Within 210 days' },
    { who: 'ICT/PRS + Finance + Legal + DTS + Works', what: 'Full GIS executive dashboard launch', how: 'Aggregate data from GIS database, billing system, and DMS; configure role-based dashboards for GM (revenue + occupancy), Legal (litigation plots), DTS (development control), Works (infrastructure)', when: 'Within 365 days' },
    { who: 'Supervising Technical Consultant (Chair) + All Department Heads', what: 'Quarterly Digital Transformation Steering Committee', how: 'Establish standing terms of reference; hold quarterly reviews; track KPIs (% processes digitised, file retrieval time, revenue collected digitally, GIS coverage); report to GM and Board', when: 'Establish within 30 days; ongoing quarterly thereafter' },
  ],
  charts: [
    {
      title: 'GIS Readiness by Domain',
      data: [
        { label: 'Infrastructure', value: 3 },
        { label: 'Data Management', value: 8 },
        { label: 'Staff GIS Skills', value: 5 },
        { label: 'Governance', value: 4 },
        { label: 'Workflows', value: 6 },
        { label: 'Spatial Data Assets', value: 12 },
        { label: 'Leadership Buy-in', value: 35 },
      ],
    },
    {
      title: 'Digital Readiness Scores (0–100)',
      data: [
        { label: 'Technology Infra', value: 8 },
        { label: 'Process Automation', value: 5 },
        { label: 'Digital Culture', value: 42 },
        { label: 'Data Quality', value: 10 },
        { label: 'Leadership Alignment', value: 48 },
        { label: 'Connectivity', value: 4 },
        { label: 'Change Readiness', value: 65 },
      ],
    },
    {
      title: 'Technical Skills Proficiency by Department (0–100)',
      data: [
        { label: 'ICT/PRS', value: 45 },
        { label: 'Finance & Accounts', value: 25 },
        { label: 'Legal Services', value: 30 },
        { label: 'DTS/Town Planning', value: 20 },
        { label: 'Marketing & Commercial', value: 18 },
        { label: 'Works & Maintenance', value: 15 },
        { label: 'Admin & Supplies', value: 10 },
        { label: 'Public Relations', value: 20 },
      ],
    },
    {
      title: 'Governance Maturity (0–100)',
      data: [
        { label: 'Policy Framework', value: 12 },
        { label: 'Risk Management', value: 8 },
        { label: 'Compliance Structures', value: 18 },
        { label: 'Accountability', value: 35 },
        { label: 'Security Policies', value: 7 },
        { label: 'Audit Trail', value: 20 },
      ],
    },
    {
      title: 'Overall Organisational Readiness (0–100)',
      data: [
        { label: 'GIS Readiness', value: 6 },
        { label: 'Digital Transformation', value: 12 },
        { label: 'Technical Skills', value: 22 },
        { label: 'Governance', value: 17 },
        { label: 'Operations', value: 28 },
        { label: 'Change Readiness', value: 62 },
        { label: 'Revenue Systems', value: 20 },
      ],
    },
  ],
  organogram: {
    nodes: [
      { id: '1', label: 'Board Chairman', group: 'Board' },
      { id: '2', label: 'General Manager (GM)', group: 'Executive' },
      { id: '3', label: 'Director – Finance & Accounts', group: 'Finance & Accounts' },
      { id: '4', label: 'Director – Legal Services', group: 'Legal Services' },
      { id: '5', label: 'Director – DTS / Town Planning', group: 'DTS / Town Planning' },
      { id: '6', label: 'Director – Works & Maintenance', group: 'Works & Maintenance' },
      { id: '7', label: 'Director – Admin & Supplies', group: 'Admin & Supplies' },
      { id: '8', label: 'Director – Marketing & Commercial', group: 'Marketing & Commercial' },
      { id: '9', label: 'Head – ICT / PRS', group: 'ICT / PRS' },
      { id: '10', label: 'Head – Information & Public Relations', group: 'Information & Public Relations' },
      { id: '11', label: 'Supervising Technical Consultant (GIS & Digital Transformation)', group: 'Consultancy / Special Projects' },
      { id: '12', label: 'Deputy Director – Finance', group: 'Finance & Accounts' },
      { id: '13', label: 'Sectional Heads – Finance', group: 'Finance & Accounts' },
      { id: '14', label: 'Cash Office Staff', group: 'Finance & Accounts' },
      { id: '15', label: 'Final Accounts Staff', group: 'Finance & Accounts' },
      { id: '16', label: 'Head of Legal / State Counsel', group: 'Legal Services' },
      { id: '17', label: 'State Counsels', group: 'Legal Services' },
      { id: '18', label: 'Legal Administrative Staff', group: 'Legal Services' },
      { id: '19', label: 'Principal Town Planning Officer (PTO)', group: 'DTS / Town Planning' },
      { id: '20', label: 'Assistant Town Planning Officer (ATO)', group: 'DTS / Town Planning' },
      { id: '21', label: 'Higher Executive Officer – Town Planning', group: 'DTS / Town Planning' },
      { id: '22', label: 'Chief Engineer (C.Engr)', group: 'Works & Maintenance' },
      { id: '23', label: 'Engineer / Electrical Section', group: 'Works & Maintenance' },
      { id: '24', label: 'Architect', group: 'Works & Maintenance' },
      { id: '25', label: 'Sectional Head – Admin', group: 'Admin & Supplies' },
      { id: '26', label: 'Audit Staff', group: 'Admin & Supplies' },
      { id: '27', label: 'Sectional Head – Marketing', group: 'Marketing & Commercial' },
      { id: '28', label: 'Ledger / Invoice Staff', group: 'Marketing & Commercial' },
      { id: '29', label: 'ICT Officer', group: 'ICT / PRS' },
      { id: '30', label: 'Press / Media Officer', group: 'Information & Public Relations' },
    ],
    links: [
      { source: 'General Manager (GM)', target: 'Board Chairman', relation: 'reports to' },
      { source: 'Supervising Technical Consultant (GIS & Digital Transformation)', target: 'General Manager (GM)', relation: 'reports to / advises' },
      { source: 'Director – Finance & Accounts', target: 'General Manager (GM)', relation: 'reports to' },
      { source: 'Director – Legal Services', target: 'General Manager (GM)', relation: 'reports to' },
      { source: 'Director – DTS / Town Planning', target: 'General Manager (GM)', relation: 'reports to' },
      { source: 'Director – Works & Maintenance', target: 'General Manager (GM)', relation: 'reports to' },
      { source: 'Director – Admin & Supplies', target: 'General Manager (GM)', relation: 'reports to' },
      { source: 'Director – Marketing & Commercial', target: 'General Manager (GM)', relation: 'reports to' },
      { source: 'Head – ICT / PRS', target: 'General Manager (GM)', relation: 'reports to' },
      { source: 'Head – Information & Public Relations', target: 'General Manager (GM)', relation: 'reports to' },
      { source: 'Deputy Director – Finance', target: 'Director – Finance & Accounts', relation: 'reports to' },
      { source: 'Sectional Heads – Finance', target: 'Deputy Director – Finance', relation: 'reports to' },
      { source: 'Cash Office Staff', target: 'Sectional Heads – Finance', relation: 'reports to' },
      { source: 'Final Accounts Staff', target: 'Sectional Heads – Finance', relation: 'reports to' },
      { source: 'Head of Legal / State Counsel', target: 'Director – Legal Services', relation: 'reports to' },
      { source: 'State Counsels', target: 'Head of Legal / State Counsel', relation: 'reports to' },
      { source: 'Legal Administrative Staff', target: 'Head of Legal / State Counsel', relation: 'reports to' },
      { source: 'Principal Town Planning Officer (PTO)', target: 'Director – DTS / Town Planning', relation: 'reports to' },
      { source: 'Assistant Town Planning Officer (ATO)', target: 'Principal Town Planning Officer (PTO)', relation: 'reports to' },
      { source: 'Higher Executive Officer – Town Planning', target: 'Principal Town Planning Officer (PTO)', relation: 'reports to' },
      { source: 'Chief Engineer (C.Engr)', target: 'Director – Works & Maintenance', relation: 'reports to' },
      { source: 'Engineer / Electrical Section', target: 'Chief Engineer (C.Engr)', relation: 'reports to' },
      { source: 'Architect', target: 'Director – Works & Maintenance', relation: 'reports to' },
      { source: 'Sectional Head – Admin', target: 'Director – Admin & Supplies', relation: 'reports to' },
      { source: 'Audit Staff', target: 'Sectional Head – Admin', relation: 'reports to' },
      { source: 'Sectional Head – Marketing', target: 'Director – Marketing & Commercial', relation: 'reports to' },
      { source: 'Ledger / Invoice Staff', target: 'Sectional Head – Marketing', relation: 'reports to' },
      { source: 'ICT Officer', target: 'Head – ICT / PRS', relation: 'reports to' },
      { source: 'Press / Media Officer', target: 'Head – Information & Public Relations', relation: 'reports to' },
    ],
  },
};

async function main() {
  console.log('Checking evaluation exists…');
  const evaluation = await prisma.evaluation.findUnique({ where: { id: EVALUATION_ID } });
  if (!evaluation) {
    console.error(`Evaluation ${EVALUATION_ID} not found. Aborting.`);
    process.exit(1);
  }
  console.log(`Found evaluation: "${evaluation.title}"`);

  const existing = await prisma.diagnosis.findFirst({ where: { evaluationId: EVALUATION_ID } });

  if (existing) {
    console.log(`Updating existing diagnosis ${existing.id}…`);
    await prisma.diagnosis.update({
      where: { id: existing.id },
      data: {
        content: analysis,
        status: 'APPROVED',
        isAiGenerated: true,
        generatedAt: new Date(),
        version: existing.version + 1,
      },
    });
    console.log('Diagnosis updated successfully.');
  } else {
    console.log('Creating new diagnosis…');
    const created = await prisma.diagnosis.create({
      data: {
        evaluationId: EVALUATION_ID,
        content: analysis,
        status: 'APPROVED',
        isAiGenerated: true,
        generatedAt: new Date(),
      },
    });
    console.log(`Diagnosis created with id: ${created.id}`);
  }
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
