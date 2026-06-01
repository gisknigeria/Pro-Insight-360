"use client"
import React, { useState, useMemo } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

export interface GISOpportunity {
  id: string;
  type: GISOpportunityType;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  feasibility: "high" | "medium" | "low";
  department?: string;
  estimatedCost?: string;
  timeline?: string;
}

export type GISOpportunityType =
  | "dataIntegration"
  | "processAutomation"
  | "capacityBuilding"
  | "infrastructureUpgrade"
  | "policyDevelopment"
  | "partnershipDevelopment"
  | "technologyAdoption"
  | "serviceDelivery"
  | "decisionSupport"
  | "resourceManagement"
  | "riskAssessment"
  | "publicEngagement"
  | "complianceReporting"
  | "innovation";

export interface GISOpportunityMatrixData {
  highImpactHighFeasibility: GISOpportunity[];
  highImpactLowFeasibility: GISOpportunity[];
  lowImpactHighFeasibility: GISOpportunity[];
  lowImpactLowFeasibility: GISOpportunity[];
}

// ── 14 GIS Opportunity Types ───────────────────────────────────────────────

const opportunityTypes: Record<GISOpportunityType, { label: string; description: string }> = {
  dataIntegration: { label: "Data Integration", description: "Combine spatial data from multiple sources for comprehensive analysis" },
  processAutomation: { label: "Process Automation", description: "Automate manual GIS workflows to improve efficiency" },
  capacityBuilding: { label: "Capacity Building", description: "Train staff to enhance GIS skills and knowledge" },
  infrastructureUpgrade: { label: "Infrastructure Upgrade", description: "Upgrade hardware, software, or network for better GIS performance" },
  policyDevelopment: { label: "Policy Development", description: "Establish GIS governance and data sharing policies" },
  partnershipDevelopment: { label: "Partnership Development", description: "Collaborate with other organisations for GIS data sharing" },
  technologyAdoption: { label: "Technology Adoption", description: "Implement new GIS technologies (e.g., web GIS, mobile GIS)" },
  serviceDelivery: { label: "Service Delivery", description: "Use GIS to improve public service delivery" },
  decisionSupport: { label: "Decision Support", description: "Develop GIS dashboards for evidence-based decision making" },
  resourceManagement: { label: "Resource Management", description: "Apply GIS for better natural resource management" },
  riskAssessment: { label: "Risk Assessment", description: "Use GIS for hazard mapping and risk analysis" },
  publicEngagement: { label: "Public Engagement", description: "Create public-facing GIS applications for citizen engagement" },
  complianceReporting: { label: "Compliance Reporting", description: "Use GIS for regulatory compliance and reporting" },
  innovation: { label: "Innovation", description: "Explore emerging GIS technologies (AI/ML, IoT, 3D modeling)" },
};

// ── Sample Opportunities ───────────────────────────────────────────────────

const sampleOpportunities: GISOpportunity[] = [
  { id: "o1", type: "dataIntegration", title: "Centralised Spatial Data Repository", description: "Create a single source of truth for all spatial data across departments", impact: "high", feasibility: "medium", department: "ICT", estimatedCost: "$50K-100K", timeline: "6-12 months" },
  { id: "o2", type: "capacityBuilding", title: "GIS Training Programme", description: "Comprehensive GIS training for all department staff", impact: "high", feasibility: "high", department: "HR", estimatedCost: "$20K-30K", timeline: "3-6 months" },
  { id: "o3", type: "technologyAdoption", title: "Web GIS Portal", description: "Deploy a web-based GIS portal for internal and external users", impact: "high", feasibility: "medium", department: "ICT", estimatedCost: "$80K-120K", timeline: "6-9 months" },
  { id: "o4", type: "processAutomation", title: "Automated Map Production", description: "Automate routine map generation for reports", impact: "medium", feasibility: "high", department: "Planning", estimatedCost: "$10K-20K", timeline: "2-3 months" },
  { id: "o5", type: "decisionSupport", title: "Executive Dashboard", description: "Real-time GIS dashboard for senior management", impact: "high", feasibility: "low", department: "Executive", estimatedCost: "$100K+", timeline: "12+ months" },
  { id: "o6", type: "infrastructureUpgrade", title: "Server Upgrade", description: "Upgrade GIS server infrastructure for better performance", impact: "medium", feasibility: "high", department: "ICT", estimatedCost: "$30K-50K", timeline: "3-4 months" },
  { id: "o7", type: "policyDevelopment", title: "GIS Data Policy", description: "Develop organisation-wide GIS data standards and policies", impact: "medium", feasibility: "medium", department: "Legal", estimatedCost: "$5K-10K", timeline: "4-6 months" },
  { id: "o8", type: "partnershipDevelopment", title: "Inter-Agency Data Sharing", description: "Establish data sharing agreements with partner agencies", impact: "high", feasibility: "low", department: "Executive", estimatedCost: "$5K-15K", timeline: "6-12 months" },
];

