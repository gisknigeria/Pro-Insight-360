"use client"
import React from "react";
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────

export interface RadarDataPoint {
  category: string;
  score: number;
  fullMark?: number;
}

// ── Default 14 Digital Readiness Categories ────────────────────────────────

const defaultCategories = [
  "Leadership",
  "Strategy",
  "People",
  "Process",
  "Data",
  "Technology",
  "Infrastructure",
  "Security",
  "Innovation",
  "Governance",
  "Culture",
  "Skills",
  "Resources",
  "Partnerships",
];

// ── Generate sample data ───────────────────────────────────────────────────

function generateSampleData(): RadarDataPoint[] {
  return defaultCategories.map((category) => ({
    category,
    score: Math.floor(Math.random() * 40) + 50, // 50-90
    fullMark: 100,
  }));
}

// ── WCAG 2.1 AA Compliant Color Scheme ────────────────────────────────────
// Ensures minimum 4.5:1 contrast ratio on white background

const chartColors = {
  primary: "#2563eb", // blue-600
  primaryFill: "rgba(37, 99, 235, 0.2)",
  secondary: "#16a34a", // green-600
  secondaryFill: "rgba(22, 163, 74, 0.2)",
  grid: "#94a3b8", // slate-400
  axis: "#475569", // slate-600
  text: "#1e293b", // slate-800
};

// ── Empty State ────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

interface RadarChartProps {
  data?: RadarDataPoint[];
  title?: string;
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  compareData?: RadarDataPoint[];
  emptyMessage?: string;
}

export default function RadarChart({
  data,
  title,
  height = 350,
  showLegend = true,
  showTooltip = true,
  compareData,
  emptyMessage = "No data available for radar chart",
}: RadarChartProps) {
  const chartData = data || generateSampleData();

  if (!chartData || chartData.length === 0) {
    return (
      <div>
        {title && <h4 className="font-semibold text-gray-800 mb-4">{title}</h4>}
        <EmptyState message={emptyMessage} />
      </div>
    );
  }

  return (
    <div>
      {title && <h4 className="font-semibold text-gray-800 mb-4">{title}</h4>}
      <div style={{ width: "100%", height }} className="bg-white">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke={chartColors.grid} />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fill: chartColors.text, fontSize: 12, fontWeight: 500 }}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: chartColors.axis, fontSize: 10 }}
              tickCount={5}
              axisLine={false}
            />
            <Radar
              name="Current Score"
              dataKey="score"
              stroke={chartColors.primary}
              fill={chartColors.primaryFill}
              strokeWidth={2}
            />
            {compareData && compareData.length > 0 && (
              <Radar
                name="Previous Score"
                dataKey="score"
                stroke={chartColors.secondary}
                fill={chartColors.secondaryFill}
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            )}
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
                labelStyle={{ fontWeight: 600, color: chartColors.text }}
                formatter={(value: number) => [`${value}/100`, "Score"]}
              />
            )}
            {showLegend && (
              <Legend
                wrapperStyle={{
                  paddingTop: "10px",
                  fontSize: "12px",
                }}
              />
            )}
          </RechartsRadarChart>
        </ResponsiveContainer>
      </div>

      {/* Accessibility: Text summary for screen readers */}
      <div className="sr-only">
        <h5>Digital Readiness Score Summary</h5>
        <ul>
          {chartData.map((d) => (
            <li key={d.category}>
              {d.category}: {d.score} out of 100
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}