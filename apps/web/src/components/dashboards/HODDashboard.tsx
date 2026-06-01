"use client"
import React, { useState, useMemo } from "react";
import type { DepartmentScore } from "./dashboardTypes";

// ── Sample Data ─────────────────────────────────────────────────────────────

const sampleDeptScores: DepartmentScore[] = [
  { name: "ICT Division", digitalReadiness: 78, gisReadiness: 65, completionRate: 92 },
  { name: "Finance", digitalReadiness: 62, gisReadiness: 48, completionRate: 78 },
  { name: "Operations", digitalReadiness: 55, gisReadiness: 52, completionRate: 65 },
  { name: "HR", digitalReadiness: 70, gisReadiness: 58, completionRate: 88 },
  { name: "Planning", digitalReadiness: 48, gisReadiness: 42, completionRate: 55 },
];

const sampleMyDeptScore: DepartmentScore = {
  name: "ICT Division",
  digitalReadiness: 78,
  gisReadiness: 65,
  completionRate: 92,
};

const sampleSubScores = {
  who: 82, // Governance
  what: 75, // Strategy
  how: 68, // Operations
  when: 71, // Timeline
};

// ── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
      <div className="text-4xl mb-3">📭</div>
      <h4 className="font-semibold text-gray-700 mb-1">{title}</h4>
      <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color = "blue" }: { label: string; value: string | number; icon: string; color?: string }) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{label}</span>
        <span className={`text-xl p-2 rounded ${colorClasses[color] || colorClasses.blue}`}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function HODDashboard() {
  const [deptScores] = useState<DepartmentScore[]>(sampleDeptScores);

  const deptAverage = useMemo(() => {
    const dr = deptScores.reduce((sum, d) => sum + d.digitalReadiness, 0) / deptScores.length;
    const gr = deptScores.reduce((sum, d) => sum + d.gisReadiness, 0) / deptScores.length;
    return { digitalReadiness: Math.round(dr), gisReadiness: Math.round(gr) };
  }, [deptScores]);

  const maturityBand = (score: number): string => {
    if (score >= 80) return "Optimising";
    if (score >= 60) return "Defined";
    if (score >= 40) return "Developing";
    return "Initial";
  };

  const gisBand = (score: number): string => {
    if (score >= 80) return "Advanced";
    if (score >= 60) return "Developing";
    if (score >= 40) return "Emerging";
    return "Nascent";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Head of Department Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Department-level scores and completion overview</p>
      </div>

      {/* ── My Department Highlight ────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">Your Department: {sampleMyDeptScore.name}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Digital Readiness</div>
            <div className="text-3xl font-bold text-blue-600">{sampleMyDeptScore.digitalReadiness}</div>
            <div className="text-xs text-gray-500 mt-1">Band: {maturityBand(sampleMyDeptScore.digitalReadiness)}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">GIS Readiness</div>
            <div className="text-3xl font-bold text-green-600">{sampleMyDeptScore.gisReadiness}</div>
            <div className="text-xs text-gray-500 mt-1">Band: {gisBand(sampleMyDeptScore.gisReadiness)}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Completion Rate</div>
            <div className="text-3xl font-bold text-purple-600">{sampleMyDeptScore.completionRate}%</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Dimension Scores</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span>WHO:</span><span className="font-medium">{sampleSubScores.who}</span></div>
              <div className="flex justify-between"><span>WHAT:</span><span className="font-medium">{sampleSubScores.what}</span></div>
              <div className="flex justify-between"><span>HOW:</span><span className="font-medium">{sampleSubScores.how}</span></div>
              <div className="flex justify-between"><span>WHEN:</span><span className="font-medium">{sampleSubScores.when}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Dept Digital Readiness" value={sampleMyDeptScore.digitalReadiness} icon="📊" color="blue" />
        <StatCard label="Dept GIS Readiness" value={sampleMyDeptScore.gisReadiness} icon="🗺️" color="green" />
        <StatCard label="Dept Completion" value={`${sampleMyDeptScore.completionRate}%`} icon="✅" color="purple" />
        <StatCard label="Org Average DR" value={deptAverage.digitalReadiness} icon="📈" color="yellow" />
      </div>

      {/* ── Department Comparison ────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">All Department Scores</h3>
        {deptScores.length === 0 ? (
          <EmptyState
            title="No department data"
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
                  <th className="text-left py-2 px-3 font-medium">Completion</th>
                </tr>
              </thead>
              <tbody>
                {deptScores.map((dept) => (
                  <tr
                    key={dept.name}
                    className={`border-b border-gray-100 ${
                      dept.name === sampleMyDeptScore.name ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="py-3 px-3 font-medium text-gray-800">
                      {dept.name}
                      {dept.name === sampleMyDeptScore.name && (
                        <span className="ml-2 text-xs text-blue-600">(You)</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold w-8">{dept.digitalReadiness}</span>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${dept.digitalReadiness}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-16">{maturityBand(dept.digitalReadiness)}</span>
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
                        <span className="text-xs text-gray-500 w-16">{gisBand(dept.gisReadiness)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">{dept.completionRate}%</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              dept.completionRate >= 80
                                ? "bg-green-500"
                                : dept.completionRate >= 50
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${dept.completionRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Dimension Breakdown ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Your Department Dimensions</h3>
          <div className="space-y-4">
            {[
              { name: "WHO (Governance)", score: sampleSubScores.who, color: "blue" },
              { name: "WHAT (Strategy)", score: sampleSubScores.what, color: "green" },
              { name: "HOW (Operations)", score: sampleSubScores.how, color: "yellow" },
              { name: "WHEN (Timeline)", score: sampleSubScores.when, color: "purple" },
            ].map((dim) => (
              <div key={dim.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{dim.name}</span>
                  <span className="font-semibold">{dim.score}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      dim.color === "blue"
                        ? "bg-blue-500"
                        : dim.color === "green"
                        ? "bg-green-500"
                        : dim.color === "yellow"
                        ? "bg-yellow-500"
                        : "bg-purple-500"
                    }`}
                    style={{ width: `${dim.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Completion by Department</h3>
          <div className="space-y-3">
            {deptScores
              .sort((a, b) => b.completionRate - a.completionRate)
              .map((dept) => (
                <div key={dept.name} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-32 truncate">{dept.name}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        dept.completionRate >= 80
                          ? "bg-green-500"
                          : dept.completionRate >= 50
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${dept.completionRate}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold w-10 text-right">{dept.completionRate}%</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}