// ── Matrix Quadrant ────────────────────────────────────────────────────────

interface QuadrantProps {
  title: string;
  subtitle: string;
  opportunities: GISOpportunity[];
  color: string;
  onOpportunityClick?: (opp: GISOpportunity) => void;
}

function Quadrant({ title, subtitle, opportunities, color, onOpportunityClick }: QuadrantProps) {
  const colorClasses: Record<string, string> = {
    green: "bg-green-50 border-green-200",
    yellow: "bg-yellow-50 border-yellow-200",
    blue: "bg-blue-50 border-blue-200",
    gray: "bg-gray-50 border-gray-200",
  };

  const badgeClasses: Record<string, string> = {
    green: "bg-green-200 text-green-800",
    yellow: "bg-yellow-200 text-yellow-800",
    blue: "bg-blue-200 text-blue-800",
    gray: "bg-gray-200 text-gray-800",
  };

  return (
    <div className={`p-4 border rounded-lg ${colorClasses[color] || colorClasses.gray}`}>
      <div className="mb-3">
        <h4 className="font-semibold text-gray-800">{title}</h4>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
      {opportunities.length === 0 ? (
        <div className="text-sm text-gray-400 italic">No opportunities identified</div>
      ) : (
        <div className="space-y-2">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              onClick={() => onOpportunityClick?.(opp)}
              className="bg-white p-3 rounded border border-gray-200 cursor-pointer hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-800">{opp.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{opp.description}</div>
                  {opp.department && (
                    <div className="text-xs text-gray-400 mt-1">{opp.department}</div>
                  )}
                </div>
                <span className={`ml-2 px-2 py-1 text-xs rounded ${badgeClasses[color] || badgeClasses.gray}`}>
                  {opp.impact}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opportunity Detail Modal ───────────────────────────────────────────────

interface OpportunityDetailProps {
  opportunity: GISOpportunity | null;
  onClose: () => void;
}

function OpportunityDetail({ opportunity, onClose }: OpportunityDetailProps) {
  if (!opportunity) return null;

  const typeInfo = opportunityTypes[opportunity.type];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{opportunity.title}</h3>
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            {typeInfo?.label}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm ${
            opportunity.impact === "high"
              ? "bg-green-100 text-green-700"
              : opportunity.impact === "medium"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-100 text-gray-700"
          }`}>
            {opportunity.impact} impact
          </span>
          <span className={`px-3 py-1 rounded-full text-sm ${
            opportunity.feasibility === "high"
              ? "bg-green-100 text-green-700"
              : opportunity.feasibility === "medium"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-100 text-gray-700"
          }`}>
            {opportunity.feasibility} feasibility
          </span>
        </div>
        <p className="text-gray-600 mb-4">{opportunity.description}</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {opportunity.department && (
            <div>
              <span className="text-gray-500">Department:</span>
              <span className="ml-2 font-medium">{opportunity.department}</span>
            </div>
          )}
          {opportunity.estimatedCost && (
            <div>
              <span className="text-gray-500">Est. Cost:</span>
              <span className="ml-2 font-medium">{opportunity.estimatedCost}</span>
            </div>
          )}
          {opportunity.timeline && (
            <div>
              <span className="text-gray-500">Timeline:</span>
              <span className="ml-2 font-medium">{opportunity.timeline}</span>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
          >
            Close
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
            Add to Roadmap
          </button>
        </div>
      </div>
    </div>
  );
}

// ── GIS Integration Roadmap ────────────────────────────────────────────────

interface RoadmapItem {
  phase: string;
  timeframe: string;
  opportunities: GISOpportunity[];
}

function Roadmap({ items }: { items: RoadmapItem[] }) {
  return (
    <div className="space-y-6">
      {items.map((item, idx) => (
        <div key={idx} className="relative">
          <div className="flex items-center mb-3">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              {idx + 1}
            </div>
            <div className="ml-4">
              <h4 className="font-semibold text-gray-800">{item.phase}</h4>
              <p className="text-sm text-gray-500">{item.timeframe}</p>
            </div>
          </div>
          <div className="ml-16 border-l-2 border-blue-200 pl-4 pb-4">
            <div className="space-y-2">
              {item.opportunities.map((opp) => (
                <div key={opp.id} className="bg-white p-3 rounded border border-gray-200">
                  <div className="font-medium text-sm text-gray-800">{opp.title}</div>
                  <div className="text-xs text-gray-500">{opp.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

interface GISOpportunityMatrixProps {
  opportunities?: GISOpportunity[];
  onOpportunitySelect?: (opp: GISOpportunity) => void;
  showRoadmap?: boolean;
}

export default function GISOpportunityMatrix({
  opportunities = sampleOpportunities,
  onOpportunitySelect,
  showRoadmap = false,
}: GISOpportunityMatrixProps) {
  const [selectedOpportunity, setSelectedOpportunity] = useState<GISOpportunity | null>(null);

  const matrixData: GISOpportunityMatrixData = useMemo(() => {
    return {
      highImpactHighFeasibility: opportunities.filter(
        (o) => o.impact === "high" && o.feasibility === "high"
      ),
      highImpactLowFeasibility: opportunities.filter(
        (o) => o.impact === "high" && o.feasibility === "low"
      ),
      lowImpactHighFeasibility: opportunities.filter(
        (o) => o.impact === "low" || (o.impact === "medium" && o.feasibility === "high")
      ),
      lowImpactLowFeasibility: opportunities.filter(
        (o) => o.impact === "low" && o.feasibility === "low"
      ),
    };
  }, [opportunities]);

  const handleOpportunityClick = (opp: GISOpportunity) => {
    setSelectedOpportunity(opp);
    onOpportunitySelect?.(opp);
  };

  // Generate roadmap from high-priority opportunities
  const roadmapItems: RoadmapItem[] = useMemo(() => {
    const quickWins = matrixData.lowImpactHighFeasibility.filter(
      (o) => o.impact === "medium" && o.feasibility === "high"
    );
    const strategic = matrixData.highImpactHighFeasibility;
    const longTerm = [...matrixData.highImpactLowFeasibility, ...matrixData.lowImpactLowFeasibility];

    return [
      { phase: "Quick Wins", timeframe: "0-6 months", opportunities: quickWins },
      { phase: "Strategic Initiatives", timeframe: "6-18 months", opportunities: strategic },
      { phase: "Long-term Goals", timeframe: "18+ months", opportunities: longTerm },
    ];
  }, [matrixData]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">GIS Opportunity Matrix</h2>
        <p className="text-sm text-gray-500 mt-1">
          Prioritise GIS opportunities based on impact and feasibility
        </p>
      </div>

      {/* Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Quadrant
          title="Strategic Initiatives"
          subtitle="High Impact, High Feasibility"
          opportunities={matrixData.highImpactHighFeasibility}
          color="green"
          onOpportunityClick={handleOpportunityClick}
        />
        <Quadrant
          title="Long-term Goals"
          subtitle="High Impact, Low Feasibility"
          opportunities={matrixData.highImpactLowFeasibility}
          color="yellow"
          onOpportunityClick={handleOpportunityClick}
        />
        <Quadrant
          title="Quick Wins"
          subtitle="Medium Impact, High Feasibility"
          opportunities={matrixData.lowImpactHighFeasibility}
          color="blue"
          onOpportunityClick={handleOpportunityClick}
        />
        <Quadrant
          title="Backlog"
          subtitle="Low Impact, Low Feasibility"
          opportunities={matrixData.lowImpactLowFeasibility}
          color="gray"
          onOpportunityClick={handleOpportunityClick}
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-800">{opportunities.length}</div>
          <div className="text-sm text-gray-500">Total Opportunities</div>
        </div>
        <div className="bg-green-50 p-4 rounded border border-green-200 text-center">
          <div className="text-2xl font-bold text-green-700">
            {matrixData.highImpactHighFeasibility.length}
          </div>
          <div className="text-sm text-green-600">Quick Wins</div>
        </div>
        <div className="bg-blue-50 p-4 rounded border border-blue-200 text-center">
          <div className="text-2xl font-bold text-blue-700">
            {matrixData.highImpactLowFeasibility.length}
          </div>
          <div className="text-sm text-blue-600">Strategic</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded border border-yellow-200 text-center">
          <div className="text-2xl font-bold text-yellow-700">
            {matrixData.lowImpactHighFeasibility.length + matrixData.lowImpactLowFeasibility.length}
          </div>
          <div className="text-sm text-yellow-600">Long-term</div>
        </div>
      </div>

      {/* Roadmap */}
      {showRoadmap && (
        <div className="bg-white p-6 rounded border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">GIS Integration Roadmap</h3>
          <Roadmap items={roadmapItems} />
        </div>
      )}

      {/* Detail Modal */}
      {selectedOpportunity && (
        <OpportunityDetail
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
        />
      )}
    </div>
  );
}