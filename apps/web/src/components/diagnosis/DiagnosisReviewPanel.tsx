"use client"
import React, { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

export type DiagnosisStatus = "pending_review" | "in_review" | "approved" | "rejected";

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  dimension: "WHO" | "WHAT" | "HOW" | "WHEN";
  effort: "low" | "medium" | "high";
  expectedBenefit: string;
  timeline?: string;
  position: number;
}

export interface DiagnosisVersion {
  id: string;
  version: number;
  content: DiagnosisContent;
  createdAt: string;
}

export interface DiagnosisContent {
  executiveSummary: string;
  whoFindings: string;
  whatFindings: string;
  howFindings: string;
  whenFindings: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: Omit<Recommendation, "id" | "position">[];
}

export interface Diagnosis {
  id: string;
  evaluationId: string;
  version: number;
  content: DiagnosisContent;
  status: DiagnosisStatus;
  isAiGenerated: boolean;
  generatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  editsMade: boolean;
  rejectionReason?: string;
}

// ── Section Editor ─────────────────────────────────────────────────────────

interface SectionEditorProps {
  title: string;
  content: string;
  onChange: (content: string) => void;
  isEditing: boolean;
}

function SectionEditor({ title, content, onChange, isEditing }: SectionEditorProps) {
  if (isEditing) {
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">{title}</label>
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
      <p className="text-sm text-gray-600 whitespace-pre-wrap">{content}</p>
    </div>
  );
}

// ── Recommendation Editor ──────────────────────────────────────────────────

interface RecommendationEditorProps {
  recommendation: Omit<Recommendation, "id" | "position">;
  onChange: (rec: Omit<Recommendation, "id" | "position">) => void;
  isEditing: boolean;
  onAddTimeline: (timeline: string) => void;
}

