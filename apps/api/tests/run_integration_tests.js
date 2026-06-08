const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function ok(name) { console.log(`✅ ${name}`); }
function fail(name, err) { console.error(`❌ ${name}:`, err && err.message ? err.message : err); }

async function waitForServer(url, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`${url}/health`);
      if (res.ok) return true;
    } catch (e) { /* ignore */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Server did not respond in time');
}

async function main() {
  console.log('Integration test running against', API_URL);
  await waitForServer(API_URL, 15000).catch((e) => { throw e; });

  const results = [];

  // Create organisation
  let org;
  try {
    org = await prisma.organisation.create({ data: { name: 'CI Test Org' } });
    ok('Create organisation (DB)');
  } catch (e) { fail('Create organisation (DB)', e); return process.exit(1); }

  // Create test user
  const testEmail = `ci-test+${Date.now()}@example.com`;
  const testPassword = 'TestPass123!';
  let user;
  try {
    const passwordHash = await bcrypt.hash(testPassword, 10);
    user = await prisma.user.create({ data: { email: testEmail, name: 'CI Test', role: 'CLIENT_ADMIN', isActive: true, passwordHash, organisationId: org.id } });
    ok('Create test user (DB)');
  } catch (e) { fail('Create test user (DB)', e); return process.exit(1); }

  // Login
  let token;
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Login failed');
    token = body.accessToken;
    ok('POST /auth/login');
  } catch (e) { fail('POST /auth/login', e); return process.exit(1); }

  const auth = { Authorization: `Bearer ${token}` };

  // Helper to run GET
  async function get(path, name) {
    try {
      const res = await fetch(`${API_URL}${path}`, { headers: auth });
      const json = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(json));
      ok(`GET ${path} (${name})`);
      return json;
    } catch (e) { fail(`GET ${path} (${name})`, e); return null; }
  }

  // Helper to run POST
  async function post(path, body, name) {
    try {
      const res = await fetch(`${API_URL}${path}`, { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(json));
      ok(`POST ${path} (${name})`);
      return json;
    } catch (e) { fail(`POST ${path} (${name})`, e); return null; }
  }

  // Run a bunch of GET endpoints expected by frontend
  await get('/users', 'users');
  await get('/forms', 'forms');
  await get('/departments', 'departments');
  await get('/gis-readiness', 'gis-readiness');
  await get('/gap-analysis', 'gap-analysis');
  await get('/technical-skills', 'technical-skills');
  await get('/responses', 'responses');
  await get('/organisations', 'organisations');
  await get('/contacts', 'contacts');
  await get('/notifications', 'notifications');
  await get('/reports', 'reports');
  await get('/recommendations', 'recommendations');
  await get('/organograms', 'organograms');
  await get('/workflow-maps', 'workflow-maps');
  await get('/diagnoses', 'diagnoses');
  await get('/evaluations', 'evaluations');
  await get('/settings', 'settings');

  // Create evaluation via POST /evaluations
  const evaluation = await post('/evaluations', { organisationId: org.id, title: 'CI Evaluation', startDate: null }, 'create evaluation');
  if (!evaluation || !evaluation.id) { fail('Create evaluation', new Error('No evaluation id')); }
  const evalId = evaluation.id || (evaluation && evaluation[0] && evaluation[0].id) || null;

  // Create a form in DB linked to evaluation
  let form;
  try {
    form = await prisma.form.create({ data: { title: 'CI Form', definition: { pages: [ { id: 'p1', title: 'Page 1', questions: [{ id: 'q1', label: 'Q1', type: 'text' }] } ] }, evaluation: { connect: { id: evalId } }, createdBy: { connect: { id: user.id } } } });
    ok('Create form (DB)');
  } catch (e) { fail('Create form (DB)', e); }

  if (form) {
    try {
      await prisma.question.upsert({ where: { id: 'q1' }, update: {}, create: { id: 'q1', formId: form.id, externalId: 'q1', type: 'text', label: 'Q1', position: 1 } });
      ok('Create question (DB)');
    } catch (e) { fail('Create question (DB)', e); }
    await get('/forms', 'forms after create');
    await get(`/forms/${form.id}/definition`, 'form definition');

    // Draft and submit response
    await post('/responses/draft', { formId: form.id, answers: [{ questionId: 'q1', value: 'test answer' }] }, 'save draft');
    await get(`/responses/draft/${form.id}`, 'get draft');
    await post('/responses/submit', { formId: form.id, answers: [{ questionId: 'q1', value: 'test answer' }] }, 'submit response');
  }

  // Diagnosis endpoints
  if (evalId) {
    await post(`/diagnosis/evaluations/${evalId}/score`, {}, 'score evaluation');
    await post(`/diagnosis/evaluations/${evalId}/detect-conflicts`, {}, 'detect conflicts');
    await get(`/diagnosis/evaluations/${evalId}/scores`, 'get scores');
    await get(`/diagnosis/evaluations/${evalId}/conflicts`, 'get conflicts');
    await get(`/diagnosis/evaluations/${evalId}/gaps`, 'get gaps');
    await post(`/diagnosis/evaluations/${evalId}/score`, {}, 're-score evaluation');

    // Archive evaluation
    await fetch(`${API_URL}/evaluations/${evalId}/archive`, { method: 'PATCH', headers: { ...auth } })
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(JSON.stringify(j)); ok('PATCH /evaluations/:id/archive'); })
      .catch((e) => fail('PATCH /evaluations/:id/archive', e));
  }

  // Misc GETs
  await get('/digital-readiness', 'digital-readiness');
  await get('/technical-skills', 'technical-skills (again)');

  console.log('Integration tests complete. Cleaning up test data...');

  try {
    if (form) {
      await prisma.response.deleteMany({ where: { formId: form.id } });
      await prisma.answer.deleteMany({ where: { responseId: { in: [] } } }).catch(() => {});
      await prisma.question.deleteMany({ where: { formId: form.id } });
      await prisma.form.delete({ where: { id: form.id } });
    }
    if (evalId) await prisma.evaluation.delete({ where: { id: evalId } });
    if (user) await prisma.user.delete({ where: { id: user.id } });
    if (org) await prisma.organisation.delete({ where: { id: org.id } });
    ok('Cleanup');
  } catch (e) { fail('Cleanup', e); }

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((e) => { console.error('Test run failed:', e); process.exit(1); });
