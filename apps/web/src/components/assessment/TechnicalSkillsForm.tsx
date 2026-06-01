"use client"
import React, { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

export type SkillLevel = "none" | "basic" | "intermediate" | "advanced" | "expert";

export interface SkillArea {
  id: string;
  name: string;
  category: string;
  level: SkillLevel;
  department?: string;
}

export interface TechnicalSkillsAssessment {
  skills: SkillArea[];
  overallScore: number;
  champions: string[]; // Names of GIS champions
  trainingNeedsIndex: number; // 0-100
}

// ── Constants ──────────────────────────────────────────────────────────────

const SKILL_LEVELS: Record<SkillLevel, { label: string; score: number; color: string }> = {
  none: { label: "None", score: 0, color: "bg-red-100 text-red-800" },
  basic: { label: "Basic", score: 25, color: "bg-orange-100 text-orange-800" },
  intermediate: { label: "Intermediate", score: 50, color: "bg-yellow-100 text-yellow-800" },
  advanced: { label: "Advanced", score: 75, color: "bg-blue-100 text-blue-800" },
  expert: { label: "Expert", score: 100, color: "bg-green-100 text-green-800" },
};

const SKILL_CATEGORIES = [
  { id: "gis_core", name: "GIS Core Skills" },
  { id: "data_management", name: "Data Management" },
  { id: "analysis", name: "Spatial Analysis" },
  { id: "programming", name: "Programming & Automation" },
  { id: "web_gis", name: "Web GIS" },
  { id: "cartography", name: "Cartography & Visualization" },
];

const DEFAULT_SKILLS: Omit<SkillArea, "id" | "level">[] = [
  // GIS Core Skills
  { name: "ArcGIS Desktop/Pro", category: "gis_core" },
  { name: "QGIS", category: "gis_core" },
  { name: "GPS Data Collection", category: "gis_core" },
  { name: "Remote Sensing Basics", category: "gis_core" },
  
  // Data Management
  { name: "Spatial Data Editing", category: "data_management" },
  { name: "Geodatabase Management", category: "data_management" },
  { name: "Data Quality Assurance", category: "data_management" },
  { name: "Coordinate Systems & Projections", category: "data_management" },
  
  // Spatial Analysis
  { name: "Spatial Analysis Techniques", category: "analysis" },
  { name: "Network Analysis", category: "analysis" },
  { name: "3D Analysis", category: "analysis" },
  { name: "Geoprocessing Modeling", category: "analysis" },
  
  // Programming & Automation
  { name: "Python for GIS", category: "programming" },
  { name: "SQL/Database Queries", category: "programming" },
  { name: "ArcPy/Arcade", category: "programming" },
  { name: "JavaScript", category: "programming" },
  
  // Web GIS
  { name: "ArcGIS Online/Enterprise", category: "web_gis" },
  { name: "Web Map Development", category: "web_gis" },
  { name: "Story Maps", category: "web_gis" },
  { name: "GIS Server Administration", category: "web_gis" },
  
  // Cartography & Visualization
  { name: "Map Design Principles", category: "cartography" },
  { name: "Data Visualization", category: "cartography" },
  { name: "Layout & Print Production", category: "cartography" },
  { name: "Interactive Dashboard Creation", category: "cartography" },
];

// ── Skill Level Selector ───────────────────────────────────────────────────

interface SkillLevelSelectorProps {
  value: SkillLevel;
  onChange: (level: SkillLevel) => void;
}

function SkillLevelSelector({ value, onChange }: SkillLevelSelectorProps) {
  return (
    <div className="flex gap-1">
      {(Object.keys(SKILL_LEVELS) as SkillLevel[]).map((level) => {
        const config = SKILL_LEVELS[level];
        const isSelected = value === level;
        return (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            className={`px-2 py-1 text-xs font-medium rounded transition ${
              isSelected
                ? config.color + " ring-2 ring-offset-1 ring-blue-400"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
            title={config.label}
          >
            {config.label.charAt(0)}
          </button>
        );
      })}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

interface TechnicalSkillsFormProps {
  onSubmit?: (assessment: TechnicalSkillsAssessment) => void;
  initialData?: Partial<TechnicalSkillsAssessment>;
}

export default function TechnicalSkillsForm({ onSubmit, initialData }: TechnicalSkillsFormProps) {
  const [skills, setSkills] = useState<SkillArea[]>(
    initialData?.skills ||
    DEFAULT_SKILLS.map((skill) => ({
      ...skill,
      id: crypto.randomUUID(),
      level: "none" as SkillLevel,
    }))
  );
  const [results, setResults] = useState<{
    overallScore: number;
    champions: string[];
    trainingNeedsIndex: number;
  } | null>(null);

  const updateSkillLevel = (id: string, level: SkillLevel) => {
    setSkills(skills.map((s) => (s.id === id ? { ...s, level } : s)));
  };

  const calculateResults = () => {
    const totalScore = skills.reduce((sum, s) => sum + SKILL_LEVELS[s.level].score, 0);
    const overallScore = Math.round(totalScore / skills.length);

    // Identify champions (Advanced or Expert in any skill)
    const champions = skills
      .filter((s) => s.level === "advanced" || s.level === "expert")
      .map((s) => s.name);

    // Training needs index (% of skills rated None or Basic)
    const lowSkills = skills.filter((s) => s.level === "none" || s.level === "basic").length;
    const trainingNeedsIndex = Math.round((lowSkills / skills.length) * 100);

    return { overallScore, champions, trainingNeedsIndex };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const results = calculateResults();
    setResults(results);
    onSubmit?.({
      skills,
      overallScore: results.overallScore,
      champions: results.champions,
      trainingNeedsIndex: results.trainingNeedsIndex,
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "bg-green-100 text-green-800 border-green-300";
    if (score >= 50) return "bg-blue-100 text-blue-800 border-blue-300";
    if (score >= 30) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  const getBand = (score: number): string => {
    if (score >= 70) return "Advanced";
    if (score >= 50) return "Developing";
    if (score >= 30) return "Emerging";
    return "Nascent";
  };

  // Group skills by category
  const groupedSkills = skills.reduce(
    (acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    },
    {} as Record<string, SkillArea[]>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Technical Skills Assessment</h2>
        <p className="text-sm text-gray-500 mt-1">
          Rate staff technical skills across 11 key areas (per Requirement 11)
        </p>
      </div>

      {/* Results Summary */}
      {results && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-blue-700 mb-1">Overall Skills Score</div>
              <div className="text-4xl font-bold text-blue-900">{results.overallScore}</div>
            </div>
            <div className={`px-4 py-2 rounded-full border font-semibold ${getScoreColor(results.overallScore)}`}>
              {getBand(results.overallScore)}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Training Needs Index</div>
              <div className="text-2xl font-bold text-gray-800">{results.trainingNeedsIndex}%</div>
              <div className="text-xs text-gray-400 mt-1">
                {results.trainingNeedsIndex > 50 ? "High training need" : "Moderate training need"}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 md:col-span-2">
              <div className="text-sm text-gray-500 mb-1">GIS Champions Identified</div>
              <div className="text-2xl font-bold text-gray-800">{results.champions.length} skills</div>
              <div className="text-xs text-gray-400 mt-1">
                {results.champions.length > 0
                  ? `Advanced/Expert in: ${results.champions.slice(0, 3).join(", ")}${results.champions.length > 3 ? ` +${results.champions.length - 3} more` : ""}`
                  : "No champions identified yet"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skills by Category */}
      {SKILL_CATEGORIES.map((category) => {
        const categorySkills = groupedSkills[category.id] || [];
        const categoryAvg =
          categorySkills.length > 0
            ? Math.round(
                categorySkills.reduce((sum, s) => sum + SKILL_LEVELS[s.level].score, 0) /
                  categorySkills.length
              )
            : 0;

        return (
          <div key={category.id} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                  {category.name.charAt(0)}
                </span>
                {category.name}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Category avg:</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded ${getScoreColor(categoryAvg)}`}>
                  {categoryAvg}
                </span>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Skill
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proficiency Level
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categorySkills.map((skill) => (
                    <tr key={skill.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        {skill.name}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <SkillLevelSelector
                            value={skill.level}
                            onChange={(level) => updateSkillLevel(skill.id, level)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-xs font-medium text-gray-600 mb-2">Proficiency Levels:</div>
        <div className="flex flex-wrap gap-3">
          {Object.entries(SKILL_LEVELS).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1">
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${config.color}`}>
                {config.label.charAt(0)}
              </span>
              <span className="text-xs text-gray-500">{config.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          Calculate & Save Assessment
        </button>
      </div>
    </form>
  );
}