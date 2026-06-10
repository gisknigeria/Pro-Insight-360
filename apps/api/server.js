const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

if (process.env.DIRECT_DATABASE_URL && process.env.NODE_ENV !== 'production') {
  console.log('Using direct database URL for local development.');
  process.env.DATABASE_URL = process.env.DIRECT_DATABASE_URL;
}

const prisma = new PrismaClient();
const app = express();
const jwtSecret = process.env.JWT_SECRET || 'change_me_in_production';

const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const frontendUrls = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

app.use(express.json());
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    const normalizedPath = req.url.replace(/^\/api/, '') || '/';
    req.url = normalizedPath;
  }
  next();
});
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (frontendUrls.includes(origin)) return callback(null, true);
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      callback(new Error('CORS policy: origin not allowed'));
    },
    credentials: true,
  }),
);

function getJsonValue(value) {
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return value;
  }
}

function formatAnswerValue(rawValue) {
  if (rawValue === null || rawValue === undefined) return '';
  if (typeof rawValue === 'object') {
    try {
      return JSON.stringify(rawValue);
    } catch {
      return String(rawValue);
    }
  }
  return String(rawValue);
}

const geminiApiKey = process.env.GEMINI_API_KEY;
const groqApiKey = process.env.GROQ_API_KEY;
const geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const groqModel = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';

function getScoreBand(score) {
  if (score >= 85) return 'ADVANCED';
  if (score >= 70) return 'DEVELOPING';
  if (score >= 50) return 'EMERGING';
  return 'NASCENT';
}

function getGapSeverity(score) {
  if (score < 40) return 'CRITICAL';
  if (score < 55) return 'HIGH';
  if (score < 70) return 'MEDIUM';
  return 'LOW';
}

function getGapOwner(category) {
  const key = String(category || '').toLowerCase();
  if (key.includes('infrastructure') || key.includes('hardware') || key.includes('network')) {
    return 'IT / Infrastructure team';
  }
  if (key.includes('governance') || key.includes('policy') || key.includes('security') || key.includes('risk')) {
    return 'Leadership & Governance team';
  }
  if (key.includes('data')) {
    return 'Data Management team';
  }
  if (key.includes('gis') || key.includes('geospatial')) {
    return 'GIS / Geospatial team';
  }
  return 'Cross-functional leadership team';
}

function getGapImplementationAdvice(category) {
  const key = String(category || '').toLowerCase();
  if (key.includes('infrastructure')) {
    return 'Use the response data to prioritise systems upgrades, standardise architecture, and assign a technology owner for implementation.';
  }
  if (key.includes('governance')) {
    return 'Clarify accountability, update policies, and align governance with stakeholder roles and responsibilities.';
  }
  if (key.includes('data')) {
    return 'Strengthen data stewardship, improve data quality controls, and ensure measurable information management practices.';
  }
  if (key.includes('gis') || key.includes('geospatial')) {
    return 'Embed GIS capability into business workflows, train staff on spatial tools, and align technical delivery with strategic needs.';
  }
  return 'Define clear ownership, break the work into practical steps, and review progress against response-based evidence.';
}

function getGapTimeline(score) {
  if (score < 40) return 'Immediate (0-1 month)';
  if (score < 55) return 'Short term (1-3 months)';
  if (score < 70) return 'Medium term (3-6 months)';
  return 'Next quarter';
}

async function syncFormQuestions(formId, definition) {
  const parsed = getJsonValue(definition);
  const pages = Array.isArray(parsed?.pages) ? parsed.pages : [];
  const questions = pages.flatMap((page) =>
    Array.isArray(page.questions) ? page.questions : [],
  );

  for (const question of questions) {
    if (!question?.questionId) continue;

    await prisma.question.upsert({
      where: { id: question.questionId },
      create: {
        id: question.questionId,
        formId,
        externalId: question.questionId,
        type: question.type || 'text',
        label: question.label || '',
        config: question.config || {},
        isRequired: !!question.isRequired,
        position: Number(question.position) || 0,
        dimensions: Array.isArray(question.dimensions) ? question.dimensions : [],
      },
      update: {
        formId,
        externalId: question.questionId,
        type: question.type || 'text',
        label: question.label || '',
        config: question.config || {},
        isRequired: !!question.isRequired,
        position: Number(question.position) || 0,
        dimensions: Array.isArray(question.dimensions) ? question.dimensions : [],
      },
    });
  }
}

async function callGemini(prompt) {
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta2/models/${encodeURIComponent(geminiModel)}:generateText?key=${encodeURIComponent(geminiApiKey)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: { text: prompt },
      temperature: 0.2,
      maxOutputTokens: 512,
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Gemini call failed ${response.status}: ${body}`);
  }

  const json = JSON.parse(body);
  const output =
    json?.candidates?.[0]?.output ||
    json?.candidates?.[0]?.content?.[0]?.text ||
    json?.candidates?.[0]?.text ||
    json?.candidates?.[0]?.message?.content?.[0]?.text;
  return typeof output === 'string' ? output : JSON.stringify(output || '');
}

async function callGroq(prompt) {
  if (!groqApiKey) {
    throw new Error('GROQ_API_KEY is not configured.');
  }

  const url = `https://api.groq.com/v1/models/${encodeURIComponent(groqModel)}/predict`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqApiKey}`,
    },
    body: JSON.stringify({
      prompt,
      max_output_tokens: 512,
      temperature: 0.2,
    }),
  });

  const json = await response.json();
  const output =
    json?.output?.[0]?.content ||
    json?.output?.[0]?.text ||
    json?.output?.[0] ||
    json?.result;
  return typeof output === 'string' ? output : JSON.stringify(output || '');
}

function extractJsonObject(text) {
  if (!text) return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  }
}

function normalizeAnswerScore(rawValue) {
  if (rawValue === null || rawValue === undefined) return 0;

  if (typeof rawValue === 'number') {
    if (rawValue >= 0 && rawValue <= 1) return Math.round(rawValue * 100);
    return Math.max(0, Math.min(100, rawValue));
  }

  if (typeof rawValue === 'boolean') {
    return rawValue ? 100 : 0;
  }

  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim();
    if (trimmed === '') return 0;
    const percentMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*%$/);
    if (percentMatch) return Math.max(0, Math.min(100, Number(percentMatch[1])));
    const numeric = Number(trimmed.replace(/[^0-9.-]+/g, ''));
    if (!Number.isNaN(numeric)) {
      if (numeric >= 0 && numeric <= 1) return Math.round(numeric * 100);
      return Math.max(0, Math.min(100, numeric));
    }
    const yesValues = ['yes', 'y', 'true', 'available', 'present', 'complete', 'good', 'excellent'];
    const noValues = ['no', 'n', 'false', 'missing', 'not available', 'not present', 'incomplete', 'poor'];
    if (yesValues.includes(trimmed.toLowerCase())) return 90;
    if (noValues.includes(trimmed.toLowerCase())) return 10;
    return 75;
  }

  if (Array.isArray(rawValue)) {
    return rawValue.length > 0 ? 80 : 0;
  }

  if (typeof rawValue === 'object') {
    return Object.keys(rawValue || {}).length > 0 ? 80 : 0;
  }

  return 0;
}

function getQuestionCategory(question) {
  if (Array.isArray(question.dimensions) && question.dimensions.length > 0) {
    const dimension = String(question.dimensions[0]).trim();
    if (dimension) return dimension;
  }

  const label = String(question.label || '').toLowerCase();
  if (label.includes('strategy')) return 'Strategy';
  if (label.includes('governance')) return 'Governance';
  if (label.includes('infrastructure')) return 'Infrastructure';
  if (label.includes('security')) return 'Security';
  if (label.includes('data')) return 'Data Management';
  if (label.includes('gis') || label.includes('geospatial')) return 'GIS Readiness';
  return 'General';
}

function buildDiagnosisPrompt({ evaluation, scores, conflictCount, responseSummary, sampleAnswers }) {
  const categoryScores = scores
    .filter((score) => score.scoreType === 'CATEGORY')
    .map((score) => `- ${score.category}: ${score.score}`)
    .join('\n');

  const dimensionScores = scores
    .filter((score) => score.scoreType === 'DIMENSION')
    .map((score) => `- ${score.category}: ${score.score}`)
    .join('\n');

  const answerSamples = sampleAnswers.length > 0
    ? sampleAnswers.map((item) => `Question: ${item.question}\nAnswer: ${item.answer}`).join('\n\n')
    : 'No sample answers are available.';

  return `Generate a structured diagnosis for an organisational evaluation using the evaluation scores and actual form responses.

Evaluation title: ${evaluation.title}
Total forms: ${evaluation.formCount}
Total submitted responses: ${evaluation.responseCount}
Total answers captured: ${responseSummary.totalAnswers}
Average completion rate: ${responseSummary.averageCompletion}%

Sample answers:
${answerSamples}

Conflict count: ${conflictCount}

Category scores:
${categoryScores || '- None'}

Dimension scores:
${dimensionScores || '- None'}

Return only valid JSON with the properties: executiveSummary, strengths, weaknesses, opportunities, recommendations, actionPlan.

Each item in actionPlan should include: who, what, how, when.

Example:
{
  "executiveSummary": "...",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "opportunities": ["..."],
  "recommendations": ["..."],
  "actionPlan": [
    {
      "who": "Leadership team",
      "what": "Improve data governance",
      "how": "Review current processes and assign accountability",
      "when": "Within 3 months"
    }
  ]
}

Keep the diagnosis concise, grounded in the submitted form answers, and focused on practical organisational recommendations. Link each action to who owns it, how it should be delivered, and when it should be completed.`;
}

