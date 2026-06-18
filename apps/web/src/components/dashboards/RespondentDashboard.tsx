"use client"
import React, { useState, useMemo } from "react";
import type { FormAssignment } from "./dashboardTypes";
import { AppIcon, type AppIconName } from "@/components/ui/app-icons";

// ── Sample Data ─────────────────────────────────────────────────────────────

const sampleForms: FormAssignment[] = [
  { id: "f1", formName: "Digital Readiness Assessment - ICT", status: "completed", dueDate: "2026-05-28", progress: 100 },
  { id: "f2", formName: "GIS Readiness Survey", status: "in_progress", dueDate: "2026-06-10", progress: 65 },
  { id: "f3", formName: "Infrastructure Assessment", status: "pending", dueDate: "2026-06-20", progress: 0 },
  { id: "f4", formName: "Technical Skills Inventory", status: "overdue", dueDate: "2026-05-25", progress: 30 },
];

const sampleSyncStatus = {
  status: "synced" as "synced" | "syncing" | "pending" | "error",
  lastSync: "2026-06-01T14:30:00Z",
  pendingItems: 0,
};

// ── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
      <AppIcon name="mail" className="mb-3 h-9 w-9 text-gray-400" />
      <h4 className="font-semibold text-gray-700 mb-1">{title}</h4>
      <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>
      {action}
    </div>
  );
}

// ── Sync Status Banner ──────────────────────────────────────────────────────

function SyncBanner({
  status,
  lastSync,
  pendingItems,
}: {
  status: string;
  lastSync: string;
  pendingItems: number;
}) {
  const statusConfig: Record<string, { bg: string; text: string; icon: AppIconName; label: string }> = {
    synced: { bg: "bg-green-50", text: "text-green-700", icon: "check", label: "All data synced" },
    syncing: { bg: "bg-amber-50", text: "text-amber-800", icon: "activity", label: "Syncing..." },
    pending: { bg: "bg-yellow-50", text: "text-yellow-700", icon: "pause", label: `${pendingItems} item(s) pending` },
    error: { bg: "bg-red-50", text: "text-red-700", icon: "alert", label: "Sync error - click to retry" },
  };

  const config = statusConfig[status] || statusConfig.synced;

  return (
    <div className={`flex items-center justify-between px-4 py-2 rounded-lg mb-6 ${config.bg} ${config.text}`}>
      <div className="flex items-center gap-2">
        <AppIcon name={config.icon} className="h-4 w-4" />
        <span className="text-sm font-medium">{config.label}</span>
      </div>
      <span className="text-xs opacity-75">
        Last sync: {new Date(lastSync).toLocaleString()}
      </span>
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color = "blue" }: { label: string; value: string | number; icon: AppIconName; color?: string }) {
  const colorClasses: Record<string, string> = {
    blue: "bg-amber-50 text-primary",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{label}</span>
        <span className={`p-2 rounded ${colorClasses[color] || colorClasses.blue}`}>
          <AppIcon name={icon} className="h-5 w-5" />
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function RespondentDashboard() {
  const [forms] = useState<FormAssignment[]>(sampleForms);
  const [syncStatus] = useState(sampleSyncStatus);

  const stats = useMemo(() => {
    const completed = forms.filter((f) => f.status === "completed").length;
    const inProgress = forms.filter((f) => f.status === "in_progress").length;
    const pending = forms.filter((f) => f.status === "pending").length;
    const overdue = forms.filter((f) => f.status === "overdue").length;
    return { completed, inProgress, pending, overdue };
  }, [forms]);

  const isOffline = typeof window !== "undefined" && !navigator.onLine;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Forms</h1>
        <p className="text-sm text-gray-500 mt-1">Complete your assigned evaluation forms</p>
      </div>

      {/* ── Sync Status Banner ─────────────────────────────────────────── */}
      {isOffline ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-lg mb-6 flex items-center gap-2">
          <AppIcon name="activity" className="h-4 w-4" />
          <span className="text-sm font-medium">You are offline. Your responses will be saved locally and synced when you reconnect.</span>
        </div>
      ) : (
        <SyncBanner
          status={syncStatus.status}
          lastSync={syncStatus.lastSync}
          pendingItems={syncStatus.pendingItems}
        />
      )}

      {/* ── Stats Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Forms" value={forms.length} icon="clipboard" color="blue" />
        <StatCard label="Completed" value={stats.completed} icon="check" color="green" />
        <StatCard label="In Progress" value={stats.inProgress} icon="activity" color="yellow" />
        <StatCard label="Overdue" value={stats.overdue} icon="alert" color={stats.overdue > 0 ? "red" : "green"} />
      </div>

      {/* ── Forms List ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Assigned Forms</h3>
        {forms.length === 0 ? (
          <EmptyState
            title="No forms assigned"
            description="You haven't been assigned any evaluation forms yet. Check back later or contact your administrator."
            action={
              <button className="px-4 py-2 bg-amber-500 text-white rounded text-sm hover:bg-primary">
                Refresh
              </button>
            }
          />
        ) : (
          <div className="space-y-4">
            {forms.map((form) => (
              <div
                key={form.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 mb-1">{form.formName}</h4>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Due: {form.dueDate}</span>
                      {form.status === "overdue" && (
                        <span className="text-red-600 font-medium">OVERDUE</span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${
                      form.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : form.status === "in_progress"
                        ? "bg-amber-100 text-amber-800"
                        : form.status === "overdue"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {form.status.replace("_", " ")}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{form.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        form.progress === 100
                          ? "bg-green-500"
                          : form.progress > 0
                          ? "bg-amber-500"
                          : "bg-gray-300"
                      }`}
                      style={{ width: `${form.progress}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {form.status === "completed" ? (
                    <button className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition">
                      View Responses
                    </button>
                  ) : (
                    <button className="px-4 py-2 bg-amber-500 text-white rounded text-sm hover:bg-primary transition">
                      {form.progress > 0 ? "Continue Form" : "Start Form"}
                    </button>
                  )}
                  {form.status === "overdue" && (
                    <button className="px-4 py-2 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50 transition">
                      Request Extension
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Helpful Info ───────────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2"><AppIcon name="info" className="h-4 w-4" /> Save & Continue</h4>
          <p className="text-sm text-blue-800">
            Your progress is automatically saved every 30 seconds. You can close the browser and return later to continue where you left off.
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2"><AppIcon name="activity" className="h-4 w-4" /> Offline Mode</h4>
          <p className="text-sm text-green-800">
            If you lose internet connection, your responses are saved locally and will sync automatically when you reconnect.
          </p>
        </div>
      </div>
    </div>
  );
}
