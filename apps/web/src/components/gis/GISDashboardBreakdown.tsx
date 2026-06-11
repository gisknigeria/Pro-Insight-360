"use client"
import React from "react";

// ── Types ──────────────────────────────────────────────────────────────────

export type ScoreBand = "Nascent" | "Emerging" | "Developing" | "Advanced";

export interface GISScoreCategory {
  name: string;
  score: number;
  band: ScoreBand;
}

export interface DepartmentGISScore {
  department: string;
  overall: number;
  band: ScoreBand;
  categories: GISScoreCategory[];
}

export interface InfrastructureScore {
  overall: number;
  band: ScoreBand;
  components: {
    connectivity: number;
    hosting: number;
    backup: number;
    security: number;
  };
}

export interface SkillsBreakdown {
  overallScore: number;
  band: ScoreBand;
  trainingNeedsIndex: number;
  championsCount: number;
  byCategory: {
    category: string;
    averageScore: number;
  }[];
}

// ── Score Badge ────────────────────────────────────────────────────────────

interface ScoreBadgeProps {
  score: number;
  band: ScoreBand;
  size?: "sm" | "md" | "lg";
}

function ScoreBadge({ score, band, size = "md" }: ScoreBadgeProps) {
  const sizeClasses = {
    sm: "text-sm px-2 py-0.5",
    md: "text-base px-3 py-1",
    lg: "text-xl px-4 py-2",
  };

  const colorClasses: Record<ScoreBand, string> = {
    Advanced: "bg-green-100 text-green-800 border-green-300",
    Developing: "bg-amber-100 text-blue-800 border-blue-300",
    Emerging: "bg-yellow-100 text-yellow-800 border-yellow-300",
    Nascent: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <span className={`inline-flex items-center font-semibold rounded-full border ${colorClasses[band]} ${sizeClasses[size]}`}>
      {score} - {band}
    </span>
  );
}

// ── Progress Bar ───────────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
}

function ProgressBar({ value, max = 100, color = "blue", showLabel = true }: ProgressBarProps) {
  const percentage = (value / max) * 100;
  
  const colorClasses: Record<string, string> = {
    blue: "bg-amber-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
  };

  const getColor = () => {
    if (value >= 80) return colorClasses.green;
    if (value >= 60) return colorClasses.blue;
    if (value >= 40) return colorClasses.yellow;
    return colorClasses.red;
  };

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{showLabel ? `${value}%` : ""}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${getColor()} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ── GIS Score Breakdown Card ───────────────────────────────────────────────

interface GISScoreBreakdownCardProps {
  departmentScores: DepartmentGISScore[];
}

export function GISScoreBreakdownCard({ departmentScores }: GISScoreBreakdownCardProps) {
  if (!departmentScores || departmentScores.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">GIS Readiness by Department</h3>
        <p className="text-sm text-gray-500">No GIS assessment data available yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">GIS Readiness by Department</h3>
      <div className="space-y-4">
        {departmentScores.map((dept) => (
          <div key={dept.department} className="border border-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-800">{dept.department}</span>
              <ScoreBadge score={dept.overall} band={dept.band} size="sm" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {dept.categories.map((cat) => (
                <div key={cat.name}>
                  <div className="text-xs text-gray-500 mb-1">{cat.name}</div>
                  <ProgressBar value={cat.score} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Infrastructure Score Card ──────────────────────────────────────────────

interface InfrastructureScoreCardProps {
  score: InfrastructureScore;
}

export function InfrastructureScoreCard({ score }: InfrastructureScoreCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Infrastructure Readiness</h3>
        <ScoreBadge score={score.overall} band={score.band} size="sm" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[
          { name: "Connectivity", value: score.components.connectivity },
          { name: "Hosting", value: score.components.hosting },
          { name: "Backup & Recovery", value: score.components.backup },
          { name: "Security", value: score.components.security },
        ].map((item) => (
          <div key={item.name}>
            <div className="text-xs text-gray-500 mb-1">{item.name}</div>
            <div className="text-lg font-bold text-gray-800 mb-1">{item.value}</div>
            <ProgressBar value={item.value} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Skills Breakdown Card ──────────────────────────────────────────────────

interface SkillsBreakdownCardProps {
  skills: SkillsBreakdown;
}

export function SkillsBreakdownCard({ skills }: SkillsBreakdownCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Technical Skills Assessment</h3>
        <ScoreBadge score={skills.overallScore} band={skills.band} size="sm" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-sm text-yellow-700 mb-1">Training Needs Index</div>
          <div className="text-2xl font-bold text-yellow-900">{skills.trainingNeedsIndex}%</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-green-700 mb-1">GIS Champions</div>
          <div className="text-2xl font-bold text-green-900">{skills.championsCount}</div>
        </div>
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <div className="text-sm text-amber-800 mb-1">Skill Categories</div>
          <div className="text-2xl font-bold text-blue-900">{skills.byCategory.length}</div>
        </div>
      </div>

      <div className="space-y-3">
        {skills.byCategory.map((cat) => (
          <div key={cat.category}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">{cat.category}</span>
              <span className="text-sm font-medium text-gray-800">{cat.averageScore}</span>
            </div>
            <ProgressBar value={cat.averageScore} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main GIS Dashboard Component ───────────────────────────────────────────

interface GISDashboardBreakdownProps {
  departmentGISScores?: DepartmentGISScore[];
  infrastructureScore?: InfrastructureScore;
  skillsBreakdown?: SkillsBreakdown;
}

export default function GISDashboardBreakdown({
  departmentGISScores = [],
  infrastructureScore,
  skillsBreakdown,
}: GISDashboardBreakdownProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">GIS Readiness Dashboard</h2>
        <p className="text-sm text-gray-500">
          Comprehensive view of organisational GIS readiness across all dimensions
        </p>
      </div>

      {/* Department GIS Scores */}
      <GISScoreBreakdownCard departmentScores={departmentGISScores} />

      {/* Infrastructure and Skills side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {infrastructureScore && (
          <InfrastructureScoreCard score={infrastructureScore} />
        )}
        {skillsBreakdown && (
          <SkillsBreakdownCard skills={skillsBreakdown} />
        )}
      </div>
    </div>
  );
}