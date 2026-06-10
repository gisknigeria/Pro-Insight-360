'use client';

import { useState, useEffect, useMemo } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { apiFetch } from '@/lib/api';
import RadarChart from '@/components/charts/RadarChart';
import {
  DepartmentComparisonChart,
  GapSeverityChart,
  WorkflowDelayChart,
} from '@/components/charts/BarLineCharts';
import OrgChart from '@/components/organogram/OrgChart';

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

const STATUS_CONFIG = {
  PENDING_REVIEW: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700', icon: '⏳' },
  IN_REVIEW: { label: 'In Review', color: 'bg-blue-100 text-blue-700', icon: '👀' },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: '✅' },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: '❌' },
};

export default function AIDiagnosisPage() {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [chatOutput, setChatOutput] = useState('');
  const [parsedChat, setParsedChat] = useState<any | null>(null);
  const [parseError, setParseError] = useState('');
  const [clientAdmins, setClientAdmins] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string>('');
  const [evaluations, setEvaluations] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string>('');
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishMessage, setPublishMessage] = useState('');
  const [publishError, setPublishError] = useState('');

  const chatPromptTemplate = `You are given the submitted form responses for an organisational evaluation. Analyze the responses and return only valid JSON with these properties:
{
  "executiveSummary": "...",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "opportunities": ["..."],
  "recommendations": ["..."],
  "actionPlan": [{"who":"...","what":"...","how":"...","when":"..."}],
  "charts": [{"title":"...","data":[{"label":"...","value":...}]}],
  "organogram": {"nodes":[{"id":"...","label":"...","group":"..."}],"links":[{"source":"...","target":"...","relation":"..."}]}
}
Do not include markdown, code fences, or any extra text. Use plain JSON only.`;

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/diagnoses`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setDiagnoses)
      .catch(() => setDiagnoses([]))
      .finally(() => setLoading(false));

    apiFetch<{ id: string; name: string; email: string; role: string }[]>('/users')
      .then((users) => {
        const admins = users.filter((user) => user.role === 'CLIENT_ADMIN');
        setClientAdmins(admins.map((user) => ({ id: user.id, name: user.name || user.email, email: user.email })));
        if (admins.length > 0) {
          setSelectedAdminId(admins[0].id);
        }
      })
      .catch(() => setClientAdmins([]));

    apiFetch<Array<{ id: string; title: string }>>('/evaluations')
      .then((items) => {
        setEvaluations(items);
        if (items.length > 0) {
          setSelectedEvaluationId(items[0].id);
        }
      })
      .catch(() => setEvaluations([]));
  }, []);

  function extractJsonObject(text: string) {
    try {
      const jsonStart = text.indexOf('{');
      const jsonText = jsonStart >= 0 ? text.slice(jsonStart) : text;
      return JSON.parse(jsonText);
    } catch (error) {
      throw new Error('Unable to parse JSON from analysis output. Please paste only valid JSON or remove any surrounding text/code fences.');
    }
  }

  function handleParseChatOutput() {
    setParseError('');
    setPublishMessage('');
    setPublishError('');
    try {
      const parsed = extractJsonObject(chatOutput.trim());
      setParsedChat(parsed);
    } catch (error: any) {
      setParsedChat(null);
      setParseError(error.message);
    }
  }

  function getChartMaxValue(chart: any) {
    if (!Array.isArray(chart?.data)) return 100;
    return Math.max(100, ...chart.data.map((item: any) => Number(item.value) || 0));
  }

  async function handlePublishAnalysis() {
    setPublishMessage('');
    setPublishError('');
    if (!parsedChat) {
      setPublishError('Please parse valid analysis output before publishing.');
      return;
    }
    if (!selectedAdminId) {
      setPublishError('Select a client admin to publish this analysis.');
      return;
    }
    if (!selectedEvaluationId) {
      setPublishError('Select an evaluation to attach this analysis to.');
      return;
    }

    setPublishLoading(true);
    try {
      const result = await apiFetch<{ message: string }>('/diagnoses/publish', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: selectedAdminId,
          evaluationId: selectedEvaluationId,
          analysis: parsedChat,
        }),
      });
      setPublishMessage(`${result.message || 'Analysis published successfully.'} Your client admin can review it in Insights and it is now linked to the selected evaluation.`);
      setPublishError('');
    } catch (error: any) {
      setPublishError(error?.message || 'Unable to publish analysis.');
      setPublishMessage('');
    } finally {
      setPublishLoading(false);
    }
  }

  const dashboardMetrics = useMemo(() => {
    return {
      strengths: Array.isArray(parsedChat?.strengths) ? parsedChat.strengths.length : 0,
      weaknesses: Array.isArray(parsedChat?.weaknesses) ? parsedChat.weaknesses.length : 0,
      opportunities: Array.isArray(parsedChat?.opportunities) ? parsedChat.opportunities.length : 0,
      recommendations: Array.isArray(parsedChat?.recommendations) ? parsedChat.recommendations.length : 0,
      actionPlan: Array.isArray(parsedChat?.actionPlan) ? parsedChat.actionPlan.length : 0,
    };
  }, [parsedChat]);

  const radarData = useMemo(() => {
    if (!parsedChat) return null;
    return [
      { category: 'Strengths', score: Math.min(100, dashboardMetrics.strengths * 18 + 20), fullMark: 100 },
      { category: 'Weaknesses', score: Math.max(24, 100 - dashboardMetrics.weaknesses * 18), fullMark: 100 },
      { category: 'Opportunities', score: Math.min(100, dashboardMetrics.opportunities * 14 + 20), fullMark: 100 },
      { category: 'Recommendations', score: Math.min(100, dashboardMetrics.recommendations * 12 + 24), fullMark: 100 },
      { category: 'Action Plan', score: Math.min(100, dashboardMetrics.actionPlan * 18 + 20), fullMark: 100 },
    ];
  }, [dashboardMetrics, parsedChat]);

  const orgRows = useMemo(() => {
    if (!parsedChat?.organogram) return [];

    const nodes = Array.isArray(parsedChat.organogram.nodes) ? parsedChat.organogram.nodes : [];
    const links = Array.isArray(parsedChat.organogram.links) ? parsedChat.organogram.links : [];

    const map = new Map();
    nodes.forEach((node: any) => {
      const name = String(node.label || node.id || 'Unknown');
      map.set(name, {
        name,
        title: String(node.group || 'Team'),
        reportsTo: '',
      });
    });

    links.forEach((link: any) => {
      const sourceName = String(link.source || link.sourceLabel || link.sourceId || '');
      const targetName = String(link.target || link.targetLabel || link.targetId || '');
      const sourceNode = map.get(sourceName);
      const targetNode = map.get(targetName);
      if (sourceNode && targetNode) {
        sourceNode.reportsTo = targetNode.name;
      }
    });

    return Array.from(map.values());
  }, [parsedChat]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">AI Diagnosis & Analysis</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Review AI-generated organizational insights and consultant analysis.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Diagnoses', value: diagnoses.length, icon: '📊' },
          { label: 'Pending Review', value: diagnoses.filter((d) => d.status === 'PENDING_REVIEW').length, icon: '⏳' },
          { label: 'Approved', value: diagnoses.filter((d) => d.status === 'APPROVED').length, icon: '✅' },
          { label: 'AI Generated', value: diagnoses.filter((d) => d.isAiGenerated).length, icon: '🤖' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <p className="text-sm font-medium text-slate-600">{stat.label}</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Manual analysis import</h2>
        <p className="text-sm text-slate-600 mb-4">
          Copy the response output from the evaluation page, paste it into an external analysis tool, and ask for structured JSON. Then paste the resulting JSON here to render it in the app.
        </p>
        <div className="grid gap-4">
          <textarea
            value={chatOutput}
            onChange={(event) => setChatOutput(event.target.value)}
            rows={10}
            placeholder="Paste JSON analysis output here"
            className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleParseChatOutput}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Parse and render analysis output
          </button>
          {parseError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {parseError}
            </div>
          )}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900 mb-2">Recommended analysis prompt</p>
            <pre className="whitespace-pre-wrap text-xs text-slate-600">{chatPromptTemplate}</pre>
          </div>
        </div>
      </div>

      {parsedChat && (
        <div className="mb-8 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3 max-w-3xl">
              <h2 className="text-2xl font-semibold text-slate-900">Rendered analysis</h2>
              <p className="text-sm text-slate-600">
                This analysis view transforms the imported structured output into a polished executive dashboard with charts, scorecards, and business-ready recommendations.
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm w-full xl:w-[340px]">
              <p className="text-sm font-semibold text-slate-900 mb-3">Publish analysis</p>
              <p className="text-sm text-slate-600 mb-5">Send this rendered analysis to a selected client admin so that decision-makers receive the final report quickly.</p>
              <label className="block text-sm text-slate-700 mb-3">
                Recipient
                <select
                  value={selectedAdminId}
                  onChange={(event) => setSelectedAdminId(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {clientAdmins.length === 0 ? (
                    <option value="">No client admins available</option>
                  ) : (
                    clientAdmins.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.name} ({admin.email})
                      </option>
                    ))
                  )}
                </select>
              </label>
              <label className="block text-sm text-slate-700 mb-5">
                Evaluation
                <select
                  value={selectedEvaluationId}
                  onChange={(event) => setSelectedEvaluationId(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {evaluations.length === 0 ? (
                    <option value="">No evaluations available</option>
                  ) : (
                    evaluations.map((evaluation) => (
                      <option key={evaluation.id} value={evaluation.id}>
                        {evaluation.title}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <div className="mb-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                This will attach the published analysis to the selected evaluation and make it visible as the evaluation diagnosis result for your organisation.
              </div>
              <button
                type="button"
                disabled={publishLoading || clientAdmins.length === 0}
                onClick={handlePublishAnalysis}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {publishLoading ? 'Publishing...' : 'Publish report'}
              </button>
              {publishMessage && (
                <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  {publishMessage}
                </div>
              )}
              {publishError && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {publishError}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Strengths</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{dashboardMetrics.strengths}</p>
                <p className="mt-2 text-sm text-slate-600">Core capability themes highlighted in the analysis.</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Weaknesses</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{dashboardMetrics.weaknesses}</p>
                <p className="mt-2 text-sm text-slate-600">Critical improvement opportunities to address.</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Recommendations</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{dashboardMetrics.recommendations}</p>
                <p className="mt-2 text-sm text-slate-600">Actionable recommendations for stakeholders.</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Action Plan</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{dashboardMetrics.actionPlan}</p>
                <p className="mt-2 text-sm text-slate-600">Defined next steps for operational delivery.</p>
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Readiness radar</h3>
              <div className="h-[320px]">
                <RadarChart data={radarData || undefined} />
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="grid gap-4">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-4">Gap analysis</h3>
                <GapSeverityChart height={340} />
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-4">Workflow performance</h3>
                <WorkflowDelayChart height={320} />
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Analysis snapshot</h3>
              <div className="space-y-4">
                {parsedChat.executiveSummary && (
                  <div className="rounded-[20px] bg-white p-4 shadow-sm border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Executive summary</h4>
                    <p className="text-sm leading-6 text-slate-700 whitespace-pre-wrap">{parsedChat.executiveSummary}</p>
                  </div>
                )}
                <div className="rounded-[20px] bg-white p-4 shadow-sm border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Strategic insight</h4>
                  <p className="text-sm text-slate-600">This report combines qualitative insights with visual metrics to highlight the organisation’s strongest opportunities and highest priority risks.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 xl:grid-cols-3">
            <div className="rounded-[24px] border border-green-200 bg-green-50 p-5 shadow-sm xl:col-span-1">
              <h3 className="font-semibold text-slate-900 mb-3">Top strengths</h3>
              <div className="space-y-3">
                {Array.isArray(parsedChat.strengths) && parsedChat.strengths.map((item: string, idx: number) => (
                  <div key={idx} className="rounded-[18px] bg-white p-4 border border-slate-200">
                    <p className="text-sm text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[24px] border border-orange-200 bg-orange-50 p-5 shadow-sm xl:col-span-1">
              <h3 className="font-semibold text-slate-900 mb-3">Key weaknesses</h3>
              <div className="space-y-3">
                {Array.isArray(parsedChat.weaknesses) && parsedChat.weaknesses.map((item: string, idx: number) => (
                  <div key={idx} className="rounded-[18px] bg-white p-4 border border-slate-200">
                    <p className="text-sm text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[24px] border border-blue-200 bg-blue-50 p-5 shadow-sm xl:col-span-1">
              <h3 className="font-semibold text-slate-900 mb-3">Primary opportunities</h3>
              <div className="space-y-3">
                {Array.isArray(parsedChat.opportunities) && parsedChat.opportunities.map((item: string, idx: number) => (
                  <div key={idx} className="rounded-[18px] bg-white p-4 border border-slate-200">
                    <p className="text-sm text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {Array.isArray(parsedChat.charts) && parsedChat.charts.length > 0 && (
            <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-5">Supporting charts</h3>
              <div className="grid gap-4 xl:grid-cols-2">
                {parsedChat.charts.map((chart: any, chartIndex: number) => (
                  <div key={chartIndex} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="font-semibold text-slate-900 mb-4">{chart.title || `Chart ${chartIndex + 1}`}</p>
                    <div className="space-y-3">
                      {Array.isArray(chart.data) && chart.data.map((row: any, rowIndex: number) => {
                        const value = Number(row.value) || 0;
                        const width = Math.min(100, Math.round((value / getChartMaxValue(chart)) * 100));
                        return (
                          <div key={rowIndex}>
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                              <span>{row.label}</span>
                              <span>{value}</span>
                            </div>
                            <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${width}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Organogram</h3>
                <p className="text-sm text-slate-600">A structured leadership diagram for rapid organisational context.</p>
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <OrgChart rows={orgRows} />
            </div>
          </div>
        </div>
      )}

      {/* Diagnoses */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : diagnoses.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No diagnoses yet"
          description="AI diagnoses will be generated once evaluation responses are collected and analyzed."
          actionLabel="View Evaluations"
          onAction={() => (window.location.href = '/evaluations')}
        />
      ) : (
        <div className="space-y-4">
          {diagnoses.map((diagnosis) => (
            <div key={diagnosis.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div
                className="p-6 cursor-pointer hover:bg-slate-50 transition flex justify-between items-start"
                onClick={() => setExpandedId(expandedId === diagnosis.id ? null : diagnosis.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900 text-lg">{diagnosis.evaluation.title}</h3>
                    {diagnosis.isAiGenerated && (
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium">
                        🤖 AI Generated
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">Created {new Date(diagnosis.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium px-3 py-1 rounded flex items-center gap-2 ${STATUS_CONFIG[diagnosis.status].color}`}>
                    {STATUS_CONFIG[diagnosis.status].icon} {STATUS_CONFIG[diagnosis.status].label}
                  </span>
                  <button className="text-slate-400 hover:text-slate-600">
                    {expandedId === diagnosis.id ? '▼' : '▶'}
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === diagnosis.id && (
                <div className="border-t border-slate-200 bg-slate-50 p-6 space-y-6">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Executive Summary</h4>
                    <p className="text-slate-700 text-sm">{diagnosis.sections.executiveSummary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-green-700 mb-2">💪 Strengths</h4>
                      <ul className="space-y-2">
                        {diagnosis.sections.strengths.map((item, idx) => (
                          <li key={idx} className="text-sm text-slate-700 flex gap-2">
                            <span className="text-green-600">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-orange-700 mb-2">⚠️ Weaknesses</h4>
                      <ul className="space-y-2">
                        {diagnosis.sections.weaknesses.map((item, idx) => (
                          <li key={idx} className="text-sm text-slate-700 flex gap-2">
                            <span className="text-orange-600">!</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">💡 Opportunities</h4>
                    <ul className="space-y-2">
                      {diagnosis.sections.opportunities.map((item, idx) => (
                        <li key={idx} className="text-sm text-slate-700 flex gap-2">
                          <span className="text-blue-600">→</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {diagnosis.sections.actionPlan?.length ? (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">🧭 Action Plan</h4>
                      <div className="space-y-3">
                        {diagnosis.sections.actionPlan.map((item, idx) => (
                          <div key={idx} className="border border-slate-200 rounded-lg p-3 bg-white">
                            <p className="text-sm font-semibold text-slate-900">{item.what}</p>
                            <p className="text-xs text-slate-500 mt-1">Who: {item.who} • When: {item.when}</p>
                            <p className="text-sm text-slate-700 mt-2">How: {item.how}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex justify-between items-center">
                      <div>
                        {diagnosis.status === 'APPROVED' && diagnosis.approvedBy && (
                          <p className="text-sm text-slate-600">Approved by <span className="font-medium">{diagnosis.approvedBy.name}</span></p>
                        )}
                      </div>
                      {diagnosis.status === 'PENDING_REVIEW' && (
                        <div className="flex gap-2">
                          <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                            Reject
                          </button>
                          <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                            Approve
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