function RecommendationEditor({ recommendation, onChange, isEditing, onAddTimeline }: RecommendationEditorProps) {
  const priorityColors = {
    critical: "bg-red-100 text-red-800",
    high: "bg-orange-100 text-orange-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-blue-100 text-blue-800",
  };

  if (isEditing) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
            <input
              type="text"
              value={recommendation.title}
              onChange={(e) => onChange({ ...recommendation, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
              <select
                value={recommendation.priority}
                onChange={(e) => onChange({ ...recommendation, priority: e.target.value as Recommendation["priority"] })}
                className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dimension</label>
              <select
                value={recommendation.dimension}
                onChange={(e) => onChange({ ...recommendation, dimension: e.target.value as Recommendation["dimension"] })}
                className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="WHO">WHO</option>
                <option value="WHAT">WHAT</option>
                <option value="HOW">HOW</option>
                <option value="WHEN">WHEN</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Effort</label>
              <select
                value={recommendation.effort}
                onChange={(e) => onChange({ ...recommendation, effort: e.target.value as Recommendation["effort"] })}
                className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea
            value={recommendation.description}
            onChange={(e) => onChange({ ...recommendation, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Expected Benefit</label>
          <input
            type="text"
            value={recommendation.expectedBenefit}
            onChange={(e) => onChange({ ...recommendation, expectedBenefit: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Implementation Timeline</label>
          <input
            type="text"
            value={recommendation.timeline || ""}
            onChange={(e) => onAddTimeline(e.target.value)}
            placeholder="e.g., Q2 2026"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
      <div className="flex items-start justify-between mb-2">
        <h5 className="font-medium text-gray-800">{recommendation.title}</h5>
        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${priorityColors[recommendation.priority]}`}>
          {recommendation.priority}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-2">{recommendation.description}</p>
      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        <span className="bg-gray-100 px-2 py-0.5 rounded">Dimension: {recommendation.dimension}</span>
        <span className="bg-gray-100 px-2 py-0.5 rounded">Effort: {recommendation.effort}</span>
        {recommendation.timeline && (
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Timeline: {recommendation.timeline}</span>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        <span className="font-medium">Expected benefit:</span> {recommendation.expectedBenefit}
      </p>
    </div>
  );
}

// ── Audit History Drawer ───────────────────────────────────────────────────

interface AuditHistoryDrawerProps {
  versions: DiagnosisVersion[];
  isOpen: boolean;
  onClose: () => void;
}

function AuditHistoryDrawer({ versions, isOpen, onClose }: AuditHistoryDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Diagnosis History</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        <div className="p-4 overflow-y-auto h-full pb-20">
          {versions
            .sort((a, b) => b.version - a.version)
            .map((version) => (
              <div key={version.id} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-800">Version {version.version}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(version.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">{version.content.executiveSummary}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

interface DiagnosisReviewPanelProps {
  diagnosis: Diagnosis;
  versions: DiagnosisVersion[];
  onApprove: () => void;
  onReject: (reason: string) => void;
  onEdit: (updatedContent: DiagnosisContent) => void;
  userId: string;
}

export default function DiagnosisReviewPanel({
  diagnosis,
  versions,
  onApprove,
  onReject,
  onEdit,
  userId,
}: DiagnosisReviewPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(diagnosis.content);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const statusLabels: Record<DiagnosisStatus, string> = {
    pending_review: "Pending Review",
    in_review: "In Review",
    approved: "Approved",
    rejected: "Rejected",
  };

  const statusColors: Record<DiagnosisStatus, string> = {
    pending_review: "bg-yellow-100 text-yellow-800 border-yellow-300",
    in_review: "bg-blue-100 text-blue-800 border-blue-300",
    approved: "bg-green-100 text-green-800 border-green-300",
    rejected: "bg-red-100 text-red-800 border-red-300",
  };

  const handleSave = () => {
    onEdit(editedContent);
    setIsEditing(false);
  };

  const handleApprove = () => {
    if (isEditing) {
      onEdit(editedContent);
    }
    onApprove();
  };

  const handleReject = () => {
    if (rejectionReason.trim()) {
      onReject(rejectionReason);
      setRejectionReason("");
      setShowRejectDialog(false);
    }
  };

  const canEdit = diagnosis.status === "pending_review" || diagnosis.status === "rejected";
  const canApprove = diagnosis.status !== "approved";
  const canReject = diagnosis.status !== "approved";

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Diagnosis Review</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${statusColors[diagnosis.status]}`}>
              {statusLabels[diagnosis.status]}
            </span>
            {diagnosis.isAiGenerated && diagnosis.status === "pending_review" && (
              <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">AI-Generated</span>
            )}
            <span className="text-xs text-gray-500">v{diagnosis.version}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(true)}
            className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            View History
          </button>
          {canEdit && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-2 text-sm rounded-md ${
                isEditing
                  ? "bg-gray-200 text-gray-700"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
              }`}
            >
              {isEditing ? "Cancel Edit" : "Edit"}
            </button>
          )}
        </div>
      </div>

      {/* Content Sections */}
      <SectionEditor
        title="Executive Summary"
        content={editedContent.executiveSummary}
        onChange={(content) => setEditedContent({ ...editedContent, executiveSummary: content })}
        isEditing={isEditing}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionEditor
          title="WHO Findings (People & Skills)"
          content={editedContent.whoFindings}
          onChange={(content) => setEditedContent({ ...editedContent, whoFindings: content })}
          isEditing={isEditing}
        />
        <SectionEditor
          title="WHAT Findings (Technology & Data)"
          content={editedContent.whatFindings}
          onChange={(content) => setEditedContent({ ...editedContent, whatFindings: content })}
          isEditing={isEditing}
        />
        <SectionEditor
          title="HOW Findings (Processes & Governance)"
          content={editedContent.howFindings}
          onChange={(content) => setEditedContent({ ...editedContent, howFindings: content })}
          isEditing={isEditing}
        />
        <SectionEditor
          title="WHEN Findings (Timelines & Planning)"
          content={editedContent.whenFindings}
          onChange={(content) => setEditedContent({ ...editedContent, whenFindings: content })}
          isEditing={isEditing}
        />
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
        <div>
          <h4 className="text-sm font-semibold text-green-700 mb-3">Strengths</h4>
          <ul className="space-y-2">
            {editedContent.strengths.map((strength, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-500 mt-1">✓</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={strength}
                    onChange={(e) => {
                      const newStrengths = [...editedContent.strengths];
                      newStrengths[i] = e.target.value;
                      setEditedContent({ ...editedContent, strengths: newStrengths });
                    }}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                ) : (
                  strength
                )}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-red-700 mb-3">Weaknesses</h4>
          <ul className="space-y-2">
            {editedContent.weaknesses.map((weakness, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-red-500 mt-1">✗</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={weakness}
                    onChange={(e) => {
                      const newWeaknesses = [...editedContent.weaknesses];
                      newWeaknesses[i] = e.target.value;
                      setEditedContent({ ...editedContent, weaknesses: newWeaknesses });
                    }}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                ) : (
                  weakness
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      <div className="my-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Recommendations</h4>
        {editedContent.recommendations.map((rec, i) => (
          <RecommendationEditor
            key={i}
            recommendation={rec}
            onChange={(updatedRec) => {
              const newRecs = [...editedContent.recommendations];
              newRecs[i] = updatedRec;
              setEditedContent({ ...editedContent, recommendations: newRecs });
            }}
            isEditing={isEditing}
            onAddTimeline={(timeline) => {
              const newRecs = [...editedContent.recommendations];
              newRecs[i] = { ...newRecs[i], timeline };
              setEditedContent({ ...editedContent, recommendations: newRecs });
            }}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          {diagnosis.reviewedAt && (
            <span>
              Reviewed by {diagnosis.reviewedBy} on {new Date(diagnosis.reviewedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isEditing && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Save Changes
            </button>
          )}
          {canReject && (
            <button
              onClick={() => setShowRejectDialog(true)}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium"
            >
              Reject & Regenerate
            </button>
          )}
          {canApprove && (
            <button
              onClick={handleApprove}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
            >
              Approve
            </button>
          )}
        </div>
      </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Reject Diagnosis</h3>
            <p className="text-sm text-gray-600 mb-4">
              Provide a reason for rejection. The diagnosis will be regenerated and the previous version will be retained.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-4"
              placeholder="Enter rejection reason..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Drawer */}
      <AuditHistoryDrawer
        versions={versions}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}