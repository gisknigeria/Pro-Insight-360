"use client"
import React, { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

export interface HardwareItem {
  id: string;
  deviceType: string;
  quantity: number;
  age: string;
  operatingSystem: string;
  condition: "excellent" | "good" | "fair" | "poor" | "obsolete";
  department?: string;
  notes?: string;
}

export interface HardwareAssessment {
  items: HardwareItem[];
  overallAdequacy: number; // 0-100
}

// ── Constants ──────────────────────────────────────────────────────────────

const DEVICE_TYPES = [
  "Desktop PC",
  "Laptop",
  "Workstation",
  "Server",
  "Tablet",
  "Mobile Device",
  "Printer/Scanner",
  "Network Equipment",
  "Other",
];

const AGE_RANGES = [
  "< 1 year",
  "1-2 years",
  "2-3 years",
  "3-4 years",
  "4-5 years",
  "> 5 years",
];

const OPERATING_SYSTEMS = [
  "Windows 10",
  "Windows 11",
  "macOS",
  "Linux",
  "Chrome OS",
  "iOS",
  "Android",
  "Windows Server",
  "Other",
  "N/A",
];

const CONDITION_CONFIG: Record<HardwareItem["condition"], { label: string; color: string; score: number }> = {
  excellent: { label: "Excellent", color: "bg-green-100 text-green-800", score: 100 },
  good: { label: "Good", color: "bg-blue-100 text-blue-800", score: 75 },
  fair: { label: "Fair", color: "bg-yellow-100 text-yellow-800", score: 50 },
  poor: { label: "Poor", color: "bg-orange-100 text-orange-800", score: 25 },
  obsolete: { label: "Obsolete", color: "bg-red-100 text-red-800", score: 0 },
};

// ── Hardware Item Row ──────────────────────────────────────────────────────

interface HardwareItemRowProps {
  item: HardwareItem;
  onUpdate: (item: HardwareItem) => void;
  onRemove: () => void;
}

function HardwareItemRow({ item, onUpdate, onRemove }: HardwareItemRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Device Type</label>
        <select
          value={item.deviceType}
          onChange={(e) => onUpdate({ ...item, deviceType: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          {DEVICE_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => onUpdate({ ...item, quantity: parseInt(e.target.value) || 1 })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Age</label>
        <select
          value={item.age}
          onChange={(e) => onUpdate({ ...item, age: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          {AGE_RANGES.map((age) => (
            <option key={age} value={age}>{age}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Condition</label>
        <select
          value={item.condition}
          onChange={(e) => onUpdate({ ...item, condition: e.target.value as HardwareItem["condition"] })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          {Object.entries(CONDITION_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Operating System</label>
        <select
          value={item.operatingSystem}
          onChange={(e) => onUpdate({ ...item, operatingSystem: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          {OPERATING_SYSTEMS.map((os) => (
            <option key={os} value={os}>{os}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
        <input
          type="text"
          value={item.department || ""}
          onChange={(e) => onUpdate({ ...item, department: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="e.g., Planning"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
        <input
          type="text"
          value={item.notes || ""}
          onChange={(e) => onUpdate({ ...item, notes: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="Specifications, issues, etc."
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

interface HardwareInventoryFormProps {
  onSubmit?: (assessment: HardwareAssessment) => void;
  initialData?: Partial<HardwareAssessment>;
}

export default function HardwareInventoryForm({ onSubmit, initialData }: HardwareInventoryFormProps) {
  const [items, setItems] = useState<HardwareItem[]>(
    initialData?.items || [
      {
        id: crypto.randomUUID(),
        deviceType: "Desktop PC",
        quantity: 1,
        age: "2-3 years",
        operatingSystem: "Windows 10",
        condition: "good",
      },
    ]
  );
  const [overallAdequacy, setOverallAdequacy] = useState<number>(
    initialData?.overallAdequacy || 0
  );

  const addItem = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        deviceType: "Desktop PC",
        quantity: 1,
        age: "2-3 years",
        operatingSystem: "Windows 10",
        condition: "good",
      },
    ]);
  };

  const updateItem = (id: string, updatedItem: HardwareItem) => {
    setItems(items.map((item) => (item.id === id ? updatedItem : item)));
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const calculateAdequacy = () => {
    if (items.length === 0) return 0;
    const totalScore = items.reduce((sum, item) => {
      const conditionScore = CONDITION_CONFIG[item.condition].score;
      const agePenalty = item.age === "> 5 years" ? 30 :
                         item.age === "4-5 years" ? 20 :
                         item.age === "3-4 years" ? 10 : 0;
      return sum + Math.max(0, conditionScore - agePenalty) * item.quantity;
    }, 0);
    const totalDevices = items.reduce((sum, item) => sum + item.quantity, 0);
    return Math.round(totalScore / totalDevices);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const adequacy = calculateAdequacy();
    setOverallAdequacy(adequacy);
    onSubmit?.({ items, overallAdequacy: adequacy });
  };

  const getAdequacyColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800 border-green-300";
    if (score >= 60) return "bg-blue-100 text-blue-800 border-blue-300";
    if (score >= 40) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Hardware Inventory Assessment</h2>
        <p className="text-sm text-gray-500 mt-1">
          Catalog your organisation's hardware assets to identify gaps and upgrade needs
        </p>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-blue-700 mb-1">Hardware Adequacy Score</div>
            <div className="text-4xl font-bold text-blue-900">{overallAdequacy}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-700">Total Devices</div>
            <div className="text-2xl font-bold text-blue-900">
              {items.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Items */}
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <HardwareItemRow
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
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition mb-6"
      >
        + Add Hardware Item
      </button>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          Save Hardware Assessment
        </button>
      </div>
    </form>
  );
}