async function generateAiDiagnosis({ evaluation, scores, conflictCount, responseSummary, sampleAnswers }) {
  const prompt = buildDiagnosisPrompt({ evaluation, scores, conflictCount, responseSummary, sampleAnswers });
  let aiText = null;

  try {
    aiText = await callGemini(prompt);
  } catch (geminiError) {
    console.error('Gemini provider failed:', geminiError?.message || geminiError);
    try {
      aiText = await callGroq(prompt);
    } catch (groqError) {
      console.error('Groq provider failed:', groqError?.message || groqError);
      throw new Error('Both Gemini and Groq providers failed.');
    }
  }

  const content = extractJsonObject(aiText);
  if (!content || typeof content !== 'object') {
    throw new Error('AI provider did not return valid JSON.');
  }

  const actionPlan = Array.isArray(content.actionPlan)
    ? content.actionPlan.slice(0, 6).map((item) => ({
        who: String(item.who || item.owner || 'Unassigned'),
        what: String(item.what || item.task || ''),
        how: String(item.how || ''),
        when: String(item.when || ''),
      }))
    : [];

  return {
    executiveSummary: String(content.executiveSummary || content.summary || 'AI diagnosis generated.'),
    strengths: Array.isArray(content.strengths) ? content.strengths.slice(0, 5).map(String) : [],
    weaknesses: Array.isArray(content.weaknesses) ? content.weaknesses.slice(0, 5).map(String) : [],
    opportunities: Array.isArray(content.opportunities) ? content.opportunities.slice(0, 5).map(String) : [],
    recommendations: Array.isArray(content.recommendations) ? content.recommendations.slice(0, 8).map(String) : [],
    actionPlan,
  };
}

function authenticate(req, res, next) {
  if (req.path.match(/^\/forms\/[^/]+\/definition$/)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token missing.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

function roleGuard(allowedRoles) {
  return (req, res, next) => {
    try {
      const role = req.user?.role;
      if (!role || (role !== 'SUPER_ADMIN' && !allowedRoles.includes(role))) {
        return res.status(403).json({ message: 'Forbidden: insufficient role.' });
      }
      next();
    } catch (err) {
      console.error('Role guard error:', err);
      return res.status(500).json({ message: 'Role guard failed.' });
    }
  };
}

async function isAssignedToEvaluation(user, evaluationId) {
  if (!user) return false;
  if (['SUPER_ADMIN', 'CONSULTANT', 'CLIENT_ADMIN', 'ADMIN'].includes(user.role)) {
    return true;
  }

  const assignment = await prisma.formAssignment.findFirst({
    where: {
      respondentId: user.sub,
      form: { evaluationId },
    },
    select: { id: true },
  });

  return Boolean(assignment);
}

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ status: 'error' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(403).json({ message: 'Your account is temporarily locked. Please try again later.' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      const failedLoginCount = (user.failedLoginCount || 0) + 1;
      const isLocked = failedLoginCount >= 3;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount,
          lockedUntil: isLocked ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });

      const message = isLocked
        ? 'Your account has been temporarily locked. Please try again after 15 minutes.'
        : 'Email or password is incorrect.';
      return res.status(isLocked ? 403 : 401).json({ message });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' },
    );

    res.json({ accessToken: token, requiresMfa: !!user.mfaEnabled });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed.', error: error.message });
  }
});

app.post('/auth/setup', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        setupToken: token,
        setupTokenExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Setup token is invalid or expired.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        isActive: true,
        setupToken: null,
        setupTokenExpiresAt: null,
      },
    });

    res.json({ message: 'Account setup complete.' });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ message: 'Account setup failed.', error: error.message });
  }
});

async function getAnonymousRespondentId() {
  const email = process.env.PUBLIC_RESPONDENT_EMAIL || 'anonymous@public.local';
  let user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    return user.id;
  }

  const passwordHash = await bcrypt.hash('anonymous-public-response', 10);
  user = await prisma.user.create({
    data: {
      email,
      name: 'Public respondent',
      passwordHash,
      role: 'RESPONDENT',
      isActive: true,
    },
  });

  return user.id;
}

function getOptionalAuthenticatedUserId(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, jwtSecret);
    return payload.sub || null;
  } catch {
    return null;
  }
}

app.post('/responses/public/submit', async (req, res) => {
  try {
    const { formId, answers } = req.body;
    if (!formId || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Form ID and answers are required.' });
    }

    const respondentId =
      getOptionalAuthenticatedUserId(req) || (await getAnonymousRespondentId());

    await createOrUpdateResponse(formId, respondentId, 'SUBMITTED', answers);
    res.json({ message: 'Response submitted.' });
  } catch (error) {
    console.error('Submit public response failed:', error);
    res.status(500).json({ message: 'Unable to submit response.' });
  }
});

app.get('/forms/:formId/definition', async (req, res) => {
  try {
    const { formId } = req.params;
    const form = await prisma.form.findUnique({ where: { id: formId } });
    if (!form) {
      return res.status(404).json({ message: 'Form not found.' });
    }
    res.json(getJsonValue(form.definition));
  } catch (error) {
    console.error('Fetch form definition failed:', error);
    res.status(500).json({ message: 'Unable to load form definition.' });
  }
});

app.use(authenticate);

app.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: { organisation: true },
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name || user.email,
      role: user.role,
      status: !user.isActive
        ? 'INACTIVE'
        : user.lockedUntil && user.lockedUntil > new Date()
          ? 'LOCKED'
          : 'ACTIVE',
      organisation: user.organisation
        ? { id: user.organisation.id, name: user.organisation.name }
        : { id: '', name: '' },
      department: user.department || null,
      createdAt: user.createdAt,
      lastLogin: null,
    });
  } catch (error) {
    console.error('Fetch user failed:', error);
    res.status(500).json({ message: 'Unable to fetch user.' });
  }
});

app.put('/users/:id', roleGuard(['SUPER_ADMIN', 'CONSULTANT', 'CLIENT_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, isActive, department, organisationId } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: name !== undefined ? String(name).trim() : user.name,
        role: role || user.role,
        isActive: isActive !== undefined ? Boolean(isActive) : user.isActive,
        department: department !== undefined ? String(department || '').trim() : user.department,
        organisationId: organisationId !== undefined ? (organisationId || null) : user.organisationId,
      },
    });

    const organisation = await prisma.organisation.findUnique({ where: { id: updated.organisationId || '' } });

    res.json({
      id: updated.id,
      email: updated.email,
      name: updated.name || updated.email,
      role: updated.role,
      status: !updated.isActive
        ? 'INACTIVE'
        : updated.lockedUntil && updated.lockedUntil > new Date()
          ? 'LOCKED'
          : 'ACTIVE',
      organisation: organisation
        ? { id: organisation.id, name: organisation.name }
        : { id: '', name: '' },
      department: updated.department || null,
      createdAt: updated.createdAt,
      lastLogin: null,
    });
  } catch (error) {
    console.error('Update user failed:', error);
    res.status(500).json({ message: 'Unable to update user.' });
  }
});

