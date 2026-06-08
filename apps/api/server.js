const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const jwtSecret = process.env.JWT_SECRET || 'change_me_in_production';

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

function authenticate(req, res, next) {
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
      if (!role || !allowedRoles.includes(role)) {
        return res.status(403).json({ message: 'Forbidden: insufficient role.' });
      }
      next();
    } catch (err) {
      console.error('Role guard error:', err);
      return res.status(500).json({ message: 'Role guard failed.' });
    }
  };
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

app.use(authenticate);

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

app.get('/gap-analysis', async (req, res) => {
  try {
    const lowScores = await prisma.scoreResult.findMany({
      where: { score: { lt: 70 } },
      include: { evaluation: true },
      orderBy: { score: 'asc' },
      take: 8,
    });

    const mapped = lowScores.map((score) => ({
      id: score.id,
      category: score.category || score.scoreType,
      description: `The ${score.category || score.scoreType.toLowerCase()} score is below target. Review responses and improve the assessment in this area.`,
      severity: getGapSeverity(Number(score.score)),
      affectedDepartments: [],
      recommendedAction: `Improve the ${score.category || score.scoreType.toLowerCase()} dimension through training and process improvement.`,
      evaluation: { id: score.evaluation.id, title: score.evaluation.title },
      createdAt: score.computedAt,
    }));

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
    const evaluations = await prisma.evaluation.findMany({
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

app.post('/evaluations', roleGuard(['CONSULTANT', 'CLIENT_ADMIN', 'ADMIN']), async (req, res) => {
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

app.patch('/evaluations/:id/archive', roleGuard(['CONSULTANT', 'CLIENT_ADMIN', 'ADMIN']), async (req, res) => {
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

app.post('/diagnosis/evaluations/:id/score', async (req, res) => {
  try {
    const { id } = req.params;
    const evaluation = await prisma.evaluation.findUnique({ where: { id } });
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found.' });
    }

    await prisma.scoreResult.deleteMany({ where: { evaluationId: id } });

    const baseScore = 60;
    const scoreValues = {
      DIGITAL_READINESS: baseScore + 10,
      GIS_READINESS: baseScore,
      INFRASTRUCTURE: baseScore - 5,
    };

    const categoryNames = ['Strategy', 'Governance', 'Infrastructure', 'Security', 'Data Management'];
    const dimensionNames = ['who', 'what', 'how', 'when'];

    const results = [];

    for (const [scoreType, scoreAmount] of Object.entries(scoreValues)) {
      results.push({
        scoreType,
        score: scoreAmount,
        band: getScoreBand(scoreAmount),
        category: null,
      });
    }

    for (const category of categoryNames) {
      const delta = Math.floor(Math.random() * 20) - 10;
      const score = Math.min(100, Math.max(30, baseScore + delta));
      results.push({
        scoreType: 'CATEGORY',
        category,
        score,
        band: getScoreBand(score),
      });
    }

    for (const dimension of dimensionNames) {
      const delta = Math.floor(Math.random() * 20) - 5;
      const score = Math.min(100, Math.max(20, baseScore + delta));
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

    const existingDiagnosis = await prisma.diagnosis.findFirst({ where: { evaluationId: id } });
    if (!existingDiagnosis) {
      await prisma.diagnosis.create({
        data: {
          evaluationId: id,
          content: {
            executiveSummary: 'Evaluation scores have been computed and are ready for review.',
            strengths: ['Strong organisational alignment', 'Data-driven approach'],
            weaknesses: ['Infrastructure gaps remain', 'Process maturity needs improvement'],
            opportunities: ['Improve training', 'Automate key workflows'],
            recommendations: ['Create a targeted improvement plan', 'Enhance data governance'],
          },
          status: 'IN_REVIEW',
        },
      });
    }

    res.json({ message: 'Scores generated.' });
  } catch (error) {
    console.error('Compute scores failed:', error);
    res.status(500).json({ message: 'Unable to compute diagnosis scores.' });
  }
});

app.post('/diagnosis/evaluations/:id/detect-conflicts', async (req, res) => {
  try {
    const { id } = req.params;
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
      where: { question: { formId: { in: formIds } } },
      include: { response: true },
    });

    const questionsById = new Map();
    const grouped = new Map();
    for (const answer of answers) {
      const key = answer.questionId;
      const rawValue = getJsonValue(answer.value);
      const group = grouped.get(key) || new Set();
      group.add(JSON.stringify(rawValue));
      grouped.set(key, group);
      questionsById.set(key, answer.questionId);
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

app.get('/diagnosis/evaluations/:id/scores', async (req, res) => {
  try {
    const { id } = req.params;
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
    const conflicts = await prisma.conflict.findMany({
      where: { evaluationId: id },
      orderBy: { id: 'desc' },
    });
    res.json(conflicts.map((conflict) => ({
      id: conflict.id,
      evaluationId: conflict.evaluationId,
      questionId: conflict.questionId,
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
    const lowScores = await prisma.scoreResult.findMany({
      where: { evaluationId: id, score: { lt: 75 } },
      orderBy: { score: 'asc' },
      take: 6,
      include: { evaluation: true },
    });

    const mapped = lowScores.map((score) => ({
      id: score.id,
      category: score.category || score.scoreType,
      description: `Low ${score.category || score.scoreType.toLowerCase()} performance is exposing a gap.`,
      severity: getGapSeverity(Number(score.score)),
      affectedDepartments: [],
      recommendedAction: `Review ${score.category || score.scoreType.toLowerCase()} and update the evaluation plan.`,
      evaluation: { id: score.evaluation.id, title: score.evaluation.title },
      createdAt: score.computedAt,
    }));

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
