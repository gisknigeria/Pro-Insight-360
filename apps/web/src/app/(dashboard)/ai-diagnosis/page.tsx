'use client';

import { useState, useEffect, useMemo } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { apiFetch } from '@/lib/api';
import RadarChart from '@/components/charts/RadarChart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  LabelList,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Diagnosis {
  id: string;
  evaluation: { id: string; title: string };
  status: 'PENDING_REVIEW' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  isAiGenerated: boolean;
  sections: {
    executiveSummary: string;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    recommendations: string[];
    actionPlan?: { who: string; what: string; how: string; when: string }[];
  };
  approvedBy?: { name: string };
  createdAt: string;
}

interface PromptTemplate {
  id: string;
  label: string;
  icon: string;
  description: string;
  prompt: string;
}

// ─── Prompt library ──────────────────────────────────────────────────────────

const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'general-org',
    label: 'General Organisational',
    icon: '🏢',
    description: 'Full SWOT analysis with executive summary and action plan.',
    prompt: `You are given submitted form responses from an organisational evaluation.
Analyse the questions and responses to identify:
- An executive summary of the organisation's current state
- Key strengths, weaknesses, and growth opportunities
- Missing capabilities or critical gaps revealed by the answers
- Prioritised recommendations and a practical action plan
- Chart data for readiness, capability, or risk visualisation
- Organogram structure if there is sufficient organisational data

Return ONLY valid JSON in this exact shape:
{
  "questions": [{"question":"...","answer":"..."}],
  "executiveSummary": "...",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "opportunities": ["..."],
  "recommendations": ["..."],
  "gaps": ["..."],
  "actionPlan": [{"who":"...","what":"...","how":"...","when":"..."}],
  "charts": [{"title":"...","data":[{"label":"...","value":0}]}],
  "organogram": {"nodes":[{"id":"...","label":"...","group":"..."}],"links":[{"source":"...","target":"...","relation":"..."}]}
}
Do not include markdown, code fences, or any extra text. Respond with plain JSON only.`,
  },
  {
    id: 'gis-readiness',
    label: 'GIS Readiness',
    icon: '🗺️',
    description: 'Assess GIS capability maturity, infrastructure and skills gaps.',
    prompt: `You are analysing form responses from a GIS readiness evaluation.
Focus on geospatial capability, infrastructure, data management, and staff competency.
Identify the organisation's GIS maturity level (Nascent / Emerging / Developing / Advanced).

Return ONLY valid JSON:
{
  "questions": [{"question":"...","answer":"..."}],
  "executiveSummary": "...",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "opportunities": ["..."],
  "recommendations": ["..."],
  "gaps": ["..."],
  "actionPlan": [{"who":"...","what":"...","how":"...","when":"..."}],
  "charts": [{"title":"GIS Readiness by Domain","data":[{"label":"Infrastructure","value":0},{"label":"Data Management","value":0},{"label":"Skills","value":0},{"label":"Governance","value":0}]}],
  "organogram": {"nodes":[],"links":[]}
}
Plain JSON only. No markdown or extra text.`,
  },
  {
    id: 'digital-readiness',
    label: 'Digital Transformation',
    icon: '💻',
    description: 'Evaluate digital maturity, technology adoption, and change readiness.',
    prompt: `You are analysing form responses from a digital transformation readiness assessment.
Evaluate technology adoption, process automation maturity, digital culture, and change readiness.
Score each domain 0–100 and identify the top priorities for transformation.

Return ONLY valid JSON:
{
  "questions": [{"question":"...","answer":"..."}],
  "executiveSummary": "...",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "opportunities": ["..."],
  "recommendations": ["..."],
  "gaps": ["..."],
  "actionPlan": [{"who":"...","what":"...","how":"...","when":"..."}],
  "charts": [{"title":"Digital Readiness Scores","data":[{"label":"Technology","value":0},{"label":"Process","value":0},{"label":"Culture","value":0},{"label":"Data","value":0},{"label":"Leadership","value":0}]}],
  "organogram": {"nodes":[],"links":[]}
}
Plain JSON only.`,
  },
  {
    id: 'technical-skills',
    label: 'Technical Skills Audit',
    icon: '🔧',
    description: 'Map skills gaps, training needs, and competency levels across teams.',
    prompt: `You are analysing form responses from a technical skills and competency assessment.
Map identified skills against required capabilities. Highlight critical gaps, training needs, and career development opportunities.

Return ONLY valid JSON:
{
  "questions": [{"question":"...","answer":"..."}],
  "executiveSummary": "...",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "opportunities": ["..."],
  "recommendations": ["..."],
  "gaps": ["..."],
  "actionPlan": [{"who":"...","what":"...","how":"...","when":"..."}],
  "charts": [{"title":"Skill Proficiency by Area","data":[{"label":"Technical","value":0},{"label":"Analytical","value":0},{"label":"Communication","value":0},{"label":"Leadership","value":0}]}],
  "organogram": {"nodes":[],"links":[]}
}
Plain JSON only.`,
  },
  {
    id: 'governance',
    label: 'Governance & Compliance',
    icon: '⚖️',
    description: 'Assess policy adherence, risk management, and governance maturity.',
    prompt: `You are analysing form responses from a governance and compliance evaluation.
Assess policy adherence, risk management maturity, accountability structures, and regulatory compliance gaps.

Return ONLY valid JSON:
{
  "questions": [{"question":"...","answer":"..."}],
  "executiveSummary": "...",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "opportunities": ["..."],
  "recommendations": ["..."],
  "gaps": ["..."],
  "actionPlan": [{"who":"...","what":"...","how":"...","when":"..."}],
  "charts": [{"title":"Governance Maturity by Domain","data":[{"label":"Policy","value":0},{"label":"Risk","value":0},{"label":"Compliance","value":0},{"label":"Accountability","value":0}]}],
  "organogram": {"nodes":[],"links":[]}
}
Plain JSON only.`,
  },
];

