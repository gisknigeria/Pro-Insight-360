'use client';

import { useState, useEffect } from 'react';
import { EmptyState } from '@/components/ui/empty-state';

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
      .finally(() => setLoading(false));
  }, []);

  function extractJsonObject(text: string) {
    try {
      const jsonStart = text.indexOf('{');
      const jsonText = jsonStart >= 0 ? text.slice(jsonStart) : text;
      return JSON.parse(jsonText);
    } catch (error) {
      throw new Error('Unable to parse JSON from ChatGPT output. Please paste only valid JSON or remove any surrounding text/code fences.');
    }
  }

  function handleParseChatOutput() {
    setParseError('');
    try {
      const parsed = extractJsonObject(chatOutput.trim());
      setParsedChat(parsed);
    } catch (error: any) {
      setParsedChat(null);
      setParseError(error.message);
    }
  }

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
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Manual ChatGPT import</h2>
        <p className="text-sm text-slate-600 mb-4">
          Copy the response output from the evaluation page, paste it into ChatGPT, and ask for a structured JSON analysis. Then paste the ChatGPT JSON result here to render it in the app.
        </p>
        <div className="grid gap-4">
          <textarea
            value={chatOutput}
            onChange={(event) => setChatOutput(event.target.value)}
            rows={10}
            placeholder="Paste ChatGPT JSON output here"
            className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleParseChatOutput}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Parse and render ChatGPT output
          </button>
          {parseError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {parseError}
            </div>
          )}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900 mb-2">Recommended ChatGPT prompt</p>
            <pre className="whitespace-pre-wrap text-xs text-slate-600">{chatPromptTemplate}</pre>
          </div>
        </div>
      </div>

      {parsedChat && (
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Rendered ChatGPT analysis</h2>
          {parsedChat.executiveSummary && (
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 mb-2">Executive Summary</h3>
              <p className="text-slate-700 text-sm whitespace-pre-wrap">{parsedChat.executiveSummary}</p>
            </div>
          )}
          {Array.isArray(parsedChat.strengths) && parsedChat.strengths.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 mb-2">Strengths</h3>
              <ul className="list-disc list-inside text-slate-700 text-sm space-y-1">
                {parsedChat.strengths.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {Array.isArray(parsedChat.weaknesses) && parsedChat.weaknesses.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 mb-2">Weaknesses</h3>
              <ul className="list-disc list-inside text-slate-700 text-sm space-y-1">
                {parsedChat.weaknesses.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {Array.isArray(parsedChat.opportunities) && parsedChat.opportunities.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 mb-2">Opportunities</h3>
              <ul className="list-disc list-inside text-slate-700 text-sm space-y-1">
                {parsedChat.opportunities.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {Array.isArray(parsedChat.recommendations) && parsedChat.recommendations.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 mb-2">Recommendations</h3>
              <ul className="list-disc list-inside text-slate-700 text-sm space-y-1">
                {parsedChat.recommendations.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {Array.isArray(parsedChat.actionPlan) && parsedChat.actionPlan.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 mb-2">Action Plan</h3>
              <div className="space-y-3">
                {parsedChat.actionPlan.map((item: any, idx: number) => (
                  <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                    <p className="font-semibold text-slate-900">{item.what}</p>
                    <p className="text-slate-600 text-xs mt-1">Who: {item.who} • When: {item.when}</p>
                    <p className="text-slate-700 mt-2">How: {item.how}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {Array.isArray(parsedChat.charts) && parsedChat.charts.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 mb-2">Charts</h3>
              <div className="space-y-4">
                {parsedChat.charts.map((chart: any, chartIndex: number) => (
                  <div key={chartIndex} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900 mb-3">{chart.title}</p>
                    <div className="space-y-2">
                      {Array.isArray(chart.data) && chart.data.map((row: any, rowIndex: number) => (
                        <div key={rowIndex} className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>{row.label}</span>
                            <span>{row.value}</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${Math.min(100, Number(row.value) || 0)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {parsedChat.organogram && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Organogram</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Nodes</p>
                  <ul className="text-sm text-slate-700 space-y-2">
                    {Array.isArray(parsedChat.organogram.nodes) && parsedChat.organogram.nodes.map((node: any, idx: number) => (
                      <li key={idx}>{node.label} ({node.group || 'group'})</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Links</p>
                  <ul className="text-sm text-slate-700 space-y-2">
                    {Array.isArray(parsedChat.organogram.links) && parsedChat.organogram.links.map((link: any, idx: number) => (
                      <li key={idx}>{link.source} → {link.target} ({link.relation || 'relation'})</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
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
