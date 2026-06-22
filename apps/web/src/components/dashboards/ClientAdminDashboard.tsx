"use client"
import React, { useState, useMemo } from "react";
import type { FormAssignment, RespondentStats, DepartmentScore } from "./dashboardTypes";
import { AppIcon, type AppIconName } from "@/components/ui/app-icons";

// ── Sample Data ─────────────────────────────────────────────────────────────

const sampleForms: FormAssignment[] = [
  { id: "f1", formName: "Digital Readiness Assessment - ICT", status: "completed", dueDate: "2026-05-28", progress: 100 },
  { id: "f2", formName: "GIS Readiness Survey", status: "in_progress", dueDate: "2026-06-10", progress: 65 },
  { id: "f3", formName: "Infrastructure Assessment", status: "pending", dueDate: "2026-06-20", progress: 0 },
  { id: "f4", formName: "Technical Skills Inventory", status: "overdue", dueDate: "2026-05-25", progress: 30 },
];

const sampleRespondentStats: RespondentStats = {
  totalRespondents: 45,
  completed: 28,
  inProgress: 10,
  notStarted: 7,
};

const sampleDeptScores: DepartmentScore[] = [
  { name: "ICT", digitalReadiness: 78, gisReadiness: 65, completionRate: 92 },
  { name: "Finance", digitalReadiness: 62, gisReadiness: 48, completionRate: 78 },
  { name: "Operations", digitalReadiness: 55, gisReadiness: 52, completionRate: 65 },
  { name: "HR", digitalReadiness: 70, gisReadiness: 58, completionRate: 88 },
  { name: "Planning", digitalReadiness: 48, gisReadiness: 42, completionRate: 55 },
];

// ── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <AppIcon name="mail" className="mb-3 h-9 w-9 text-slate-400" />
      <h4 className="mb-1 font-semibold text-slate-900">{title}</h4>
      <p className="mb-4 max-w-sm text-sm text-slate-500">{description}</p>
      {action}
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, tone = "slate" }: { label: string; value: string | number; icon: AppIconName; color?: string; tone?: "blue" | "teal" | "amber" | "rose" | "slate" }) {
  const toneMap = {
    blue: "from-slate-900 via-slate-800 to-blue-950",
    teal: "from-slate-900 via-teal-950 to-emerald-950",
    amber: "from-slate-900 via-stone-900 to-amber-950",
    rose: "from-slate-900 via-rose-950 to-red-950",
    slate: "from-slate-950 via-slate-900 to-slate-950",
  };

  return (
    <div className={`border border-slate-800 bg-gradient-to-br ${toneMap[tone]} p-5 text-white shadow-xl shadow-slate-900/10`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-300">{label}</span>
        <span className="border border-white/10 bg-white/10 p-3 text-white">
          <AppIcon name={icon} className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-8 text-3xl font-black text-white">{value}</div>
      <div className="mt-4 h-px w-full bg-white/15"><div className="h-px w-2/3 bg-white/70" /></div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function ClientAdminDashboard() {
  const [forms] = useState<FormAssignment[]>(sampleForms);
  const [deptScores] = useState<DepartmentScore[]>(sampleDeptScores);

  const completionRate = useMemo(() => {
    const completed = forms.filter((f) => f.status === "completed").length;
    return forms.length > 0 ? Math.round((completed / forms.length) * 100) : 0;
  }, [forms]);

  const overdueCount = useMemo(() => forms.filter((f) => f.status === "overdue").length, [forms]);
  const orgScore = useMemo(() => {
    const avg = deptScores.reduce((sum, d) => sum + d.digitalReadiness, 0) / deptScores.length;
    return Math.round(avg);
  }, [deptScores]);

  const completionPercent = Math.round((sampleRespondentStats.completed / sampleRespondentStats.totalRespondents) * 100);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="border border-slate-900 bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/10">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Client Admin</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Organisation Performance Dashboard</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">Monitor response activity, department progress, completion signals, and published insight readiness for your organisation.</p>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <StatCard label="Assigned Forms" value={forms.length} icon="clipboard" tone="blue" />
        <StatCard label="Completion Rate" value={`${completionRate}%`} icon="check" tone="teal" />
        <StatCard label="Overdue Forms" value={overdueCount} icon="alert" tone={overdueCount > 0 ? "rose" : "teal"} />
        <StatCard label="Org Score" value={orgScore} icon="chart" tone="amber" />
      </div>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Respondent Completion */}
        <div className="border border-slate-300 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.08)]">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-950">Respondent Completion</h3>
              <p className="mt-1 text-xs text-slate-500">Current participation status across assigned questionnaires.</p>
            </div>
            <span className="border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Live</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Total Respondents</span>
              <span className="font-semibold text-slate-950">{sampleRespondentStats.totalRespondents}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Completed</span>
              <span className="font-semibold text-emerald-700">{sampleRespondentStats.completed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">In Progress</span>
              <span className="font-semibold text-amber-700">{sampleRespondentStats.inProgress}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Not Started</span>
              <span className="font-semibold text-slate-700">{sampleRespondentStats.notStarted}</span>
            </div>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="h-3 w-full bg-slate-200">
              <div
                className="h-3 bg-emerald-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <p className="mt-2 text-center text-xs font-semibold text-slate-500">
              {completionPercent}% overall completion
            </p>
          </div>
        </div>

        {/* Assigned Forms */}
        <div className="border border-slate-300 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.08)] lg:col-span-2">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-950">Assigned Forms</h3>
              <p className="mt-1 text-xs text-slate-500">Questionnaires currently driving the organisation insight pipeline.</p>
            </div>
            <button className="border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 hover:bg-slate-50">View All</button>
          </div>
          {forms.length === 0 ? (
            <EmptyState
              title="No forms assigned"
              description="You haven't been assigned any evaluation forms yet. Check back later or contact your administrator."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-950 text-white">
                    <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-widest">Form Name</th>
                    <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-widest">Status</th>
                    <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-widest">Due Date</th>
                    <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-widest">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {forms.map((form) => (
                    <tr key={form.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-3 font-medium text-slate-900">{form.formName}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-1 text-xs font-bold ${
                            form.status === "completed"
                              ? "bg-emerald-50 text-emerald-700"
                              : form.status === "in_progress"
                              ? "bg-amber-100 text-amber-800"
                              : form.status === "overdue"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {form.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{form.dueDate}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 bg-slate-200">
                            <div
                              className={`h-2 ${
                                form.progress === 100
                                  ? "bg-emerald-500"
                                  : form.progress > 0
                                  ? "bg-amber-500"
                                  : "bg-slate-300"
                              }`}
                              style={{ width: `${form.progress}%` }}
                            />
                          </div>
                          <span className="w-8 text-xs text-slate-600">{form.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Department Scores ────────────────────────────────────────────── */}
      <div className="border border-slate-300 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.08)]">
        <h3 className="mb-1 font-bold text-slate-950">Department-Level Scores</h3>
        <p className="mb-4 text-xs text-slate-500">Department readiness and completion metrics for management review.</p>
        {deptScores.length === 0 ? (
          <EmptyState
            title="No score data available"
            description="Department scores will appear here once evaluations have been completed."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-950 text-white">
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-widest">Department</th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-widest">Digital Readiness</th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-widest">GIS Readiness</th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-widest">Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {deptScores.map((dept) => (
                  <tr key={dept.name} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-slate-900">{dept.name}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-8 font-semibold text-slate-900">{dept.digitalReadiness}</span>
                        <div className="h-2 w-24 bg-slate-200">
                          <div
                            className="h-2 bg-amber-500"
                            style={{ width: `${dept.digitalReadiness}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-8 font-semibold text-slate-900">{dept.gisReadiness}</span>
                        <div className="h-2 w-24 bg-slate-200">
                          <div
                            className="h-2 bg-emerald-500"
                            style={{ width: `${dept.gisReadiness}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-700">{dept.completionRate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
