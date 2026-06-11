"use client"
import React, { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

export interface SoftwareItem {
  id: string;
  name: string;
  version: string;
  licenseType: "perpetual" | "subscription" | "free" | "open_source" | "trial";
  licenseCount: number;
  usersCount: number;
  supportStatus: "active" | "ending_soon" | "expired" | "none";
  category: "gis" | "cad" | "office" | "database" | "analytics" | "other";
  department?: string;
  notes?: string;
}

export interface SoftwareAssessment {
  items: SoftwareItem[];
  complianceScore: number; // 0-100
  coverageScore: number; // 0-100
}

// ── Constants ──────────────────────────────────────────────────────────────

const SOFTWARE_CATEGORIES = [
  { value: "gis", label: "GIS Software" },
  { value: "cad", label: "CAD Software" },
  { value: "office", label: "Office/Productivity" },
  { value: "database", label: "Database" },
  { value: "analytics", label: "Analytics/BI" },
  { value: "other", label: "Other" },
];

const LICENSE_TYPES = [
  { value: "perpetual", label: "Perpetual License" },
  { value: "subscription", label: "Subscription" },
  { value: "free", label: "Free" },
  { value: "open_source", label: "Open Source" },
  { value: "trial", label: "Trial" },
];

const SUPPORT_STATUS_CONFIG: Record<SoftwareItem["supportStatus"], { label: string; color: string; score: number }> = {
  active: { label: "Active Support", color: "bg-green-100 text-green-800", score: 100 },
  ending_soon: { label: "Ending Soon", color: "bg-yellow-100 text-yellow-800", score: 50 },
  expired: { label: "Expired", color: "bg-orange-100 text-orange-800", score: 25 },
  none: { label: "No Support", color: "bg-red-100 text-red-800", score: 0 },
};

// ── Software Item Row ──────────────────────────────────────────────────────

interface SoftwareItemRowProps {
  item: SoftwareItem;
  onUpdate: (item: SoftwareItem) => void;
  onRemove: () => void;
}

function SoftwareItemRow({ item, onUpdate, onRemove }: SoftwareItemRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="md:col-span-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">Software Name</label>
        <input
          type="text"
          value={item.name}
          onChange={(e) => onUpdate({ ...item, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="e.g., ArcGIS Pro"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Version</label>
        <input
          type="text"
          value={item.version}
          onChange={(e) => onUpdate({ ...item, version: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="e.g., 3.2"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
        <select
          value={item.category}
          onChange={(e) => onUpdate({ ...item, category: e.target.value as SoftwareItem["category"] })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          {SOFTWARE_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">License Type</label>
        <select
          value={item.licenseType}
          onChange={(e) => onUpdate({ ...item, licenseType: e.target.value as SoftwareItem["licenseType"] })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          {LICENSE_TYPES.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">License Count</label>
        <input
          type="number"
          min="1"
          value={item.licenseCount}
          onChange={(e) => onUpdate({ ...item, licenseCount: parseInt(e.target.value) || 1 })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Active Users</label>
        <input
          type="number"
          min="0"
          value={item.usersCount}
          onChange={(e) => onUpdate({ ...item, usersCount: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Support Status</label>
        <select
          value={item.supportStatus}
          onChange={(e) => onUpdate({ ...item, supportStatus: e.target.value as SoftwareItem["supportStatus"] })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          {Object.entries(SUPPORT_STATUS_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
        <input
          type="text"
          value={item.department || ""}
          onChange={(e) => onUpdate({ ...item, department: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="e.g., Planning"
        />
      </div>
      <div className="flex items-end">
        <button
          type="button"
          onClick={onRemove}
          className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm hover:bg-red-100 transition"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

interface SoftwareInventoryFormProps {
  onSubmit?: (assessment: SoftwareAssessment) => void;
  initialData?: Partial<SoftwareAssessment>;
}

export default function SoftwareInventoryForm({ onSubmit, initialData }: SoftwareInventoryFormProps) {
  const [items, setItems] = useState<SoftwareItem[]>(
    initialData?.items || [
      {
        id: crypto.randomUUID(),
        name: "",
        version: "",
        licenseType: "subscription",
        licenseCount: 1,
        usersCount: 0,
        supportStatus: "active",
        category: "gis",
      },
    ]
  );
  const [scores, setScores] = useState({ compliance: 0, coverage: 0 });

  const addItem = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        name: "",
        version: "",
        licenseType: "subscription",
        licenseCount: 1,
        usersCount: 0,
        supportStatus: "active",
        category: "gis",
      },
    ]);
  };

  const updateItem = (id: string, updatedItem: SoftwareItem) => {
    setItems(items.map((item) => (item.id === id ? updatedItem : item)));
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const calculateScores = () => {
    if (items.length === 0) return { compliance: 0, coverage: 0 };

    // Compliance score: based on license vs users and support status
    let complianceTotal = 0;
    let coverageTotal = 0;

    for (const item of items) {
      // License compliance
      const licenseRatio = Math.min(1, item.licenseCount / Math.max(1, item.usersCount));
      const supportScore = SUPPORT_STATUS_CONFIG[item.supportStatus].score / 100;
      const itemCompliance = (licenseRatio * 0.6 + supportScore * 0.4) * 100;
      complianceTotal += itemCompliance;

      // Coverage: whether the software category is adequately covered
      if (item.category === "gis") {
        coverageTotal += item.supportStatus === "active" ? 100 : 50;
      }
    }

    return {
      compliance: Math.round(complianceTotal / items.length),
      coverage: Math.round(coverageTotal / items.filter(i => i.category === "gis").length || 0),
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newScores = calculateScores();
    setScores(newScores);
    onSubmit?.({
      items,
      complianceScore: newScores.compliance,
      coverageScore: newScores.coverage,
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800 border-green-300";
    if (score >= 60) return "bg-amber-100 text-blue-800 border-blue-300";
    if (score >= 40) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  const gisSoftware = items.filter(item => item.category === "gis");

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Software Inventory Assessment</h2>
        <p className="text-sm text-gray-500 mt-1">
          Catalog your organisation's software assets, focusing on GIS applications
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-amber-200 rounded-lg p-6">
          <div className="text-sm text-amber-800 mb-1">License Compliance</div>
          <div className="text-4xl font-bold text-blue-900">{scores.compliance}</div>
          <div className="text-xs text-primary mt-1">Based on license vs usage</div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
          <div className="text-sm text-green-700 mb-1">GIS Software Coverage</div>
          <div className="text-4xl font-bold text-green-900">{scores.coverage}</div>
          <div className="text-xs text-green-600 mt-1">GIS capability assessment</div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
          <div className="text-sm text-purple-700 mb-1">GIS Applications</div>
          <div className="text-4xl font-bold text-purple-900">{gisSoftware.length}</div>
          <div className="text-xs text-purple-600 mt-1">Total GIS software</div>
        </div>
      </div>

      {/* Software Items */}
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <SoftwareItemRow
            key={item.id}
            item={item}
            onUpdate={(updated) => updateItem(item.id, updated)}
            onRemove={() => removeItem(item.id)}
          />
        ))}
      </div>

      {/* Add Item Button */}
      <button
        type="button"
        onClick={addItem}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-primary transition mb-6"
      >
        + Add Software Item
      </button>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition"
        >
          Save Software Assessment
        </button>
      </div>
    </form>
  );
}