"use client"
import React, { useState, useMemo } from "react";
import type { Evaluation, ScoreSummary, Conflict, AIStatus } from "./dashboardTypes";

// ── Sample Data (replace with real API data) ───────────────────────────────

const sampleEvaluations: Evaluation[] = [
  { id: "eval-001", title: "Ministry of Health Digital Assessment", client: "MoH", status: "active", progress: 72, responses: 45, total: 60, deadline: "2026-06-15" },
  { id: "eval-002", title: "Education Dept GIS Readiness", client: "Dept of Education", status: "active", progress: 34, responses: 12, total: 35, deadline: "2026-06-30" },
  { id: "eval-003", title: "Housing Corp Workflow Analysis", client: "National Housing", status: "draft", progress: 0, responses: 0, total: 20, deadline: "2026-07-15" },
];

const sampleScores: ScoreSummary = {
  digitalReadiness: 67,
  gisReadiness: 54,
  categories: [
    { name: "Leadership", score: 78 },
    { name: "Strategy", score: 65 },
    { name: "People", score: 72 },
    { name: "Process", score: 58 },
    { name: "Data", score: 55 },
    { name: "Technology", score: 60 },
    { name: "Infrastructure", score: 48 },
    { name: "Security", score: 70 },
    { name: "Innovation", score: 52 },
    { name: "Governance", score: 68 },
    { name: "Culture", score: 75 },
    { name: "Skills", score: 62 },
    { name: "Resources", score: 50 },
    { name: "Partnerships", score: 58 },
  ],
};

const sampleConflicts: Conflict[] = [
  { id: "c1", question: "Q12: Budget allocation for GIS", severity: "high", respondents: ["R001", "R003"], values: ["$50K", "$200K"] },
  { id: "c2", question: "Q27: Primary data source", severity: "medium", respondents: ["R005", "R012"], values: ["Internal", "External"] },
];

const sampleAIStatus: AIStatus = {
  diagnosesGenerated: 3,
  pendingReview: 2,
  approved: 1,
  lastGenerated: "2026-06-01T14:30:00Z",
};

// ── Filter State ───────────────────────────────────────────────────────────

interface DashboardFilters {
  department: string;
  dimension: string;
  dateRange: { start: string; end: string };
}

const defaultFilters: DashboardFilters = {
  department: "all",
  dimension: "all",
  dateRange: { start: "", end: "" },
};

// ── Empty State Component ──────────────────────────────────────────────────

function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
      <div className="text-4xl mb-3">📭</div>
      <h4 className="font-semibold text-gray-700 mb-1">{title}</h4>
      <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>
      {action}
    </div>
  );
}

// ── Stat Card Component ────────────────────────────────────────────────────

function StatCard({ label, value, icon, trend }: { label: string; value: string | number; icon: string; trend?: "up" | "down" | "neutral" }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      {trend && (
        <div className={`text-xs mt-1 ${trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-500"}`}>
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} vs last week
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard Component ───────────────────────────────────────────────

export default function ConsultantDashboard() {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [evaluations] = useState<Evaluation[]>(sampleEvaluations);

  const activeCount = useMemo(() => evaluations.filter((e) => e.status === "active").length, [evaluations]);
  const draftCount = useMemo(() => evaluations.filter((e) => e.status === "draft").length, [evaluations]);
  const totalResponses = useMemo(() => evaluations.reduce((sum, e) => sum + e.responses, 0), [evaluations]);
  const totalRespondents = useMemo(() => evaluations.reduce((sum, e) => sum + e.total, 0), [evaluations]);
  const overallProgress = totalRespondents > 0 ? Math.round((totalResponses / totalRespondents) * 100) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Consultant Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your active evaluations and AI diagnosis status</p>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            >
              <option value="all">All Departments</option>
              <option value="ict">ICT</option>
              <option value="finance">Finance</option>
              <option value="operations">Operations</option>
              <option value="hr">Human Resources</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Evaluation Dimension</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={filters.dimension}
              onChange={(e) => setFilters({ ...filters, dimension: e.target.value })}
            >
              <option value="all">All Dimensions</option>
              <option value="who">WHO (Governance)</option>
              <option value="what">WHAT (Strategy)</option>
              <option value="how">HOW (Operations)</option>
              <option value="when">WHEN (Timeline)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date Range</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={filters.dateRange.start}
              onChange={(e) => setFilters({ ...filters, dateRange: { ...filters.dateRange, start: e.target.value } })}
            />
          </div>
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Evaluations" value={activeCount} icon="📊" trend="up" />
        <StatCard label="Draft Evaluations" value={draftCount} icon="📝" />
        <StatCard label="Total Responses" value={totalResponses} icon="✅" trend="up" />
        <StatCard label="Overall Progress" value={`${overallProgress}%`} icon="📈" trend={overallProgress > 50 ? "up" : "neutral"} />
      </div>

      {/* ── Main Content Grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Active Evaluations */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Active Evaluations</h3>
            <button className="text-sm text-primary hover:underline">View All</button>
          </div>
          {evaluations.length === 0 ? (
            <EmptyState
              title="No evaluations yet"
              description="Create your first evaluation to start collecting responses and generating insights."
              action={
                <button className="px-4 py-2 bg-amber-500 text-white rounded text-sm hover:bg-primary">
                  Create Evaluation
                </button>
              }
            />
          ) : (
            <div className="space-y-3">
              {evaluations.map((eval_) => (
                <div key={eval_.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-800">{eval_.title}</h4>
                      <p className="text-xs text-gray-500">{eval_.client}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        eval_.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {eval_.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                    <span>{eval_.responses}/{eval_.total} responses</span>
                    <span>Deadline: {eval_.deadline}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all"
                      style={{ width: `${eval_.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Diagnosis Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">AI Diagnosis Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Generated</span>
              <span className="font-semibold text-gray-800">{sampleAIStatus.diagnosesGenerated}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending Review</span>
              <span className="font-semibold text-yellow-600">{sampleAIStatus.pendingReview}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Approved</span>
              <span className="font-semibold text-green-600">{sampleAIStatus.approved}</span>
            </div>
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Last generated: {new Date(sampleAIStatus.lastGenerated).toLocaleString()}
              </p>
            </div>
          </div>
          <button className="w-full mt-4 px-4 py-2 border border-blue-500 text-primary rounded text-sm hover:bg-amber-50 transition">
            Review Diagnoses
          </button>
        </div>
      </div>

      {/* ── Bottom Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Score Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-3xl font-bold text-primary">{sampleScores.digitalReadiness}</div>
              <div className="text-xs text-gray-600 mt-1">Digital Readiness</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{sampleScores.gisReadiness}</div>
              <div className="text-xs text-gray-600 mt-1">GIS Readiness</div>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-xs font-medium text-gray-600 mb-2">By Category</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sampleScores.categories.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{cat.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${cat.score}%` }}
                      />
                    </div>
                    <span className="text-gray-700 font-medium w-8 text-right">{cat.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conflicts */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Conflicts ({sampleConflicts.length})</h3>
            <button className="text-sm text-primary hover:underline">View All</button>
          </div>
          {sampleConflicts.length === 0 ? (
            <EmptyState
              title="No conflicts detected"
              description="All responses are consistent. No contradictory data found."
            />
          ) : (
            <div className="space-y-3">
              {sampleConflicts.map((conflict) => (
                <div key={conflict.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium text-gray-800">{conflict.question}</span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        conflict.severity === "high"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {conflict.severity}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {conflict.respondents.join(" vs ")}: {conflict.values.join(" vs ")}
                  </div>
                  <button className="text-xs text-primary hover:underline mt-2">Resolve</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}