"use client"
import React, { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

export interface InfrastructureSection {
  connectivity: {
    internetType: string;
    bandwidth: number; // Mbps
    reliability: number; // 0-100
    backupConnection: boolean;
    notes: string;
  };
  hosting: {
    primaryHosting: string;
    serverLocation: string;
    uptime: number; // 0-100
    scalability: number; // 0-100
    notes: string;
  };
  backup: {
    backupFrequency: string;
    backupLocation: string;
    recoveryTime: string;
    testedRecently: boolean;
    notes: string;
  };
  security: {
    firewall: boolean;
    vpn: boolean;
    encryption: boolean;
    accessControl: number; // 0-100
    notes: string;
  };
}

export interface InfrastructureScore {
  overall: number;
  band: "Nascent" | "Emerging" | "Developing" | "Advanced";
  sections: {
    connectivity: number;
    hosting: number;
    backup: number;
    security: number;
  };
}

// ── Constants ──────────────────────────────────────────────────────────────

const INTERNET_TYPES = [
  "Fiber Optic",
  "Cable",
  "DSL",
  "Satellite",
  "Mobile Data",
  "Microwave",
  "Other",
];

const BANDWIDTH_RANGES = [
  { label: "< 10 Mbps", value: 5 },
  { label: "10-25 Mbps", value: 17 },
  { label: "25-50 Mbps", value: 37 },
  { label: "50-100 Mbps", value: 75 },
  { label: "100-500 Mbps", value: 300 },
  { label: "500 Mbps - 1 Gbps", value: 750 },
  { label: "> 1 Gbps", value: 1500 },
];

const HOSTING_TYPES = [
  "On-Premises Server",
  "Private Cloud",
  "Public Cloud (AWS/Azure/GCP)",
  "Colocation",
  "Shared Hosting",
  "Hybrid",
];

const SERVER_LOCATIONS = [
  "Local (Same Building)",
  "Regional (Same Country)",
  "International",
  "Multiple Regions",
];

const BACKUP_FREQUENCIES = [
  "Real-time/Continuous",
  "Hourly",
  "Daily",
  "Weekly",
  "Monthly",
  "Ad-hoc/Manual",
  "No Backup",
];

const BACKUP_LOCATIONS = [
  "On-Premises Only",
  "Off-Sites (Physical Media)",
  "Cloud Storage",
  "Hybrid (On-prem + Cloud)",
  "No Off-site Backup",
];

const RECOVERY_TIMES = [
  "< 1 hour",
  "1-4 hours",
  "4-24 hours",
  "1-3 days",
  "> 3 days",
  "Unknown",
];

// ── Section Components ─────────────────────────────────────────────────────

interface ConnectivitySectionProps {
  data: InfrastructureSection["connectivity"];
  onChange: (data: InfrastructureSection["connectivity"]) => void;
}

function ConnectivitySection({ data, onChange }: ConnectivitySectionProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">C</span>
        Connectivity & Network
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Internet Connection Type</label>
          <select
            value={data.internetType}
            onChange={(e) => onChange({ ...data, internetType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {INTERNET_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Bandwidth</label>
          <select
            value={BANDWIDTH_RANGES.find(r => r.value === data.bandwidth)?.label || ""}
            onChange={(e) => {
              const range = BANDWIDTH_RANGES.find(r => r.label === e.target.value);
              onChange({ ...data, bandwidth: range?.value || 0 });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {BANDWIDTH_RANGES.map((range) => (
              <option key={range.label} value={range.label}>{range.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Reliability ({data.reliability}%)
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={data.reliability}
            onChange={(e) => onChange({ ...data, reliability: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.backupConnection}
              onChange={(e) => onChange({ ...data, backupConnection: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">Backup internet connection available</span>
          </label>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <input
            type="text"
            value={data.notes}
            onChange={(e) => onChange({ ...data, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="ISP details, issues, etc."
          />
        </div>
      </div>
    </div>
  );
}

interface HostingSectionProps {
  data: InfrastructureSection["hosting"];
  onChange: (data: InfrastructureSection["hosting"]) => void;
}

function HostingSection({ data, onChange }: HostingSectionProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">H</span>
        Hosting & Servers
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Primary Hosting</label>
          <select
            value={data.primaryHosting}
            onChange={(e) => onChange({ ...data, primaryHosting: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {HOSTING_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Server Location</label>
          <select
            value={data.serverLocation}
            onChange={(e) => onChange({ ...data, serverLocation: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {SERVER_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Uptime ({data.uptime}%)
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={data.uptime}
            onChange={(e) => onChange({ ...data, uptime: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Scalability ({data.scalability}%)
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={data.scalability}
            onChange={(e) => onChange({ ...data, scalability: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <input
            type="text"
            value={data.notes}
            onChange={(e) => onChange({ ...data, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Server specs, hosting provider, etc."
          />
        </div>
      </div>
    </div>
  );
}

interface BackupSectionProps {
  data: InfrastructureSection["backup"];
  onChange: (data: InfrastructureSection["backup"]) => void;
}

function BackupSection({ data, onChange }: BackupSectionProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-sm font-bold">B</span>
        Backup & Recovery
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Backup Frequency</label>
          <select
            value={data.backupFrequency}
            onChange={(e) => onChange({ ...data, backupFrequency: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {BACKUP_FREQUENCIES.map((freq) => (
              <option key={freq} value={freq}>{freq}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Backup Location</label>
          <select
            value={data.backupLocation}
            onChange={(e) => onChange({ ...data, backupLocation: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {BACKUP_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Recovery Time Objective</label>
          <select
            value={data.recoveryTime}
            onChange={(e) => onChange({ ...data, recoveryTime: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {RECOVERY_TIMES.map((time) => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.testedRecently}
              onChange={(e) => onChange({ ...data, testedRecently: e.target.checked })}
              className="w-4 h-4 text-yellow-600 rounded"
            />
            <span className="text-sm text-gray-700">Backup tested in last 3 months</span>
          </label>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <input
            type="text"
            value={data.notes}
            onChange={(e) => onChange({ ...data, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Backup solution details, issues, etc."
          />
        </div>
      </div>
    </div>
  );
}

interface SecuritySectionProps {
  data: InfrastructureSection["security"];
  onChange: (data: InfrastructureSection["security"]) => void;
}

function SecuritySection({ data, onChange }: SecuritySectionProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold">S</span>
        Security Infrastructure
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.firewall}
              onChange={(e) => onChange({ ...data, firewall: e.target.checked })}
              className="w-4 h-4 text-red-600 rounded"
            />
            <span className="text-sm text-gray-700">Hardware/Software Firewall</span>
          </label>
        </div>
        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.vpn}
              onChange={(e) => onChange({ ...data, vpn: e.target.checked })}
              className="w-4 h-4 text-red-600 rounded"
            />
            <span className="text-sm text-gray-700">VPN for remote access</span>
          </label>
        </div>
        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.encryption}
              onChange={(e) => onChange({ ...data, encryption: e.target.checked })}
              className="w-4 h-4 text-red-600 rounded"
            />
            <span className="text-sm text-gray-700">Data encryption at rest and in transit</span>
          </label>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Access Control Maturity ({data.accessControl}%)
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={data.accessControl}
            onChange={(e) => onChange({ ...data, accessControl: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <input
            type="text"
            value={data.notes}
            onChange={(e) => onChange({ ...data, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Security policies, compliance, etc."
          />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

interface InfrastructureAssessmentFormProps {
  onSubmit?: (section: InfrastructureSection, score: InfrastructureScore) => void;
  initialData?: Partial<InfrastructureSection>;
}

export default function InfrastructureAssessmentForm({ onSubmit, initialData }: InfrastructureAssessmentFormProps) {
  const [section, setSection] = useState<InfrastructureSection>({
    connectivity: {
      internetType: initialData?.connectivity?.internetType || "Fiber Optic",
      bandwidth: initialData?.connectivity?.bandwidth || 100,
      reliability: initialData?.connectivity?.reliability || 80,
      backupConnection: initialData?.connectivity?.backupConnection || false,
      notes: initialData?.connectivity?.notes || "",
    },
    hosting: {
      primaryHosting: initialData?.hosting?.primaryHosting || "On-Premises Server",
      serverLocation: initialData?.hosting?.serverLocation || "Local (Same Building)",
      uptime: initialData?.hosting?.uptime || 95,
      scalability: initialData?.hosting?.scalability || 70,
      notes: initialData?.hosting?.notes || "",
    },
    backup: {
      backupFrequency: initialData?.backup?.backupFrequency || "Daily",
      backupLocation: initialData?.backup?.backupLocation || "Cloud Storage",
      recoveryTime: initialData?.backup?.recoveryTime || "4-24 hours",
      testedRecently: initialData?.backup?.testedRecently || false,
      notes: initialData?.backup?.notes || "",
    },
    security: {
      firewall: initialData?.security?.firewall ?? true,
      vpn: initialData?.security?.vpn ?? false,
      encryption: initialData?.security?.encryption ?? false,
      accessControl: initialData?.security?.accessControl || 60,
      notes: initialData?.security?.notes || "",
    },
  });

  const [score, setScore] = useState<InfrastructureScore | null>(null);

  const calculateScore = (): InfrastructureScore => {
    // Connectivity score
    const bandwidthScore = Math.min(100, (section.connectivity.bandwidth / 100) * 50);
    const connectivityScore = (
      bandwidthScore * 0.3 +
      section.connectivity.reliability * 0.4 +
      (section.connectivity.backupConnection ? 30 : 0)
    );

    // Hosting score
    const hostingScore = (
      section.hosting.uptime * 0.5 +
      section.hosting.scalability * 0.5
    );

    // Backup score
    const freqScores: Record<string, number> = {
      "Real-time/Continuous": 100,
      "Hourly": 90,
      "Daily": 75,
      "Weekly": 50,
      "Monthly": 30,
      "Ad-hoc/Manual": 15,
      "No Backup": 0,
    };
    const backupScore = (
      (freqScores[section.backup.backupFrequency] || 50) * 0.4 +
      (section.backup.testedRecently ? 60 : 0) +
      (section.backup.backupLocation === "Hybrid (On-prem + Cloud)" ? 40 :
       section.backup.backupLocation === "Cloud Storage" ? 30 : 10)
    );

    // Security score
    const securityScore = (
      (section.security.firewall ? 25 : 0) +
      (section.security.vpn ? 20 : 0) +
      (section.security.encryption ? 25 : 0) +
      (section.security.accessControl * 0.3)
    );

    const overall = (connectivityScore + hostingScore + backupScore + securityScore) / 4;

    let band: InfrastructureScore["band"] = "Nascent";
    if (overall >= 80) band = "Advanced";
    else if (overall >= 60) band = "Developing";
    else if (overall >= 40) band = "Emerging";

    return {
      overall: Math.round(overall),
      band,
      sections: {
        connectivity: Math.round(connectivityScore),
        hosting: Math.round(hostingScore),
        backup: Math.round(backupScore),
        security: Math.round(securityScore),
      },
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedScore = calculateScore();
    setScore(calculatedScore);
    onSubmit?.(section, calculatedScore);
  };

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
        <h2 className="text-2xl font-bold text-gray-800">Infrastructure Assessment</h2>
        <p className="text-sm text-gray-500 mt-1">
          Evaluate your organisation's IT infrastructure readiness for GIS operations
        </p>
      </div>

      {/* Score Summary */}
      {score && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-blue-700 mb-1">Infrastructure Readiness Score</div>
              <div className="text-4xl font-bold text-blue-900">{score.overall}</div>
            </div>
            <div className={`px-4 py-2 rounded-full border font-semibold ${getBandColor(score.band)}`}>
              {score.band}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: "Connectivity", score: score.sections.connectivity },
              { name: "Hosting", score: score.sections.hosting },
              { name: "Backup", score: score.sections.backup },
              { name: "Security", score: score.sections.security },
            ].map((s) => (
              <div key={s.name} className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500">{s.name}</div>
                <div className="text-xl font-bold text-gray-800">{s.score}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-6 mb-8">
        <ConnectivitySection
          data={section.connectivity}
          onChange={(data) => setSection({ ...section, connectivity: data })}
        />
        <HostingSection
          data={section.hosting}
          onChange={(data) => setSection({ ...section, hosting: data })}
        />
        <BackupSection
          data={section.backup}
          onChange={(data) => setSection({ ...section, backup: data })}
        />
        <SecuritySection
          data={section.security}
          onChange={(data) => setSection({ ...section, security: data })}
        />
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