"use client"
import React, { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

export interface GISReadinessResponse {
  // GIS Data & Content (Questions 1-4)
  spatialDataAvailability: number; // 0-100
  dataQuality: number; // 0-100
  dataAccessibility: number; // 0-100
  dataMaintenance: number; // 0-100

  // GIS Technology & Infrastructure (Questions 5-7)
  softwareCapability: number; // 0-100
  hardwareAdequacy: number; // 0-100
  networkInfrastructure: number; // 0-100

  // GIS People & Skills (Questions 8-9)
  staffCompetency: number; // 0-100
  trainingAvailability: number; // 0-100

  // GIS Governance & Strategy (Questions 10-11)
  governanceFramework: number; // 0-100
  strategicAlignment: number; // 0-100
}

export interface GISReadinessScore {
  overall: number;
  band: "Nascent" | "Emerging" | "Developing" | "Advanced";
  categories: {
    dataContent: number;
    technology: number;
    peopleSkills: number;
    governance: number;
  };
}

// ── GIS Readiness Questions (11 key questions from Requirement 12) ────────

const questions = [
  // GIS Data & Content
  { id: "spatialDataAvailability", category: "dataContent", label: "Spatial Data Availability", description: "To what extent does your department have access to relevant spatial data (maps, satellite imagery, GPS data)?" },
  { id: "dataQuality", category: "dataContent", label: "Data Quality", description: "How accurate, complete, and up-to-date is the spatial data used in your operations?" },
  { id: "dataAccessibility", category: "dataContent", label: "Data Accessibility", description: "How easily can staff access and use spatial data for their daily tasks?" },
  { id: "dataMaintenance", category: "dataContent", label: "Data Maintenance", description: "Is there a systematic process for updating and maintaining spatial data?" },

  // GIS Technology & Infrastructure
  { id: "softwareCapability", category: "technology", label: "GIS Software Capability", description: "Do you have access to appropriate GIS software (e.g., ArcGIS, QGIS) for your needs?" },
  { id: "hardwareAdequacy", category: "technology", label: "Hardware Adequacy", description: "Is your computer hardware (CPU, RAM, graphics) sufficient for GIS operations?" },
  { id: "networkInfrastructure", category: "technology", label: "Network Infrastructure", description: "Does your network support web-based GIS applications and large data transfers?" },

  // GIS People & Skills
  { id: "staffCompetency", category: "peopleSkills", label: "Staff GIS Competency", description: "How would you rate the GIS skills and knowledge of your department staff?" },
  { id: "trainingAvailability", category: "peopleSkills", label: "Training Availability", description: "Are there adequate GIS training opportunities available for staff development?" },

  // GIS Governance & Strategy
  { id: "governanceFramework", category: "governance", label: "GIS Governance Framework", description: "Is there a formal GIS policy or governance framework in your organisation?" },
  { id: "strategicAlignment", category: "governance", label: "Strategic Alignment", description: "Is GIS integrated into your department's strategic planning and decision-making?" },
];

// ── Score Computation ──────────────────────────────────────────────────────

export function computeGISScore(response: GISReadinessResponse): GISReadinessScore {
  const dataContent = (
    response.spatialDataAvailability +
    response.dataQuality +
    response.dataAccessibility +
    response.dataMaintenance
  ) / 4;

  const technology = (
    response.softwareCapability +
    response.hardwareAdequacy +
    response.networkInfrastructure
  ) / 3;

  const peopleSkills = (
    response.staffCompetency +
    response.trainingAvailability
  ) / 2;

  const governance = (
    response.governanceFramework +
    response.strategicAlignment
  ) / 2;

  const overall = (dataContent + technology + peopleSkills + governance) / 4;

  let band: GISReadinessScore["band"] = "Nascent";
  if (overall >= 80) band = "Advanced";
  else if (overall >= 60) band = "Developing";
  else if (overall >= 40) band = "Emerging";

  return {
    overall: Math.round(overall),
    band,
    categories: {
      dataContent: Math.round(dataContent),
      technology: Math.round(technology),
      peopleSkills: Math.round(peopleSkills),
      governance: Math.round(governance),
    },
  };
}

// ── Slider Component ───────────────────────────────────────────────────────

interface SliderProps {
  id: string;
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
}

function Slider({ id, label, description, value, onChange }: SliderProps) {
  return (
    <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
      <label htmlFor={id} className="block font-medium text-gray-800 mb-1">
        {label}
      </label>
      <p className="text-sm text-gray-500 mb-3">{description}</p>
      <div className="flex items-center gap-4">
        <input
          type="range"
          id={id}
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <span className="w-12 text-center font-semibold text-lg text-blue-600">{value}</span>
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>Not Ready</span>
        <span>Fully Ready</span>
      </div>
    </div>
  );
}

// ── Category Summary ───────────────────────────────────────────────────────

function CategorySummary({
  name,
  score,
  questions,
}: {
  name: string;
  score: number;
  questions: number;
}) {
  const getColor = (s: number) => {
    if (s >= 80) return "bg-green-500";
    if (s >= 60) return "bg-yellow-500";
    if (s >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <div className="font-medium text-gray-800">{name}</div>
        <div className="text-xs text-gray-500">{questions} questions</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-24 bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full ${getColor(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="font-bold text-gray-800 w-10 text-right">{score}</span>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

interface GISReadinessFormProps {
  onSubmit?: (response: GISReadinessResponse, score: GISReadinessScore) => void;
  initialData?: Partial<GISReadinessResponse>;
}

export default function GISReadinessForm({ onSubmit, initialData }: GISReadinessFormProps) {
  const [responses, setResponses] = useState<GISReadinessResponse>({
    spatialDataAvailability: initialData?.spatialDataAvailability || 0,
    dataQuality: initialData?.dataQuality || 0,
    dataAccessibility: initialData?.dataAccessibility || 0,
    dataMaintenance: initialData?.dataMaintenance || 0,
    softwareCapability: initialData?.softwareCapability || 0,
    hardwareAdequacy: initialData?.hardwareAdequacy || 0,
    networkInfrastructure: initialData?.networkInfrastructure || 0,
    staffCompetency: initialData?.staffCompetency || 0,
    trainingAvailability: initialData?.trainingAvailability || 0,
    governanceFramework: initialData?.governanceFramework || 0,
    strategicAlignment: initialData?.strategicAlignment || 0,
  });

  const score = computeGISScore(responses);

  const updateResponse = (id: keyof GISReadinessResponse, value: number) => {
    setResponses((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(responses, score);
  };

  const categories = [
    {
      name: "GIS Data & Content",
      score: score.categories.dataContent,
      questions: 4,
      ids: ["spatialDataAvailability", "dataQuality", "dataAccessibility", "dataMaintenance"] as const,
    },
    {
      name: "GIS Technology & Infrastructure",
      score: score.categories.technology,
      questions: 3,
      ids: ["softwareCapability", "hardwareAdequacy", "networkInfrastructure"] as const,
    },
    {
      name: "GIS People & Skills",
      score: score.categories.peopleSkills,
      questions: 2,
      ids: ["staffCompetency", "trainingAvailability"] as const,
    },
    {
      name: "GIS Governance & Strategy",
      score: score.categories.governance,
      questions: 2,
      ids: ["governanceFramework", "strategicAlignment"] as const,
    },
  ];

  const getBandColor = (band: string) => {
    switch (band) {
      case "Advanced": return "bg-green-100 text-green-800 border-green-300";
      case "Developing": return "bg-blue-100 text-blue-800 border-blue-300";
      case "Emerging": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Nascent": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">GIS Readiness Assessment</h2>
        <p className="text-sm text-gray-500 mt-1">
          Rate your organisation's GIS readiness across 11 key areas (0-100 scale)
        </p>
      </div>

      {/* Live Score Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-blue-700 mb-1">GIS Readiness Score</div>
            <div className="text-4xl font-bold text-blue-900">{score.overall}</div>
          </div>
          <div className={`px-4 py-2 rounded-full border font-semibold ${getBandColor(score.band)}`}>
            {score.band}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <CategorySummary
              key={cat.name}
              name={cat.name}
              score={cat.score}
              questions={cat.questions}
            />
          ))}
        </div>
      </div>

      {/* Questions by Category */}
      {categories.map((category) => (
        <div key={category.name} className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
              {category.name.charAt(0)}
            </span>
            {category.name}
          </h3>
          <div className="space-y-2">
            {category.ids.map((id) => {
              const question = questions.find((q) => q.id === id);
              if (!question) return null;
              return (
                <Slider
                  key={id}
                  id={id}
                  label={question.label}
                  description={question.description}
                  value={responses[id]}
                  onChange={(val) => updateResponse(id, val)}
                />
              );
            })}
          </div>
        </div>
      ))}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          Save Assessment
        </button>
      </div>
    </form>
  );
}