app.delete('/users/:id', roleGuard(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const templateIds = (await prisma.template.findMany({ where: { createdById: id }, select: { id: true } })).map((template) => template.id);

    await prisma.$transaction([
      prisma.conflict.updateMany({ where: { resolvedById: id }, data: { resolvedById: null } }),
      prisma.diagnosis.updateMany({ where: { reviewedById: id }, data: { reviewedById: null } }),
      prisma.formAssignment.deleteMany({ where: { respondentId: id } }),
      prisma.response.deleteMany({ where: { respondentId: id } }),
      prisma.evaluationConsultant.deleteMany({ where: { consultantId: id } }),
      prisma.sharedLink.deleteMany({ where: { createdById: id } }),
      prisma.document.deleteMany({ where: { uploadedById: id } }),
      prisma.report.deleteMany({ where: { generatedById: id } }),
      prisma.auditLog.deleteMany({ where: { userId: id } }),
      prisma.form.deleteMany({ where: { createdById: id } }),
      prisma.evaluation.deleteMany({ where: { createdById: id } }),
      prisma.scoringWeight.deleteMany({ where: { updatedById: id } }),
      prisma.form.updateMany({ where: { templateId: { in: templateIds } }, data: { templateId: null, templateVersion: null } }),
      prisma.template.deleteMany({ where: { createdById: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Delete user failed:', error);
    res.status(400).json({ message: 'Unable to delete user. Remove linked records first.' });
  }
});

app.post('/organisations', async (req, res) => {
  try {
    const { name, sector, description } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: 'Organisation name is required.' });
    }

    const organisation = await prisma.organisation.create({
      data: {
        name: name.trim(),
        sector: sector?.trim() || null,
      },
    });

    res.status(201).json({
      id: organisation.id,
      name: organisation.name,
      sector: organisation.sector,
      description: description?.trim() || undefined,
    });
  } catch (error) {
    console.error('Create organisation failed:', error);
    res.status(500).json({ message: 'Unable to create organisation.' });
  }
});

app.delete('/organisations/:id', roleGuard(['SUPER_ADMIN', 'CONSULTANT', 'CLIENT_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const organisation = await prisma.organisation.findUnique({
      where: { id },
      include: { users: true, evaluations: true },
    });
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found.' });
    }

    if (organisation.users.length > 0 || organisation.evaluations.length > 0) {
      return res.status(400).json({ message: 'Cannot delete organisation with linked users or evaluations.' });
    }

    await prisma.organisation.delete({ where: { id } });
    res.json({ message: 'Organisation deleted successfully.' });
  } catch (error) {
    console.error('Delete organisation failed:', error);
    res.status(500).json({ message: 'Unable to delete organisation.' });
  }
});

app.post('/organograms', async (req, res) => {
  try {
    const { evaluationId, rawData } = req.body;
    if (!evaluationId) {
      return res.status(400).json({ message: 'Evaluation is required.' });
    }

    const nodes = Array.isArray(rawData?.nodes) ? rawData.nodes : [];
    const departments = Array.isArray(rawData?.departments)
      ? rawData.departments
      : Array.from(new Set(nodes.map((node) => node.department).filter(Boolean)));

    const organogram = await prisma.organogram.create({
      data: {
        evaluationId,
        rawData: { nodes, departments },
        renderStatus: 'RENDERED',
      },
    });

    res.status(201).json({
      id: organogram.id,
      evaluationId: organogram.evaluationId,
      createdAt: organogram.createdAt,
      status: organogram.renderStatus,
    });
  } catch (error) {
    console.error('Create organogram failed:', error);
    res.status(500).json({ message: 'Unable to create organogram.' });
  }
});

app.post('/users', roleGuard(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { name, email, role, organisationId, department } = req.body;
    if (!email?.trim()) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const normalizedRole = ['SUPER_ADMIN', 'CONSULTANT', 'CLIENT_ADMIN', 'HOD', 'RESPONDENT'].includes(role)
      ? role
      : 'RESPONDENT';

    const existingUser = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    const tempPassword = crypto.randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const setupToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        name: name?.trim() || email.trim(),
        role: normalizedRole,
        organisationId: organisationId || null,
        department: department?.trim() || null,
        passwordHash,
        setupToken,
        setupTokenExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        isActive: true,
      },
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      setupToken: user.setupToken,
      temporaryPassword: tempPassword,
    });
  } catch (error) {
    console.error('Create user failed:', error);
    res.status(500).json({ message: 'Unable to create user.' });
  }
});

app.post('/users/:id/reset-password', roleGuard(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const tempPassword = crypto.randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const setupToken = crypto.randomBytes(32).toString('hex');

    await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        setupToken,
        setupTokenExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        isActive: true,
      },
    });

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      setupToken,
      temporaryPassword: tempPassword,
    });
  } catch (error) {
    console.error('Reset password failed:', error);
    res.status(500).json({ message: 'Unable to reset password.' });
  }
});

app.post('/contacts', async (req, res) => {
  try {
    const { name, email, role, department, organisationId } = req.body;
    if (!email?.trim()) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const normalizedRole = ['CONSULTANT', 'CLIENT_ADMIN', 'HOD', 'RESPONDENT'].includes(role)
      ? role
      : 'RESPONDENT';

    const existingUser = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existingUser) {
      return res.status(409).json({ message: 'A contact with this email already exists.' });
    }

    const tempPassword = crypto.randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const setupToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        name: name?.trim() || email.trim(),
        role: normalizedRole,
        organisationId: organisationId || null,
        department: department?.trim() || null,
        passwordHash,
        setupToken,
        setupTokenExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        isActive: true,
      },
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      setupToken: user.setupToken,
    });
  } catch (error) {
    console.error('Create contact failed:', error);
    res.status(500).json({ message: 'Unable to create contact.' });
  }
});

app.post('/departments', async (req, res) => {
  try {
    const { name, lead, description, organisationId } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: 'Department name is required.' });
    }

    const email = `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.')}@pro-insight.local`;
    const tempPassword = crypto.randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const setupToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        email,
        name: lead?.trim() || name.trim(),
        role: 'HOD',
        organisationId: organisationId || null,
        department: name.trim(),
        passwordHash,
        setupToken,
        setupTokenExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        isActive: true,
      },
    });

    res.status(201).json({
      id: user.id,
      name: name.trim(),
      lead: user.name,
      description: description?.trim() || undefined,
      setupToken: user.setupToken,
    });
  } catch (error) {
    console.error('Create department failed:', error);
    res.status(500).json({ message: 'Unable to create department.' });
  }
});

app.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { organisation: true },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name || user.email,
      role: user.role,
      status: !user.isActive
        ? 'INACTIVE'
        : user.lockedUntil && user.lockedUntil > new Date()
          ? 'LOCKED'
          : 'ACTIVE',
      organisation: user.organisation
        ? { id: user.organisation.id, name: user.organisation.name }
        : { id: '', name: '' },
      createdAt: user.createdAt,
      lastLogin: null,
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Fetch users failed:', error);
    res.status(500).json({ message: 'Unable to fetch users.' });
  }
});

