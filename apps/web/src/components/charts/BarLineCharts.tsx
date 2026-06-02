"use client"
import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  LabelList,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────

export interface BarDataPoint {
  name: string;
  value: number;
  compareValue?: number;
}

export interface DepartmentScore {
  name: string;
  score: number;
  orgAverage: number;
}

export interface LineDataPoint {
  name: string;
  value: number;
  target?: number;
}

export interface WorkflowStep {
  step: string;
  actual: number;
  target: number;
}

// ── WCAG 2.1 AA Compliant Color Scheme ────────────────────────────────────

const chartColors = {
  primary: "#2563eb", // blue-600
  primaryLight: "rgba(37, 99, 235, 0.15)",
  secondary: "#16a34a", // green-600
  secondaryLight: "rgba(22, 163, 74, 0.15)",
  tertiary: "#ea580c", // orange-600
  tertiaryLight: "rgba(234, 88, 12, 0.15)",
  critical: "#dc2626", // red-600
  criticalLight: "rgba(220, 38, 38, 0.15)",
  grid: "#e2e8f0", // slate-200
  axis: "#64748b", // slate-500
  text: "#1e293b", // slate-800
};

// ── Sample Data Generators ─────────────────────────────────────────────────

function generateDepartmentComparisonData(): DepartmentScore[] {
  return [
    { name: "ICT", score: 78, orgAverage: 62 },
    { name: "Finance", score: 62, orgAverage: 62 },
    { name: "Operations", score: 55, orgAverage: 62 },
    { name: "HR", score: 70, orgAverage: 62 },
    { name: "Planning", score: 48, orgAverage: 62 },
    { name: "Legal", score: 65, orgAverage: 62 },
  ];
}

function generateGapSeverityData() {
  return [
    { category: "Hardware", critical: 12, high: 25, medium: 40, low: 60 },
    { category: "Software", critical: 8, high: 18, medium: 35, low: 55 },
    { category: "Network", critical: 5, high: 15, medium: 30, low: 45 },
    { category: "Skills", critical: 10, high: 22, medium: 38, low: 50 },
    { category: "Process", critical: 3, high: 12, medium: 28, low: 42 },
  ];
}

function generateWorkflowDelayData(): WorkflowStep[] {
  return [
    { step: "Intake", actual: 2, target: 1 },
    { step: "Review", actual: 5, target: 3 },
    { step: "Approval", actual: 8, target: 4 },
    { step: "Processing", actual: 12, target: 7 },
    { step: "QA Check", actual: 3, target: 2 },
    { step: "Delivery", actual: 4, target: 3 },
  ];
}

// ── Empty State ────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}

// ── Department Comparison Bar Chart ────────────────────────────────────────

interface DepartmentComparisonChartProps {
  data?: DepartmentScore[];
  title?: string;
  height?: number;
  emptyMessage?: string;
}

export function DepartmentComparisonChart({
  data,
  title = "Department Comparison",
  height = 300,
  emptyMessage = "No department data available",
}: DepartmentComparisonChartProps) {
  const chartData: DepartmentScore[] = data || generateDepartmentComparisonData();

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
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: chartColors.axis, fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: chartColors.text, fontSize: 12, fontWeight: 500 }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              formatter={(value) => [`${value}/100`, "Score"]}
            />
            <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
            <Bar dataKey="score" name="Department Score" fill={chartColors.primary} radius={[0, 4, 4, 0]} />
            <Bar dataKey="orgAverage" name="Org Average" fill={chartColors.secondary} radius={[0, 4, 4, 0]} opacity={0.6} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Gap Severity Bar Chart ─────────────────────────────────────────────────

interface GapSeverityChartProps {
  data?: typeof gapSeveritySample;
  title?: string;
  height?: number;
  emptyMessage?: string;
}

const gapSeveritySample = generateGapSeverityData();

export function GapSeverityChart({
  data,
  title = "Gap Analysis by Severity",
  height = 350,
  emptyMessage = "No gap analysis data available",
}: GapSeverityChartProps) {
  const chartData = data || gapSeveritySample;

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
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis dataKey="category" tick={{ fill: chartColors.text, fontSize: 12, fontWeight: 500 }} />
            <YAxis tick={{ fill: chartColors.axis, fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
            <Bar dataKey="critical" name="Critical" fill={chartColors.critical} stackId="a" />
            <Bar dataKey="high" name="High" fill={chartColors.tertiary} stackId="a" />
            <Bar dataKey="medium" name="Medium" fill={chartColors.primary} stackId="a" />
            <Bar dataKey="low" name="Low" fill={chartColors.secondary} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Workflow Delay Line Chart ──────────────────────────────────────────────

interface WorkflowDelayChartProps {
  data?: WorkflowStep[];
  title?: string;
  height?: number;
  emptyMessage?: string;
}

const workflowDelaySample = generateWorkflowDelayData();

export function WorkflowDelayChart({
  data,
  title = "Workflow Delays vs Target",
  height = 300,
  emptyMessage = "No workflow delay data available",
}: WorkflowDelayChartProps) {
  const chartData: WorkflowStep[] = data || workflowDelaySample;

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
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis dataKey="step" tick={{ fill: chartColors.text, fontSize: 12, fontWeight: 500 }} />
            <YAxis tick={{ fill: chartColors.axis, fontSize: 11 }} label={{ value: "Days", angle: -90, position: "insideLeft", fill: chartColors.axis, fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              formatter={(value) => [`${value} days`, ""]}
            />
            <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual Time"
              stroke={chartColors.tertiary}
              strokeWidth={3}
              dot={{ r: 5, fill: chartColors.tertiary }}
              activeDot={{ r: 7 }}
            />
            <Line
              type="monotone"
              dataKey="target"
              name="Target Time"
              stroke={chartColors.secondary}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: chartColors.secondary }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Score Distribution Bar Chart ───────────────────────────────────────────

interface ScoreDistributionChartProps {
  data?: BarDataPoint[];
  title?: string;
  height?: number;
  emptyMessage?: string;
}

export function ScoreDistributionChart({
  data,
  title = "Score Distribution",
  height = 300,
  emptyMessage = "No distribution data available",
}: ScoreDistributionChartProps) {
  const chartData: BarDataPoint[] = data || [
    { name: "0-20", value: 5 },
    { name: "21-40", value: 12 },
    { name: "41-60", value: 28 },
    { name: "61-80", value: 35 },
    { name: "81-100", value: 20 },
  ];

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
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis dataKey="name" tick={{ fill: chartColors.text, fontSize: 12, fontWeight: 500 }} />
            <YAxis tick={{ fill: chartColors.axis, fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              formatter={(value) => [value, "Count"]}
            />
            <Bar dataKey="value" name="Respondents" fill={chartColors.primary} radius={[4, 4, 0, 0]}>
              <LabelList dataKey="value" position="top" fill={chartColors.text} fontSize={11} />
            </Bar>
            <ReferenceLine y={chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length} stroke={chartColors.secondary} strokeDasharray="5 5" label="Average" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Main Component (exports all chart types) ───────────────────────────────

export default function BarLineCharts() {
  return (
    <div className="space-y-8 p-4">
      <h3 className="text-lg font-semibold text-gray-800">Bar & Line Charts</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <DepartmentComparisonChart />
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <GapSeverityChart />
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <WorkflowDelayChart />
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <ScoreDistributionChart />
        </div>
      </div>
    </div>
  );
}
