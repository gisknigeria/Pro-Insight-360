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
    <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
      <AppIcon name="mail" className="mb-3 h-9 w-9 text-gray-400" />
      <h4 className="font-semibold text-gray-700 mb-1">{title}</h4>
      <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>
      {action}
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: AppIconName; color?: string }) {
  return (
    <div className="border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-5 text-white shadow-xl shadow-slate-900/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-slate-300">{label}</span>
        <span className={`border border-white/10 bg-white/10 p-3 text-white`}>
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

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="border border-slate-900 bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/10">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Client Admin</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Organisation Performance Dashboard</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">Monitor response activity, department progress, completion signals, and published insight readiness for your organisation.</p>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <StatCard label="Assigned Forms" value={forms.length} icon="clipboard" color="blue" />
        <StatCard label="Completion Rate" value={`${completionRate}%`} icon="check" color="green" />
        <StatCard label="Overdue Forms" value={overdueCount} icon="alert" color={overdueCount > 0 ? "red" : "green"} />
        <StatCard label="Org Score" value={orgScore} icon="chart" color="yellow" />
      </div>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Respondent Completion */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Respondent Completion</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Respondents</span>
              <span className="font-semibold">{sampleRespondentStats.totalRespondents}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="font-semibold text-green-600">{sampleRespondentStats.completed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">In Progress</span>
              <span className="font-semibold text-yellow-600">{sampleRespondentStats.inProgress}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Not Started</span>
              <span className="font-semibold text-gray-600">{sampleRespondentStats.notStarted}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full"
                style={{ width: `${(sampleRespondentStats.completed / sampleRespondentStats.totalRespondents) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">
              {Math.round((sampleRespondentStats.completed / sampleRespondentStats.totalRespondents) * 100)}% overall completion
            </p>
          </div>
        </div>

        {/* Assigned Forms */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Assigned Forms</h3>
            <button className="text-sm text-primary hover:underline">View All</button>
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
                  <tr className="border-b border-gray-200 text-gray-600">
                    <th className="text-left py-2 px-3 font-medium">Form Name</th>
                    <th className="text-left py-2 px-3 font-medium">Status</th>
                    <th className="text-left py-2 px-3 font-medium">Due Date</th>
                    <th className="text-left py-2 px-3 font-medium">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {forms.map((form) => (
                    <tr key={form.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-3 font-medium text-gray-800">{form.formName}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            form.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : form.status === "in_progress"
                              ? "bg-amber-100 text-amber-800"
                              : form.status === "overdue"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {form.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-600">{form.dueDate}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                form.progress === 100
                                  ? "bg-green-500"
                                  : form.progress > 0
                                  ? "bg-amber-500"
                                  : "bg-gray-300"
                              }`}
                              style={{ width: `${form.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 w-8">{form.progress}%</span>
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
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Department-Level Scores</h3>
        {deptScores.length === 0 ? (
          <EmptyState
            title="No score data available"
            description="Department scores will appear here once evaluations have been completed."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-600">
                  <th className="text-left py-2 px-3 font-medium">Department</th>
                  <th className="text-left py-2 px-3 font-medium">Digital Readiness</th>
                  <th className="text-left py-2 px-3 font-medium">GIS Readiness</th>
                  <th className="text-left py-2 px-3 font-medium">Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {deptScores.map((dept) => (
                  <tr key={dept.name} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium text-gray-800">{dept.name}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold w-8">{dept.digitalReadiness}</span>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-amber-500 h-2 rounded-full"
                            style={{ width: `${dept.digitalReadiness}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold w-8">{dept.gisReadiness}</span>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${dept.gisReadiness}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-gray-700">{dept.completionRate}%</span>
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