app.get('/forms', async (req, res) => {
  try {
    const forms = await prisma.form.findMany({
      include: { evaluation: true },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = forms.map((form) => {
      const definition = getJsonValue(form.definition);
      const description = definition?.description || '';
      const pages = Array.isArray(definition?.pages) ? definition.pages : [];
      const questionCount = pages.reduce((count, page) => count + (Array.isArray(page.questions) ? page.questions.length : 0), 0);

      return {
        id: form.id,
        title: form.title,
        description,
        status: form.status,
        accessMode: definition?.accessMode || 'REGISTERED',
        questionCount,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
      };
    });

    res.json(mapped);
  } catch (error) {
    console.error('Fetch forms failed:', error);
    res.status(500).json({ message: 'Unable to fetch forms.' });
  }
});

app.post('/forms', roleGuard(['SUPER_ADMIN', 'CONSULTANT', 'CLIENT_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { evaluationId, title, definition, accessMode } = req.body;
    if (!evaluationId || !title) {
      return res.status(400).json({ message: 'Evaluation and title are required.' });
    }

    const evaluation = await prisma.evaluation.findUnique({ where: { id: evaluationId } });
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found.' });
    }

    const formDefinition = definition || {
      formId: `form-${Date.now()}`,
      title: title.trim(),
      description: '',
      pages: [{ pageId: 'page-1', title: 'Page 1', questions: [] }],
      conditionalLogic: [],
      version: 1,
      accessMode: accessMode || 'REGISTERED',
    };

    if (!formDefinition.accessMode) {
      formDefinition.accessMode = accessMode || 'REGISTERED';
    }

    const form = await prisma.form.create({
      data: {
        evaluationId,
        title: title.trim(),
        definition: formDefinition,
        status: 'DRAFT',
        createdById: req.user.sub,
      },
    });

    await syncFormQuestions(form.id, formDefinition);

    res.status(201).json({
      id: form.id,
      title: form.title,
      status: form.status,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
    });
  } catch (error) {
    console.error('Create form failed:', error);
    res.status(500).json({ message: 'Unable to create form.' });
  }
});

app.put('/forms/:formId', roleGuard(['SUPER_ADMIN', 'CONSULTANT', 'CLIENT_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { formId } = req.params;
    const { title, definition, status, accessMode } = req.body;

    const form = await prisma.form.findUnique({ where: { id: formId } });
    if (!form) {
      return res.status(404).json({ message: 'Form not found.' });
    }

    const existingDefinition = getJsonValue(form.definition) || {};
    const mergedDefinition = typeof definition === 'object' && definition !== null
      ? { ...existingDefinition, ...definition }
      : existingDefinition;
    const finalDefinition = accessMode
      ? { ...mergedDefinition, accessMode }
      : mergedDefinition;

    const updated = await prisma.form.update({
      where: { id: formId },
      data: {
        title: title?.trim() || form.title,
        definition: finalDefinition,
        status: status || form.status,
        updatedAt: new Date(),
      },
    });

    await syncFormQuestions(formId, finalDefinition);

    res.json({
      id: updated.id,
      title: updated.title,
      status: updated.status,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error('Update form failed:', error);
    res.status(500).json({ message: 'Unable to update form.' });
  }
});

app.delete('/forms/:formId', roleGuard(['SUPER_ADMIN', 'CONSULTANT', 'CLIENT_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { formId } = req.params;
    const form = await prisma.form.findUnique({ where: { id: formId } });
    if (!form) {
      return res.status(404).json({ message: 'Form not found.' });
    }

    await prisma.form.delete({ where: { id: formId } });
    res.json({ message: 'Form deleted successfully.' });
  } catch (error) {
    console.error('Delete form failed:', error);
    res.status(500).json({ message: 'Unable to delete form.' });
  }
});

app.get('/settings', async (req, res) => {
  try {
    const settings = {
      appName: process.env.APP_NAME || 'Pro-Insight 360',
      features: {},
      frontendUrls: frontendUrls,
    };
    res.json(settings);
  } catch (error) {
    console.error('Fetch settings failed:', error);
    res.status(500).json({ message: 'Unable to fetch settings.' });
  }
});

app.get('/form-assignments/me', async (req, res) => {
  try {
    const assignments = await prisma.formAssignment.findMany({
      where: { respondentId: req.user.sub },
      include: {
        form: {
          include: { evaluation: true },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    res.json(assignments.map((assignment) => ({
      id: assignment.id,
      formId: assignment.formId,
      formTitle: assignment.form.title,
      evaluationTitle: assignment.form.evaluation?.title || 'Unknown evaluation',
      deadline: assignment.form.evaluation?.startDate ? assignment.form.evaluation.startDate.toISOString() : null,
      urgent: false,
      assignedAt: assignment.assignedAt,
    })));
  } catch (error) {
    console.error('Fetch assigned forms failed:', error);
    res.status(500).json({ message: 'Unable to fetch assigned forms.' });
  }
});

app.post('/form-assignments', roleGuard(['SUPER_ADMIN', 'CONSULTANT', 'CLIENT_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { formId, respondentId } = req.body;
    if (!formId || !respondentId) {
      return res.status(400).json({ message: 'Form id and respondent id are required.' });
    }

    const form = await prisma.form.findUnique({ where: { id: formId } });
    const respondent = await prisma.user.findUnique({ where: { id: respondentId } });
    if (!form || !respondent) {
      return res.status(404).json({ message: 'Form or respondent not found.' });
    }

    const assignment = await prisma.formAssignment.upsert({
      where: { formId_respondentId: { formId, respondentId } },
      create: { formId, respondentId, notifiedAt: new Date() },
      update: { notifiedAt: new Date() },
    });

    res.status(201).json({
      id: assignment.id,
      formId: assignment.formId,
      respondentId: assignment.respondentId,
      assignedAt: assignment.assignedAt,
      notifiedAt: assignment.notifiedAt,
    });
  } catch (error) {
    console.error('Create form assignment failed:', error);
    res.status(500).json({ message: 'Unable to assign form.' });
  }
});

app.post('/storage/upload-url', authenticate, async (req, res) => {
  try {
    const { formId, questionId, filename, contentType, uploadType, fileSize } = req.body;
    if (!formId || !questionId || !filename || !contentType) {
      return res.status(400).json({ message: 'Form ID, question ID, filename, and content type are required.' });
    }

    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${crypto.randomUUID()}-${Date.now()}-${sanitizedFilename}`;
    const uploadUrl = `${req.protocol}://${req.get('host')}/storage/upload/${encodeURIComponent(key)}`;
    const publicUrl = `${req.protocol}://${req.get('host')}/storage/files/${encodeURIComponent(key)}`;

    res.json({ uploadUrl, key, publicUrl });
  } catch (error) {
    console.error('Create upload URL failed:', error);
    res.status(500).json({ message: 'Unable to create upload URL.' });
  }
});

app.put('/storage/upload/:key(*)', express.raw({ type: '*/*', limit: '50mb' }), async (req, res) => {
  try {
    const { key } = req.params;
    if (!key) {
      return res.status(400).json({ message: 'Storage key is required.' });
    }

    const buffer = req.body;
    if (!Buffer.isBuffer(buffer)) {
      return res.status(400).json({ message: 'File upload body must be binary.' });
    }

    const filePath = path.join(uploadsDir, key);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, buffer);
    res.json({ message: 'Upload successful.' });
  } catch (error) {
    console.error('Upload file failed:', error);
    res.status(500).json({ message: 'Unable to upload file.' });
  }
});

app.get('/storage/files/:key(*)', async (req, res) => {
  try {
    const { key } = req.params;
    if (!key) {
      return res.status(400).json({ message: 'Storage key is required.' });
    }

    const filePath = path.join(uploadsDir, key);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found.' });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Serve file failed:', error);
    res.status(500).json({ message: 'Unable to serve file.' });
  }
});

app.get('/responses', async (req, res) => {
  try {
    const query = req.user.role === 'RESPONDENT'
      ? { respondentId: req.user.sub }
      : {};

    const responses = await prisma.response.findMany({
      where: query,
      include: {
        form: { include: { evaluation: true } },
        respondent: true,
        answers: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = responses.map((response) => {
      const questionCount = response.form?.definition
        ? (Array.isArray(getJsonValue(response.form.definition)?.pages)
          ? getJsonValue(response.form.definition).pages.reduce(
            (count, page) => count + (Array.isArray(page.questions) ? page.questions.length : 0),
            0,
          )
          : 0)
        : 0;
      const completionPercentage = questionCount > 0
        ? Math.round((response.answers.length / questionCount) * 100)
        : 0;

      return {
        id: response.id,
        form: { id: response.form.id, title: response.form.title },
        respondent: {
          id: response.respondent.id,
          name: response.respondent.name || response.respondent.email,
          email: response.respondent.email,
        },
        status: response.status,
        completionPercentage,
        submittedAt: response.submittedAt,
        createdAt: response.createdAt,
      };
    });

    res.json(mapped);
  } catch (error) {
    console.error('Fetch responses failed:', error);
    res.status(500).json({ message: 'Unable to fetch responses.' });
  }
});

app.get('/responses/draft/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    const draft = await prisma.response.findFirst({
      where: {
        formId,
        respondentId: req.user.sub,
        status: 'DRAFT',
      },
      include: { answers: true },
    });

    if (!draft) {
      return res.json(null);
    }

    res.json({
      answers: draft.answers.map((answer) => ({
        questionId: answer.questionId,
        value: getJsonValue(answer.value),
      })),
    });
  } catch (error) {
    console.error('Fetch draft response failed:', error);
    res.status(500).json({ message: 'Unable to fetch draft response.' });
  }
});

async function createOrUpdateResponse(formId, respondentId, status, answers) {
  let response = await prisma.response.findFirst({
    where: { formId, respondentId, status: 'DRAFT' },
  });

  if (!response) {
    response = await prisma.response.create({
      data: {
        formId,
        respondentId,
        status: 'DRAFT',
        rawCacheJson: JSON.stringify({ answers }),
      },
    });
  } else {
    response = await prisma.response.update({
      where: { id: response.id },
      data: {
        rawCacheJson: JSON.stringify({ answers }),
      },
    });
  }

  await prisma.answer.deleteMany({ where: { responseId: response.id } });
  for (const answer of answers) {
    await prisma.answer.create({
      data: {
        responseId: response.id,
        questionId: answer.questionId,
        value: answer.value,
      },
    });
  }

  const data = {
    rawCacheJson: JSON.stringify({ answers }),
  };
  if (status === 'SUBMITTED') {
    data.status = 'SUBMITTED';
    data.submittedAt = new Date();
  }

  return prisma.response.update({ where: { id: response.id }, data });
}

app.post('/responses/draft', async (req, res) => {
  try {
    const { formId, answers } = req.body;
    if (!formId || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Form ID and answers are required.' });
    }

    await createOrUpdateResponse(formId, req.user.sub, 'DRAFT', answers);
    res.json({ message: 'Draft saved.' });
  } catch (error) {
    console.error('Save draft failed:', error);
    res.status(500).json({ message: 'Unable to save draft.' });
  }
});

app.post('/responses/submit', async (req, res) => {
  try {
    const { formId, answers } = req.body;
    if (!formId || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Form ID and answers are required.' });
    }

    await createOrUpdateResponse(formId, req.user.sub, 'SUBMITTED', answers);
    res.json({ message: 'Response submitted.' });
  } catch (error) {
    console.error('Submit response failed:', error);
    res.status(500).json({ message: 'Unable to submit response.' });
  }
});

app.get('/organisations', async (req, res) => {
  try {
    const organisations = await prisma.organisation.findMany({
      include: { users: true, evaluations: true },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = organisations.map((org) => ({
      id: org.id,
      name: org.name,
      description: org.sector ? `${org.sector} organisation` : undefined,
      sector: org.sector,
      country: undefined,
      status: org.archivedAt ? 'ARCHIVED' : 'ACTIVE',
      createdAt: org.createdAt,
      _count: {
        users: org.users.length,
        evaluations: org.evaluations.length,
      },
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Fetch organisations failed:', error);
    res.status(500).json({ message: 'Unable to fetch organisations.' });
  }
});

app.get('/departments', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { department: { not: null } },
      include: { organisation: true },
    });

    const groups = new Map();
    for (const user of users) {
      const key = user.department.trim();
      if (!groups.has(key)) {
        groups.set(key, {
          id: `${key}-${user.organisationId}`,
          name: key,
          description: '',
          organisation: { id: user.organisation?.id, name: user.organisation?.name || '' },
          headOfDepartment: user.role === 'HOD' ? { name: user.name || user.email, email: user.email } : null,
          staffCount: 0,
          evaluationProgress: 0,
          digitalReadinessScore: undefined,
          gisReadinessScore: undefined,
          createdAt: user.createdAt,
        });
      }
      const dept = groups.get(key);
      dept.staffCount += 1;
    }

    res.json(Array.from(groups.values()));
  } catch (error) {
    console.error('Fetch departments failed:', error);
    res.status(500).json({ message: 'Unable to fetch departments.' });
  }
});

app.get('/contacts', async (req, res) => {
  try {
    const respondents = await prisma.user.findMany({
      where: { role: { in: ['RESPONDENT', 'HOD', 'CLIENT_ADMIN', 'CONSULTANT'] } },
      include: {
        organisation: true,
        formAssignments: true,
        responses: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = respondents.map((user) => ({
      id: user.id,
      name: user.name || user.email,
      email: user.email,
      phone: undefined,
      department: user.department || undefined,
      title: undefined,
      organisation: user.organisation ? { id: user.organisation.id, name: user.organisation.name } : { id: '', name: '' },
      status: user.isActive ? 'ACTIVE' : 'INACTIVE',
      formsAssigned: user.formAssignments.length,
      responsesSubmitted: user.responses.filter((r) => r.status === 'SUBMITTED').length,
      createdAt: user.createdAt,
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Fetch contacts failed:', error);
    res.status(500).json({ message: 'Unable to fetch contacts.' });
  }
});

app.get('/notifications', async (req, res) => {
  try {
    const recentResponses = await prisma.response.findMany({
      where: { status: 'SUBMITTED' },
      take: 5,
      orderBy: { submittedAt: 'desc' },
      include: { respondent: true, form: { include: { evaluation: true } } },
    });

    const evaluations = await prisma.evaluation.findMany({
      where: { status: 'ACTIVE' },
      take: 3,
      orderBy: { createdAt: 'desc' },
    });

    const notifications = [
      ...recentResponses.map((response) => ({
        id: response.id,
        type: 'RESPONSE_SUBMITTED',
        title: 'Response submitted',
        message: `${response.respondent.name || response.respondent.email} submitted ${response.form.title}.`,
        read: false,
        createdAt: response.submittedAt || response.createdAt,
        actionUrl: `/responses`,
      })),
      ...evaluations.map((evaluation) => ({
        id: evaluation.id,
        type: 'EVALUATION_ACTIVATED',
        title: 'Evaluation activated',
        message: `${evaluation.title} is now active and ready for responses.`,
        read: false,
        createdAt: evaluation.createdAt,
        actionUrl: `/evaluations`,
      })),
    ];

    res.json(notifications.slice(0, 8));
  } catch (error) {
    console.error('Fetch notifications failed:', error);
    res.status(500).json({ message: 'Unable to fetch notifications.' });
  }
});

app.patch('/notifications/mark-all-read', async (req, res) => {
  try {
    res.json({ message: 'Notifications marked as read.' });
  } catch (error) {
    console.error('Mark notifications read failed:', error);
    res.status(500).json({ message: 'Unable to update notifications.' });
  }
});

app.get('/reports', async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      include: { evaluation: true },
      orderBy: { generatedAt: 'desc' },
    });

    const mapped = reports.map((report) => ({
      id: report.id,
      evaluation: { id: report.evaluation.id, title: report.evaluation.title },
      format: report.format,
      status: report.storageKey ? 'READY' : 'PENDING',
      sections: getJsonValue(report.includedSections),
      createdAt: report.generatedAt,
      url: report.storageKey ? `/files/${report.storageKey}` : undefined,
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Fetch reports failed:', error);
    res.status(500).json({ message: 'Unable to fetch reports.' });
  }
});

app.get('/recommendations', async (req, res) => {
  try {
    const recommendations = await prisma.recommendation.findMany({
      include: { diagnosis: { include: { evaluation: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = recommendations.map((rec) => ({
      id: rec.id,
      title: rec.title,
      description: rec.description,
      priority: rec.priority,
      dimension: rec.dimension || 'General',
      effort: rec.effort || 'MEDIUM',
      expectedBenefit: rec.expectedBenefit || 'Improved performance and insight.',
      timeline: rec.timeline || '3-6 months',
      status: 'PENDING',
      evaluation: { id: rec.diagnosis.evaluation.id, title: rec.diagnosis.evaluation.title },
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Fetch recommendations failed:', error);
    res.status(500).json({ message: 'Unable to fetch recommendations.' });
  }
});

app.get('/organograms', async (req, res) => {
  try {
    const organograms = await prisma.organogram.findMany({
      include: { evaluation: true },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = organograms.map((item) => {
      const rawData = getJsonValue(item.rawData) || {};
      const nodes = Array.isArray(rawData.nodes) ? rawData.nodes : [];
      const departments = Array.isArray(rawData.departments) ? rawData.departments : [];
      return {
        id: item.id,
        title: `${item.evaluation.title} Organogram`,
        evaluation: { id: item.evaluation.id, title: item.evaluation.title },
        nodeCount: nodes.length,
        departmentCount: departments.length,
        status: item.renderStatus === 'RENDERED' ? 'PUBLISHED' : 'DRAFT',
        cycleDetected: item.renderStatus === 'ERROR',
        createdAt: item.createdAt,
      };
    });

    res.json(mapped);
  } catch (error) {
    console.error('Fetch organograms failed:', error);
    res.status(500).json({ message: 'Unable to fetch organograms.' });
  }
});

app.get('/workflow-maps', async (req, res) => {
  try {
    const maps = await prisma.workflowMap.findMany({
      include: { evaluation: true },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = maps.map((map) => {
      const nodes = Array.isArray(getJsonValue(map.nodes)) ? getJsonValue(map.nodes) : [];
      const inefficientNodes = Array.isArray(map.inefficientNodes) ? map.inefficientNodes : [];
      return {
        id: map.id,
        title: map.title,
        description: undefined,
        evaluation: { id: map.evaluation.id, title: map.evaluation.title },
        status: nodes.length === 0 ? 'DRAFT' : 'ACTIVE',
        nodeCount: nodes.length,
        inefficientNodes: inefficientNodes.length,
        improvementSavings: undefined,
        createdAt: map.createdAt,
      };
    });

    res.json(mapped);
  } catch (error) {
    console.error('Fetch workflow maps failed:', error);
    res.status(500).json({ message: 'Unable to fetch workflow maps.' });
  }
});

app.get('/diagnoses', async (req, res) => {
  try {
    const diagnoses = await prisma.diagnosis.findMany({
      include: { evaluation: true, reviewedBy: true },
      orderBy: { generatedAt: 'desc' },
    });

    const mapped = diagnoses.map((diagnosis) => {
      const content = getJsonValue(diagnosis.content) || {};
      return {
        id: diagnosis.id,
        evaluation: { id: diagnosis.evaluation.id, title: diagnosis.evaluation.title },
        status: diagnosis.status,
        isAiGenerated: diagnosis.isAiGenerated,
        sections: {
          executiveSummary: content.executiveSummary || 'No summary available.',
          strengths: content.strengths || [],
          weaknesses: content.weaknesses || [],
          opportunities: content.opportunities || [],
          recommendations: content.recommendations || [],
          actionPlan: Array.isArray(content.actionPlan) ? content.actionPlan : [],
        },
        approvedBy: diagnosis.reviewedBy ? { name: diagnosis.reviewedBy.name || diagnosis.reviewedBy.email } : undefined,
        createdAt: diagnosis.generatedAt,
      };
    });

    res.json(mapped);
  } catch (error) {
    console.error('Fetch diagnoses failed:', error);
    res.status(500).json({ message: 'Unable to fetch diagnoses.' });
  }
});

app.post('/diagnoses/publish', authenticate, roleGuard(['SUPER_ADMIN', 'CONSULTANT', 'CLIENT_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { recipientId, analysis } = req.body;
    if (!recipientId || !analysis || typeof analysis !== 'object') {
      return res.status(400).json({ message: 'recipientId and analysis are required.' });
    }

    const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found.' });
    }

    if (recipient.role !== 'CLIENT_ADMIN') {
      return res.status(400).json({ message: 'Selected recipient must be a client admin.' });
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user.sub,
        action: 'DIAGNOSIS_PUBLISHED',
        resourceType: 'Diagnosis',
        resourceId: null,
        metadata: {
          recipientId,
          recipientEmail: recipient.email,
          summary: String(analysis.executiveSummary || ''),
          publishedAt: new Date().toISOString(),
        },
      },
    });

    res.json({ message: `Analysis published to ${recipient.name || recipient.email}.` });
  } catch (error) {
    console.error('Publish diagnosis failed:', error);
    res.status(500).json({ message: 'Unable to publish analysis.' });
  }
});

app.get('/ai-status', authenticate, async (req, res) => {
  try {
    const providers = [];
    if (geminiApiKey) providers.push('Gemini');
    if (groqApiKey) providers.push('Groq');

    res.json({
      configuredProviders: providers,
      defaultProvider: providers[0] || 'None',
      geminiEnabled: Boolean(geminiApiKey),
      groqEnabled: Boolean(groqApiKey),
      available: providers.length > 0,
    });
  } catch (error) {
    console.error('Fetch AI status failed:', error);
    res.status(500).json({ message: 'Unable to fetch AI status.' });
  }
});

app.get('/gap-analysis', async (req, res) => {
  try {
    const lowScores = await prisma.scoreResult.findMany({
      where: { score: { lt: 70 } },
      include: { evaluation: true },
      orderBy: { score: 'asc' },
      take: 8,
    });

    const mapped = lowScores.map((score) => {
      const categoryName = score.category || score.scoreType;
      return {
        id: score.id,
        category: categoryName,
        description: `The ${categoryName.toLowerCase()} score is below target. Review responses and improve the assessment in this area.`,
        severity: getGapSeverity(Number(score.score)),
        affectedDepartments: [],
        evidence: [
          `Recorded score ${score.score} for ${categoryName}.`,
          `This evaluation score is below the desired threshold and may reflect response gaps in the relevant area.`,
        ],
        recommendedAction: `Improve the ${categoryName.toLowerCase()} dimension through training, process updates, and clearer accountability.`,
        who: getGapOwner(categoryName),
        how: getGapImplementationAdvice(categoryName),
        when: getGapTimeline(Number(score.score)),
        evaluation: { id: score.evaluation.id, title: score.evaluation.title },
        createdAt: score.computedAt,
      };
    });

    res.json(mapped);
  } catch (error) {
    console.error('Fetch gap analysis failed:', error);
    res.status(500).json({ message: 'Unable to fetch gap analysis.' });
  }
});

app.get('/technical-skills', async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error('Fetch technical skills failed:', error);
    res.status(500).json({ message: 'Unable to fetch technical skills.' });
  }
});

app.get('/gis-readiness', async (req, res) => {
  try {
    const scores = await prisma.scoreResult.findMany({
      where: { scoreType: 'GIS_READINESS' },
      include: { evaluation: true },
      orderBy: { computedAt: 'desc' },
    });

    const mapped = await Promise.all(scores.map(async (score) => {
      const dimensions = await prisma.scoreResult.findMany({
        where: { evaluationId: score.evaluationId, scoreType: 'DIMENSION' },
      });
      const dims = { who: 0, what: 0, how: 0, when: 0 };
      for (const item of dimensions) {
        const value = Number(item.score);
        const key = String(item.category || '').toLowerCase();
        if (key.includes('who')) dims.who = value;
        if (key.includes('what')) dims.what = value;
        if (key.includes('how')) dims.how = value;
        if (key.includes('when')) dims.when = value;
      }
      return {
        id: score.id,
        evaluation: { id: score.evaluation.id, title: score.evaluation.title },
        score: Number(score.score),
        band: score.band || getScoreBand(Number(score.score)),
        dimensions: dims,
        champions: 0,
        createdAt: score.computedAt,
      };
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Fetch GIS readiness failed:', error);
    res.status(500).json({ message: 'Unable to fetch GIS readiness scores.' });
  }
});

app.get('/digital-readiness', async (req, res) => {
  try {
    const scores = await prisma.scoreResult.findMany({
      where: { scoreType: 'DIGITAL_READINESS' },
      include: { evaluation: true },
      orderBy: { computedAt: 'desc' },
    });

    const mapped = await Promise.all(scores.map(async (score) => {
      const categories = await prisma.scoreResult.findMany({
        where: { evaluationId: score.evaluationId, scoreType: 'CATEGORY' },
      });
      const categoriesMap = categories.reduce((acc, item) => {
        acc[item.category || 'Unknown'] = Number(item.score);
        return acc;
      }, {});
      return {
        id: score.id,
        evaluation: { id: score.evaluation.id, title: score.evaluation.title },
        score: Number(score.score),
        band: score.band || getScoreBand(Number(score.score)),
        categories: categoriesMap,
        champions: 0,
        createdAt: score.computedAt,
      };
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Fetch digital readiness failed:', error);
    res.status(500).json({ message: 'Unable to fetch digital readiness scores.' });
  }
});

app.get('/evaluations', async (req, res) => {
  try {
    const where = {};

    if (!['SUPER_ADMIN', 'CONSULTANT', 'CLIENT_ADMIN', 'ADMIN'].includes(req.user.role)) {
      const assignments = await prisma.formAssignment.findMany({
        where: { respondentId: req.user.sub },
        select: { form: { select: { evaluationId: true } } },
      });

      const evaluationIds = Array.from(new Set(assignments.map((assignment) => assignment.form.evaluationId)));
      if (evaluationIds.length === 0) {
        return res.json([]);
      }

      where.id = { in: evaluationIds };
    }

    const evaluations = await prisma.evaluation.findMany({
      where,
      include: {
        organisation: true,
        forms: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = evaluations.map((evaluation) => ({
      id: evaluation.id,
      title: evaluation.title,
      status: evaluation.status,
      startDate: evaluation.startDate,
      createdAt: evaluation.createdAt,
      organisation: { id: evaluation.organisation.id, name: evaluation.organisation.name },
      _count: { forms: evaluation.forms.length },
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Fetch evaluations failed:', error);
    res.status(500).json({ message: 'Unable to fetch evaluations.' });
  }
});

app.post('/evaluations', roleGuard(['SUPER_ADMIN', 'CONSULTANT', 'CLIENT_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { organisationId, title, startDate } = req.body;
    if (!organisationId || !title) {
      return res.status(400).json({ message: 'Organisation and title are required.' });
    }

    const evaluation = await prisma.evaluation.create({
      data: {
        organisationId,
        title,
        startDate: startDate ? new Date(startDate) : null,
        createdById: req.user.sub,
      },
    });

    res.status(201).json({ id: evaluation.id, ...evaluation });
  } catch (error) {
    console.error('Create evaluation failed:', error);
    res.status(500).json({ message: 'Unable to create evaluation.' });
  }
});

app.patch('/evaluations/:id/archive', roleGuard(['SUPER_ADMIN', 'CONSULTANT', 'CLIENT_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const evaluation = await prisma.evaluation.update({
      where: { id },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });
    res.json({ id: evaluation.id, status: evaluation.status });
  } catch (error) {
    console.error('Archive evaluation failed:', error);
    res.status(500).json({ message: 'Unable to archive evaluation.' });
  }
});

app.delete('/evaluations/:id', roleGuard(['SUPER_ADMIN', 'CONSULTANT', 'CLIENT_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const evaluation = await prisma.evaluation.findUnique({ where: { id } });
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found.' });
    }
    await prisma.evaluation.delete({ where: { id } });
    res.json({ message: 'Evaluation deleted successfully.' });
  } catch (error) {
    console.error('Delete evaluation failed:', error);
    res.status(500).json({ message: 'Unable to delete evaluation.' });
  }
});

app.post('/diagnosis/evaluations/:id/score', async (req, res) => {
  try {
    const { id } = req.params;
    const hasAccess = await isAssignedToEvaluation(req.user, id);
    if (!hasAccess) {
      return res.status(404).json({ message: 'Evaluation not found.' });
    }

    const evaluation = await prisma.evaluation.findUnique({ where: { id } });
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found.' });
    }

    const forms = await prisma.form.findMany({
      where: { evaluationId: id },
      include: { questions: true },
    });
    const formIds = forms.map((form) => form.id);
    const questionCount = forms.reduce((total, form) => total + form.questions.length, 0);

    const responses = await prisma.response.findMany({
      where: {
        formId: { in: formIds },
        status: 'SUBMITTED',
      },
      include: {
        answers: { include: { question: true } },
      },
    });

    await prisma.scoreResult.deleteMany({ where: { evaluationId: id } });

    const scoreByCategory = new Map();
    const countByCategory = new Map();
    const scoreByDimension = new Map();
    const countByDimension = new Map();
    let scoreSum = 0;
    let scoreCount = 0;
    let totalAnswerCount = 0;
    const sampleAnswers = [];

    for (const response of responses) {
      for (const answer of response.answers) {
        const question = answer.question;
        if (!question) continue;

        const rawValue = getJsonValue(answer.value);
        const answerScore = normalizeAnswerScore(rawValue);
        const category = getQuestionCategory(question);
        const dimensions = Array.isArray(question.dimensions) && question.dimensions.length > 0
          ? question.dimensions
          : ['General'];

        scoreByCategory.set(category, (scoreByCategory.get(category) || 0) + answerScore);
        countByCategory.set(category, (countByCategory.get(category) || 0) + 1);

        for (const dimension of dimensions) {
          const dimensionKey = String(dimension).trim() || 'General';
          scoreByDimension.set(dimensionKey, (scoreByDimension.get(dimensionKey) || 0) + answerScore);
          countByDimension.set(dimensionKey, (countByDimension.get(dimensionKey) || 0) + 1);
        }

        scoreSum += answerScore;
        scoreCount += 1;
        totalAnswerCount += 1;

        const formattedAnswer = formatAnswerValue(rawValue);
        if (sampleAnswers.length < 8 && formattedAnswer.trim() !== '') {
          sampleAnswers.push({
            question: question.label || question.externalId || question.id,
            answer: formattedAnswer,
          });
        }
      }
    }

    const overallAverage = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 50;

    const getDimensionAverage = (matchFn) => {
      const entries = Array.from(scoreByDimension.entries()).filter(([dimension]) => matchFn(dimension));
      const totalScore = entries.reduce((sum, [dimension, score]) => sum + score, 0);
      const totalCount = entries.reduce((sum, [dimension]) => sum + (countByDimension.get(dimension) || 0), 0);
      return totalCount > 0 ? Math.round(totalScore / totalCount) : overallAverage;
    };

    const digitalReadinessScore = overallAverage;
    const gisReadinessScore = getDimensionAverage((dimension) => dimension.toLowerCase().includes('gis') || dimension.toLowerCase().includes('geospatial'));
    const infrastructureScore = getDimensionAverage((dimension) => dimension.toLowerCase().includes('infrastructure') || dimension.toLowerCase().includes('infra'));

    const results = [
      {
        scoreType: 'DIGITAL_READINESS',
        category: null,
        score: digitalReadinessScore,
        band: getScoreBand(digitalReadinessScore),
      },
      {
        scoreType: 'GIS_READINESS',
        category: null,
        score: gisReadinessScore,
        band: getScoreBand(gisReadinessScore),
      },
      {
        scoreType: 'INFRASTRUCTURE',
        category: null,
        score: infrastructureScore,
        band: getScoreBand(infrastructureScore),
      },
    ];

    for (const [category, totalScore] of scoreByCategory.entries()) {
      const count = countByCategory.get(category) || 1;
      const score = Math.round(totalScore / count);
      results.push({
        scoreType: 'CATEGORY',
        category,
        score,
        band: getScoreBand(score),
      });
    }

    for (const [dimension, totalScore] of scoreByDimension.entries()) {
      const count = countByDimension.get(dimension) || 1;
      const score = Math.round(totalScore / count);
      results.push({
        scoreType: 'DIMENSION',
        category: dimension,
        score,
        band: getScoreBand(score),
      });
    }

    for (const result of results) {
      await prisma.scoreResult.create({
        data: {
          evaluationId: id,
          scope: 'ORGANISATION',
          scopeId: id,
          scoreType: result.scoreType,
          category: result.category,
          score: result.score,
          band: result.band,
        },
      });
    }

    const responseCount = await prisma.response.count({
      where: { formId: { in: formIds }, status: 'SUBMITTED' },
    });
    const conflictCount = await prisma.conflict.count({ where: { evaluationId: id } });

    const aiInput = {
      evaluation: {
        id: evaluation.id,
        title: evaluation.title,
        formCount: forms.length,
        responseCount,
      },
      scores: results,
      conflictCount,
      responseSummary: {
        totalAnswers: totalAnswerCount,
        questionCount,
        averageCompletion: questionCount > 0 && responseCount > 0
          ? Math.round((totalAnswerCount / (responseCount * questionCount)) * 100)
          : 0,
      },
      sampleAnswers,
    };

    const diagnosisContent = {
      executiveSummary: responseCount > 0
        ? 'Evaluation scores have been computed and are ready for review.'
        : 'No submitted responses are available yet. Submit at least one response to generate a more accurate diagnosis.',
      strengths: ['Strong organisational alignment', 'Data-driven approach'],
      weaknesses: ['Infrastructure gaps remain', 'Process maturity needs improvement'],
      opportunities: ['Improve training', 'Automate key workflows'],
      recommendations: ['Create a targeted improvement plan', 'Enhance data governance'],
      actionPlan: [
        {
          who: 'Evaluation leadership team',
          what: 'Review submitted responses and prioritise the most critical gaps',
          how: 'Use the score and response summaries to create a short action plan, clarify ownership, and set a timeline',
          when: 'Within the next 2 weeks',
        },
      ],
    };
    const isAiGenerated = false;

    const existingDiagnosis = await prisma.diagnosis.findFirst({ where: { evaluationId: id } });
    if (existingDiagnosis) {
      await prisma.diagnosis.update({
        where: { id: existingDiagnosis.id },
        data: {
          content: diagnosisContent,
          status: 'IN_REVIEW',
          isAiGenerated,
          generatedAt: new Date(),
          version: existingDiagnosis.version + 1,
        },
      });
    } else {
      await prisma.diagnosis.create({
        data: {
          evaluationId: id,
          content: diagnosisContent,
          status: 'IN_REVIEW',
          isAiGenerated,
        },
      });
    }

    res.json({ message: 'Scores generated and diagnosis content stored.', provider: 'none' });
  } catch (error) {
    console.error('Compute scores failed:', error);
    res.status(500).json({ message: 'Unable to compute diagnosis scores.' });
  }
});

app.post('/diagnosis/evaluations/:id/detect-conflicts', async (req, res) => {
  try {
    const { id } = req.params;
    const hasAccess = await isAssignedToEvaluation(req.user, id);
    if (!hasAccess) {
      return res.status(404).json({ message: 'Evaluation not found.' });
    }

    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
      include: { forms: true },
    });
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found.' });
    }

    const formIds = evaluation.forms.map((form) => form.id);
    if (formIds.length === 0) {
      return res.json({ message: 'No forms attached to evaluation.' });
    }

    const answers = await prisma.answer.findMany({
      where: {
        response: { status: 'SUBMITTED', form: { evaluationId: id } },
      },
      include: { response: true, question: true },
    });

    const grouped = new Map();
    for (const answer of answers) {
      const key = answer.questionId;
      const rawValue = getJsonValue(answer.value);
      const group = grouped.get(key) || new Set();
      group.add(JSON.stringify(rawValue));
      grouped.set(key, group);
    }

    const conflictsCreated = [];
    for (const [questionId, values] of grouped.entries()) {
      if (values.size < 2) continue;
      const conflictType = Array.from(values).every((raw) => !Number.isNaN(Number(JSON.parse(raw))))
        ? 'NUMERIC_VARIANCE'
        : 'CONTRADICTORY_CHOICE';

      const existing = await prisma.conflict.findFirst({
        where: { evaluationId: id, questionId },
      });

      const conflictData = {
        evaluationId: id,
        questionId,
        conflictType,
        conflictingValues: Array.from(values).map((raw) => JSON.parse(raw)),
        isResolved: false,
      };

      if (existing) {
        await prisma.conflict.update({ where: { id: existing.id }, data: conflictData });
        conflictsCreated.push(existing.id);
      } else {
        const conflict = await prisma.conflict.create({ data: conflictData });
        conflictsCreated.push(conflict.id);
      }
    }

    res.json({ message: 'Conflict detection complete.', conflicts: conflictsCreated.length });
  } catch (error) {
    console.error('Detect conflicts failed:', error);
    res.status(500).json({ message: 'Unable to detect conflicts.' });
  }
});

app.get('/diagnosis/evaluations/:id/responses', async (req, res) => {
  try {
    const { id } = req.params;
    const hasAccess = await isAssignedToEvaluation(req.user, id);
    if (!hasAccess) {
      return res.status(404).json({ message: 'Evaluation not found.' });
    }

    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
      include: { forms: true },
    });

    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found.' });
    }

    const formIds = evaluation.forms.map((form) => form.id);
    if (formIds.length === 0) {
      return res.json({
        totalResponses: 0,
        totalAnswers: 0,
        averageCompletion: 0,
        sampleAnswers: [],
      });
    }

    const responses = await prisma.response.findMany({
      where: { formId: { in: formIds }, status: 'SUBMITTED' },
      include: {
        answers: { include: { question: true } },
        respondent: true,
      },
      orderBy: { submittedAt: 'desc' },
    });

    const questionCount = await evaluation.forms.reduce((currentCount, form) => {
      const definition = getJsonValue(form.definition);
      if (!definition || !Array.isArray(definition.pages)) return currentCount;
      return currentCount + definition.pages.reduce(
        (pageCount, page) => pageCount + (Array.isArray(page.questions) ? page.questions.length : 0),
        0,
      );
    }, 0);

    const totalAnswers = responses.reduce((sum, response) => sum + response.answers.length, 0);
    const averageCompletion = questionCount > 0 && responses.length > 0
      ? Math.round((totalAnswers / (responses.length * questionCount)) * 100)
      : 0;

    const sampleAnswers = [];
    for (const response of responses) {
      for (const answer of response.answers) {
        if (sampleAnswers.length >= 8) break;
        const rawValue = getJsonValue(answer.value);
        const formattedAnswer = formatAnswerValue(rawValue);
        if (!formattedAnswer.trim()) continue;
        sampleAnswers.push({
          question: answer.question?.label || answer.questionId,
          answer: formattedAnswer,
          respondent: response.respondent?.name || response.respondent?.email || 'Anonymous',
        });
      }
      if (sampleAnswers.length >= 8) break;
    }

    res.json({
      totalResponses: responses.length,
      totalAnswers,
      questionCount,
      averageCompletion,
      sampleAnswers,
    });
  } catch (error) {
    console.error('Fetch diagnosis responses failed:', error);
    res.status(500).json({ message: 'Unable to fetch diagnosis responses.' });
  }
});

app.get('/diagnosis/evaluations/:id/responses/full', async (req, res) => {
  try {
    const { id } = req.params;
    const hasAccess = await isAssignedToEvaluation(req.user, id);
    if (!hasAccess) {
      return res.status(404).json({ message: 'Evaluation not found.' });
    }

    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
      include: { forms: true },
    });

    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found.' });
    }

    const formIds = evaluation.forms.map((form) => form.id);
    if (formIds.length === 0) {
      return res.json({
        totalResponses: 0,
        totalAnswers: 0,
        averageCompletion: 0,
        sampleAnswers: [],
        responses: [],
      });
    }

    const responses = await prisma.response.findMany({
      where: { formId: { in: formIds }, status: 'SUBMITTED' },
      include: {
        answers: { include: { question: true } },
        respondent: true,
      },
      orderBy: { submittedAt: 'desc' },
    });

    const questionCount = evaluation.forms.reduce((currentCount, form) => {
      const definition = getJsonValue(form.definition);
      if (!definition || !Array.isArray(definition.pages)) return currentCount;
      return currentCount + definition.pages.reduce(
        (pageCount, page) => pageCount + (Array.isArray(page.questions) ? page.questions.length : 0),
        0,
      );
    }, 0);

    const totalAnswers = responses.reduce((sum, response) => sum + response.answers.length, 0);
    const averageCompletion = questionCount > 0 && responses.length > 0
      ? Math.round((totalAnswers / (responses.length * questionCount)) * 100)
      : 0;

    const sampleAnswers = [];
    for (const response of responses) {
      for (const answer of response.answers) {
        if (sampleAnswers.length >= 8) break;
        const rawValue = getJsonValue(answer.value);
        const formattedAnswer = formatAnswerValue(rawValue);
        if (!formattedAnswer.trim()) continue;
        sampleAnswers.push({
          question: answer.question?.label || answer.questionId,
          answer: formattedAnswer,
          respondent: response.respondent?.name || response.respondent?.email || 'Anonymous',
        });
      }
      if (sampleAnswers.length >= 8) break;
    }

    const formattedResponses = responses.map((response) => ({
      id: response.id,
      respondent: response.respondent?.name || response.respondent?.email || 'Anonymous',
      submittedAt: response.submittedAt ? response.submittedAt.toISOString() : null,
      answers: response.answers.map((answer) => ({
        question: answer.question?.label || answer.questionId,
        answer: formatAnswerValue(getJsonValue(answer.value)),
      })),
    }));

    res.json({
      totalResponses: responses.length,
      totalAnswers,
      questionCount,
      averageCompletion,
      sampleAnswers,
      responses: formattedResponses,
    });
  } catch (error) {
    console.error('Fetch full diagnosis responses failed:', error);
    res.status(500).json({ message: 'Unable to fetch diagnosis responses.' });
  }
});

app.get('/diagnosis/evaluations/:id/scores', async (req, res) => {
  try {
    const { id } = req.params;
    const hasAccess = await isAssignedToEvaluation(req.user, id);
    if (!hasAccess) {
      return res.status(404).json({ message: 'Evaluation not found.' });
    }

    const scores = await prisma.scoreResult.findMany({
      where: { evaluationId: id },
      orderBy: { computedAt: 'desc' },
    });
    res.json(scores.map((score) => ({
      id: score.id,
      evaluationId: score.evaluationId,
      scoreType: score.scoreType,
      category: score.category,
      score: Number(score.score),
      band: score.band || getScoreBand(Number(score.score)),
    })));
  } catch (error) {
    console.error('Fetch diagnosis scores failed:', error);
    res.status(500).json({ message: 'Unable to fetch diagnosis scores.' });
  }
});

app.get('/diagnosis/evaluations/:id/conflicts', async (req, res) => {
  try {
    const { id } = req.params;
    const hasAccess = await isAssignedToEvaluation(req.user, id);
    if (!hasAccess) {
      return res.status(404).json({ message: 'Evaluation not found.' });
    }

    const conflicts = await prisma.conflict.findMany({
      where: { evaluationId: id },
      include: { question: true },
      orderBy: { id: 'desc' },
    });
    res.json(conflicts.map((conflict) => ({
      id: conflict.id,
      evaluationId: conflict.evaluationId,
      questionId: conflict.questionId,
      question: {
        label: conflict.question?.label || `Question ${conflict.questionId}`,
        type: conflict.question?.type || 'unknown',
      },
      conflictType: conflict.conflictType,
      conflictingValues: getJsonValue(conflict.conflictingValues),
      isResolved: conflict.isResolved,
      resolutionNote: conflict.resolutionNote,
      createdAt: conflict.createdAt,
      resolvedAt: conflict.resolvedAt,
    })));
  } catch (error) {
    console.error('Fetch conflicts failed:', error);
    res.status(500).json({ message: 'Unable to fetch conflicts.' });
  }
});

app.get('/diagnosis/evaluations/:id/gaps', async (req, res) => {
  try {
    const { id } = req.params;
    const hasAccess = await isAssignedToEvaluation(req.user, id);
    if (!hasAccess) {
      return res.status(404).json({ message: 'Evaluation not found.' });
    }

    const lowScores = await prisma.scoreResult.findMany({
      where: { evaluationId: id, score: { lt: 75 } },
      orderBy: { score: 'asc' },
      take: 6,
      include: { evaluation: true },
    });

    const mapped = lowScores.map((score) => {
      const categoryName = score.category || score.scoreType;
      return {
        id: score.id,
        category: categoryName,
        description: `Low ${categoryName.toLowerCase()} performance is exposing a gap.`,
        severity: getGapSeverity(Number(score.score)).toLowerCase(),
        affectedDepartments: ['Organisation-wide'],
        evidence: [
          `Recorded score ${score.score} for ${categoryName}.`,
          `Responses indicate this area is weaker than the overall evaluation average.`,
        ],
        recommendedAction: `Focus on improving ${categoryName} through targeted actions and stronger organisational alignment.`,
        who: getGapOwner(categoryName),
        how: getGapImplementationAdvice(categoryName),
        when: getGapTimeline(Number(score.score)),
        evaluation: { id: score.evaluation.id, title: score.evaluation.title },
        createdAt: score.computedAt,
      };
    });

    res.json(mapped);
  } catch (error) {
    console.error('Fetch diagnosis gaps failed:', error);
    res.status(500).json({ message: 'Unable to fetch diagnosis gaps.' });
  }
});

app.patch('/diagnosis/conflicts/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionNote } = req.body;
    const conflict = await prisma.conflict.update({
      where: { id },
      data: {
        isResolved: true,
        resolutionNote,
        resolvedById: req.user.sub,
        resolvedAt: new Date(),
      },
    });
    res.json({ id: conflict.id, isResolved: conflict.isResolved });
  } catch (error) {
    console.error('Resolve conflict failed:', error);
    res.status(500).json({ message: 'Unable to resolve conflict.' });
  }
});

app.patch('/settings', async (req, res) => {
  try {
    const settings = req.body;
    res.json({ message: 'Settings saved.', settings });
  } catch (error) {
    console.error('Save settings failed:', error);
    res.status(500).json({ message: 'Unable to save settings.' });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

const port = parseInt(process.env.PORT || '3001', 10);
app.listen(port, '0.0.0.0', () => {
  console.log(`Pro-Insight 360 API listening on port ${port}`);
});