const STATUS_CONFIG = {
  PENDING_REVIEW: { label: 'Pending Review', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', dot: 'bg-amber-400' },
  IN_REVIEW: { label: 'In Review', bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200', dot: 'bg-blue-500' },
  APPROVED: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', dot: 'bg-emerald-500' },
  REJECTED: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200', dot: 'bg-red-500' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
      done ? 'bg-emerald-500 text-white' : active ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'
    }`}>
      {done ? '✓' : n}
    </div>
  );
}

function SectionChip({ color, label }: { color: string; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${color}`}>
      {label}
    </span>
  );
}

function AnalysisChartCard({ chart }: { chart: any }) {
  const chartData = Array.isArray(chart?.data)
    ? chart.data
        .filter((row: any) => row && (typeof row.label === 'string' || typeof row.name === 'string'))
        .map((row: any) => ({ name: String(row.label ?? row.name), value: Number(row.value ?? row.count ?? 0) }))
    : [];

  const avg = chartData.length > 0 ? chartData.reduce((s: number, p: any) => s + p.value, 0) / chartData.length : 0;

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="font-semibold text-slate-800 mb-4 text-sm">{chart.title || 'Chart'}</p>
        <div className="flex h-44 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
          No chart data available.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="font-semibold text-slate-800 mb-4 text-sm">{chart.title || 'Supporting chart'}</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '12px' }} />
            <ReferenceLine y={avg} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'avg', position: 'right', fill: '#f59e0b', fontSize: 11 }} />
            <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]}>
              <LabelList dataKey="value" position="top" fill="#1e40af" fontSize={11} fontWeight="600" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING_REVIEW;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AIDiagnosisPage() {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [diagnosisError, setDiagnosisError] = useState('');

  // Step 2 — paste & parse
  const [chatOutput, setChatOutput] = useState('');
  const [parsedChat, setParsedChat] = useState<any | null>(null);
  const [parseError, setParseError] = useState('');

  // Publish
  const [clientAdmins, setClientAdmins] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [evaluations, setEvaluations] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState('');
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishMessage, setPublishMessage] = useState('');
  const [publishError, setPublishError] = useState('');

  // Review
  const [reviewLoadingId, setReviewLoadingId] = useState<string | null>(null);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Prompt panel
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate>(PROMPT_TEMPLATES[0]);
  const [promptCopied, setPromptCopied] = useState(false);

  // Expand diagnosis history
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const selectedEvaluationTitle = evaluations.find((e) => e.id === selectedEvaluationId)?.title ?? 'Selected evaluation';

  // ── Data loading ──────────────────────────────────────────────────────────

  async function loadDiagnoses() {
    setLoading(true);
    setDiagnosisError('');
    try {
      const data = await apiFetch<Diagnosis[]>('/diagnoses');
      setDiagnoses(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setDiagnoses([]);
      setDiagnosisError(err?.message || 'Unable to load diagnosis history.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDiagnoses();

    apiFetch<{ id: string; name: string; email: string; role: string }[]>('/users')
      .then((users) => {
        const admins = users.filter((u) => u.role === 'CLIENT_ADMIN');
        setClientAdmins(admins.map((u) => ({ id: u.id, name: u.name || u.email, email: u.email })));
        if (admins.length > 0) setSelectedAdminId(admins[0].id);
      })
      .catch(() => setClientAdmins([]));

    apiFetch<Array<{ id: string; title: string }>>('/evaluations')
      .then((items) => {
        setEvaluations(items);
        if (items.length > 0) setSelectedEvaluationId(items[0].id);
      })
      .catch(() => setEvaluations([]));
  }, []);

  // ── Parse ─────────────────────────────────────────────────────────────────

  function handleParseChatOutput() {
    setParseError('');
    setPublishMessage('');
    setPublishError('');
    try {
      const text = chatOutput.trim();
      const start = text.indexOf('{');
      const parsed = JSON.parse(start >= 0 ? text.slice(start) : text);
      setParsedChat(parsed);
    } catch {
      setParsedChat(null);
      setParseError('Could not parse JSON. Make sure you paste only the AI JSON output — no markdown fences or surrounding text.');
    }
  }

  // ── Prompt copy ───────────────────────────────────────────────────────────

  async function copyPrompt() {
    await navigator.clipboard.writeText(selectedPrompt.prompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2500);
  }

  // ── Publish ───────────────────────────────────────────────────────────────

  async function handlePublishAnalysis() {
    setPublishMessage('');
    setPublishError('');
    if (!parsedChat) { setPublishError('Parse a valid analysis before publishing.'); return; }
    if (!selectedAdminId) { setPublishError('Select a client admin recipient.'); return; }
    if (!selectedEvaluationId) { setPublishError('Select an evaluation to attach this analysis to.'); return; }

    setPublishLoading(true);
    try {
      const result = await apiFetch<{ message: string }>('/diagnoses/publish', {
        method: 'POST',
        body: JSON.stringify({ recipientId: selectedAdminId, evaluationId: selectedEvaluationId, analysis: parsedChat }),
      });
      setPublishMessage(result.message || 'Analysis published successfully.');
      await loadDiagnoses();
    } catch (err: any) {
      setPublishError(err?.message || 'Unable to publish analysis.');
    } finally {
      setPublishLoading(false);
    }
  }

  // ── Review ────────────────────────────────────────────────────────────────

  async function updateDiagnosisStatus(id: string, status: 'APPROVED' | 'REJECTED', reason?: string) {
    setReviewMessage(''); setReviewError('');
    setReviewLoadingId(id);
    try {
      await apiFetch(`/diagnoses/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, rejectionReason: reason }) });
      await loadDiagnoses();
      setReviewMessage(`Diagnosis ${status.toLowerCase()} successfully.`);
    } catch (err: any) {
      setReviewError(err?.message || `Unable to ${status.toLowerCase()} diagnosis.`);
    } finally {
      setReviewLoadingId(null);
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const metrics = useMemo(() => ({
    strengths: Array.isArray(parsedChat?.strengths) ? parsedChat.strengths.length : 0,
    weaknesses: Array.isArray(parsedChat?.weaknesses) ? parsedChat.weaknesses.length : 0,
    opportunities: Array.isArray(parsedChat?.opportunities) ? parsedChat.opportunities.length : 0,
    recommendations: Array.isArray(parsedChat?.recommendations) ? parsedChat.recommendations.length : 0,
    actionPlan: Array.isArray(parsedChat?.actionPlan) ? parsedChat.actionPlan.length : 0,
  }), [parsedChat]);

  const radarData = useMemo(() => {
    if (!parsedChat) return null;
    return [
      { category: 'Strengths', score: Math.min(100, metrics.strengths * 18 + 20), fullMark: 100 },
      { category: 'Weaknesses', score: Math.max(24, 100 - metrics.weaknesses * 18), fullMark: 100 },
      { category: 'Opportunities', score: Math.min(100, metrics.opportunities * 14 + 20), fullMark: 100 },
      { category: 'Recommendations', score: Math.min(100, metrics.recommendations * 12 + 24), fullMark: 100 },
      { category: 'Action Plan', score: Math.min(100, metrics.actionPlan * 18 + 20), fullMark: 100 },
    ];
  }, [metrics, parsedChat]);

  // ── Steps progress ────────────────────────────────────────────────────────

  const step1Done = false; // always available — user did this externally
  const step2Done = chatOutput.trim().length > 0;
  const step3Done = parsedChat !== null;
  const step4Done = publishMessage.length > 0;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* ── Page header ── */}
      <div className="mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Super Admin · Analytics</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">AI Diagnosis & Analysis</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Copy form responses → paste to ChatGPT or Claude → import the result here → approve and publish to your client.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm text-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-medium text-slate-700">{diagnoses.filter((d) => d.status === 'APPROVED').length} approved</span>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm text-sm">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="font-medium text-slate-700">{diagnoses.filter((d) => d.status === 'PENDING_REVIEW').length} pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Workflow steps ── */}
      <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-5">Analysis workflow</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { n: 1, title: 'Copy responses', desc: 'Go to Evaluations → Diagnosis → Responses tab → Copy all answers', done: false, active: true },
            { n: 2, title: 'Paste into AI', desc: 'Open ChatGPT or Claude, paste the responses with your chosen prompt', done: step2Done, active: !step2Done },
            { n: 3, title: 'Import result', desc: 'Paste the AI JSON output into the import panel below', done: step3Done, active: step2Done && !step3Done },
            { n: 4, title: 'Publish', desc: 'Review the rendered analysis, approve, and send to client admin', done: step4Done, active: step3Done && !step4Done },
          ].map((step) => (
            <div key={step.n} className={`flex gap-3 rounded-2xl border p-4 transition-colors ${
              step.done ? 'border-emerald-200 bg-emerald-50' : step.active ? 'border-primary/30 bg-primary/5' : 'border-slate-200 bg-slate-50'
            }`}>
              <StepBadge n={step.n} active={step.active} done={step.done} />
              <div>
                <p className={`text-sm font-semibold ${step.done ? 'text-emerald-800' : step.active ? 'text-slate-900' : 'text-slate-500'}`}>
                  {step.title}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total analyses', value: diagnoses.length, icon: '📊', color: 'from-blue-500 to-indigo-600' },
          { label: 'Pending review', value: diagnoses.filter((d) => d.status === 'PENDING_REVIEW').length, icon: '⏳', color: 'from-amber-400 to-orange-500' },
          { label: 'Approved', value: diagnoses.filter((d) => d.status === 'APPROVED').length, icon: '✅', color: 'from-emerald-400 to-green-600' },
          { label: 'AI generated', value: diagnoses.filter((d) => d.isAiGenerated).length, icon: '🤖', color: 'from-violet-500 to-purple-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-lg shadow-md`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Main 2-column layout ── */}
      <div className="grid gap-6 xl:grid-cols-[1fr_380px] mb-8">
        {/* ── LEFT: Prompt panel + Import ── */}
        <div className="space-y-6">
          {/* Prompt library — ALL prompts visible at once */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Step 1 — Choose a prompt & copy responses</h2>
            <p className="text-sm text-slate-500 mb-6">
              Go to your evaluation's Responses tab → <strong>Copy all answers</strong>. Then pick a prompt below, copy it, and paste both into ChatGPT or Claude.
            </p>

            <div className="space-y-4">
              {PROMPT_TEMPLATES.map((tpl) => {
                const isActive = selectedPrompt.id === tpl.id;
                const isCopied = promptCopied && isActive;

                const PROMPT_GRAD: Record<string, string> = {
                  'general-org':      'from-blue-500 to-indigo-600',
                  'gis-readiness':    'from-emerald-500 to-teal-600',
                  'digital-readiness':'from-violet-500 to-purple-600',
                  'technical-skills': 'from-amber-500 to-orange-600',
                  'governance':       'from-rose-500 to-red-600',
                };
                const grad = PROMPT_GRAD[tpl.id] ?? 'from-primary to-primary/70';

                return (
                  <div
                    key={tpl.id}
                    className={`rounded-2xl border transition-all ${isActive ? 'border-primary/40 shadow-md' : 'border-slate-200'}`}
                  >
                    {/* Header row */}
                    <button
                      type="button"
                      onClick={() => setSelectedPrompt(tpl)}
                      className="flex w-full items-center gap-4 p-4 text-left"
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${grad} text-lg shadow-md`}>
                        {tpl.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900">{tpl.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{tpl.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPrompt(tpl);
                            navigator.clipboard.writeText(tpl.prompt);
                            setPromptCopied(true);
                            setTimeout(() => setPromptCopied(false), 2500);
                          }}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                            isCopied
                              ? 'bg-emerald-500 text-white'
                              : `bg-gradient-to-r ${grad} text-white shadow-sm hover:shadow-md hover:opacity-90`
                          }`}
                        >
                          {isCopied ? '✓ Copied!' : '📋 Copy'}
                        </button>
                        <span className="text-slate-400 text-xs">{isActive ? '▲' : '▼'}</span>
                      </div>
                    </button>

                    {/* Expanded prompt text */}
                    {isActive && (
                      <div className="border-t border-slate-100 px-4 pb-4">
                        <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 leading-relaxed max-h-64 overflow-y-auto">
                          {tpl.prompt}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Import panel */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Step 2 — Paste AI output</h2>
            <p className="text-sm text-slate-500 mb-5">
              After getting the result from ChatGPT or Claude, paste the JSON response here and click <strong>Parse & render</strong>.
            </p>
            <textarea
              value={chatOutput}
              onChange={(e) => setChatOutput(e.target.value)}
              rows={9}
              placeholder={'Paste JSON analysis output here...\n\n{\n  "executiveSummary": "...",\n  "strengths": [...],\n  ...\n}'}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-mono text-slate-800 placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all resize-none"
            />
            {parseError && (
              <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5">
                <span className="text-red-500 text-base shrink-0">⚠</span>
                <p className="text-sm text-red-700">{parseError}</p>
              </div>
            )}
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={handleParseChatOutput}
                disabled={!chatOutput.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary/90 hover:shadow-md disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
              >
                Parse & render analysis
              </button>
              {parsedChat && (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  ✓ Parsed successfully
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Publish panel ── */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm h-fit sticky top-6">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Step 4 — Publish</h2>
          <p className="text-sm text-slate-500 mb-5">Send the approved analysis to a client admin, linked to an evaluation.</p>

          <label className="block mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Recipient (Client Admin)</span>
            <select
              value={selectedAdminId}
              onChange={(e) => setSelectedAdminId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              {clientAdmins.length === 0 ? (
                <option value="">No client admins found</option>
              ) : (
                clientAdmins.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} — {a.email}</option>
                ))
              )}
            </select>
          </label>

          <label className="block mb-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Evaluation</span>
            <select
              value={selectedEvaluationId}
              onChange={(e) => setSelectedEvaluationId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              {evaluations.length === 0 ? (
                <option value="">No evaluations found</option>
              ) : (
                evaluations.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))
              )}
            </select>
          </label>

          {parsedChat ? (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
              ✓ Analysis ready to publish — {metrics.strengths} strengths, {metrics.weaknesses} weaknesses, {metrics.actionPlan} action items
            </div>
          ) : (
            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-500">
              Parse the analysis in Step 2 before publishing.
            </div>
          )}

          <button
            type="button"
            disabled={publishLoading || !parsedChat || clientAdmins.length === 0}
            onClick={handlePublishAnalysis}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-4 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none disabled:-translate-y-0 transition-all"
          >
            {publishLoading ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Publishing…
              </>
            ) : (
              '🚀 Publish to client admin'
            )}
          </button>

          {publishMessage && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
              <span className="text-emerald-600 shrink-0">✓</span>
              <p className="text-sm text-emerald-800">{publishMessage}</p>
            </div>
          )}
          {publishError && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5">
              <span className="text-red-500 shrink-0">⚠</span>
              <p className="text-sm text-red-700">{publishError}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Step 3 rendered analysis ── */}
      {parsedChat && (
        <div className="mb-8 space-y-6">
          {/* Header */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary ring-1 ring-primary/20">
                    Step 3 · Review analysis
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Rendered report: {selectedEvaluationTitle}</h2>
                <p className="text-sm text-slate-500 mt-1">This is what your client admin will see once you publish.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SectionChip color="bg-emerald-50 text-emerald-700 ring-emerald-200" label={`${metrics.strengths} strengths`} />
                <SectionChip color="bg-red-50 text-red-700 ring-red-200" label={`${metrics.weaknesses} weaknesses`} />
                <SectionChip color="bg-amber-50 text-amber-700 ring-amber-200" label={`${metrics.opportunities} opportunities`} />
              </div>
            </div>
          </div>

          {/* Metric cards + radar */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: 'Strengths', value: metrics.strengths, color: 'from-emerald-400 to-green-600' },
              { label: 'Weaknesses', value: metrics.weaknesses, color: 'from-red-400 to-rose-600' },
              { label: 'Opportunities', value: metrics.opportunities, color: 'from-amber-400 to-orange-500' },
              { label: 'Recommendations', value: metrics.recommendations, color: 'from-blue-400 to-indigo-600' },
              { label: 'Action items', value: metrics.actionPlan, color: 'from-violet-400 to-purple-600' },
            ].map((m) => (
              <div key={m.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className={`mb-3 h-1.5 w-12 rounded-full bg-gradient-to-r ${m.color}`} />
                <p className="text-3xl font-bold text-slate-900">{m.value}</p>
                <p className="text-xs font-medium text-slate-500 mt-1">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Executive summary + radar */}
          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Executive Summary
              </h3>
              <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                {parsedChat.executiveSummary || 'No executive summary provided.'}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4">Readiness radar</h3>
              <div className="h-[280px]">
                <RadarChart data={radarData ?? undefined} />
              </div>
            </div>
          </div>

          {/* S / W / O cards */}
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-emerald-800 mb-4 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs text-white">✓</span>
                Strengths
              </h3>
              <div className="space-y-2.5">
                {Array.isArray(parsedChat.strengths) && parsedChat.strengths.map((item: string, i: number) => (
                  <div key={i} className="rounded-xl bg-white border border-emerald-100 px-4 py-3">
                    <p className="text-sm text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-red-200 bg-red-50/60 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-red-800 mb-4 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white">!</span>
                Weaknesses
              </h3>
              <div className="space-y-2.5">
                {Array.isArray(parsedChat.weaknesses) && parsedChat.weaknesses.map((item: string, i: number) => (
                  <div key={i} className="rounded-xl bg-white border border-red-100 px-4 py-3">
                    <p className="text-sm text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-amber-800 mb-4 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs text-white">→</span>
                Opportunities
              </h3>
              <div className="space-y-2.5">
                {Array.isArray(parsedChat.opportunities) && parsedChat.opportunities.map((item: string, i: number) => (
                  <div key={i} className="rounded-xl bg-white border border-amber-100 px-4 py-3">
                    <p className="text-sm text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {Array.isArray(parsedChat.recommendations) && parsedChat.recommendations.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4">Recommendations</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {parsedChat.recommendations.map((item: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-1 ring-primary/20">
                      {i + 1}
                    </span>
                    <p className="text-sm text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action plan */}
          {Array.isArray(parsedChat.actionPlan) && parsedChat.actionPlan.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-5">Action Plan</h3>
              <div className="space-y-4">
                {parsedChat.actionPlan.map((item: any, i: number) => (
                  <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <p className="text-sm font-bold text-slate-900">{item.what}</p>
                    </div>
                    <div className="ml-10 grid gap-1.5 text-xs text-slate-600 sm:grid-cols-3">
                      <span><strong className="text-slate-800">Who:</strong> {item.who || 'TBD'}</span>
                      <span><strong className="text-slate-800">When:</strong> {item.when || 'TBD'}</span>
                      <span><strong className="text-slate-800">How:</strong> {item.how || '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts */}
          {Array.isArray(parsedChat.charts) && parsedChat.charts.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-5">
                <h3 className="text-base font-bold text-slate-900">Supporting Charts</h3>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                  {parsedChat.charts.length} chart{parsedChat.charts.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {parsedChat.charts.map((chart: any, i: number) => (
                  <AnalysisChartCard key={i} chart={chart} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Diagnosis history ── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Diagnosis history</h2>
            <p className="text-sm text-slate-500">All analyses — pending review, approved, and rejected.</p>
          </div>
          <button
            type="button"
            onClick={loadDiagnoses}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            ↻ Refresh
          </button>
        </div>

        {reviewMessage && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
            <span className="text-emerald-600 shrink-0">✓</span>
            <p className="text-sm text-emerald-800">{reviewMessage}</p>
          </div>
        )}
        {reviewError && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5">
            <span className="text-red-500 shrink-0">⚠</span>
            <p className="text-sm text-red-700">{reviewError}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : diagnosisError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{diagnosisError}</div>
        ) : diagnoses.length === 0 ? (
          <EmptyState icon="📊" title="No diagnoses yet" description="Published analyses will appear here." />
        ) : (
          <div className="space-y-3">
            {diagnoses.map((d) => {
              const isExpanded = expandedId === d.id;
              return (
                <div key={d.id} className={`rounded-2xl border transition-all ${isExpanded ? 'border-primary/30 shadow-md' : 'border-slate-200'}`}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-4 p-4 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : d.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">{d.evaluation.title}</p>
                        <StatusBadge status={d.status} />
                        {d.isAiGenerated && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 ring-1 ring-violet-200">
                            🤖 AI
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Created {new Date(d.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {d.approvedBy && ` · Approved by ${d.approvedBy.name}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {d.status === 'PENDING_REVIEW' || d.status === 'IN_REVIEW' ? (
                        <>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); updateDiagnosisStatus(d.id, 'APPROVED'); }}
                            disabled={reviewLoadingId === d.id}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-sm"
                          >
                            {reviewLoadingId === d.id ? '…' : '✓ Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const reason = window.prompt('Rejection reason:');
                              if (reason?.trim()) updateDiagnosisStatus(d.id, 'REJECTED', reason.trim());
                            }}
                            disabled={reviewLoadingId === d.id}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                          >
                            ✕ Reject
                          </button>
                        </>
                      ) : null}
                      <span className="text-slate-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100 p-4 space-y-4">
                      {d.sections.executiveSummary && (
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Executive summary</p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{d.sections.executiveSummary}</p>
                        </div>
                      )}
                      <div className="grid gap-3 sm:grid-cols-2">
                        {d.sections.strengths.length > 0 && (
                          <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">Strengths</p>
                            <ul className="space-y-1.5 text-sm text-slate-700">
                              {d.sections.strengths.map((s, i) => <li key={i} className="flex gap-2"><span className="text-emerald-500">•</span>{s}</li>)}
                            </ul>
                          </div>
                        )}
                        {d.sections.weaknesses.length > 0 && (
                          <div className="rounded-2xl bg-red-50 border border-red-100 p-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-red-700 mb-2">Weaknesses</p>
                            <ul className="space-y-1.5 text-sm text-slate-700">
                              {d.sections.weaknesses.map((s, i) => <li key={i} className="flex gap-2"><span className="text-red-400">•</span>{s}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
