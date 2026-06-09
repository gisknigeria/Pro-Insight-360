"use client"
import React, { useState } from "react";

export type OrgRow = {
  name: string;
  jobTitle?: string;
  department?: string;
  reportsTo?: string;
};

export default function OrgChartUploader({ onData }: { onData?: (rows: OrgRow[]) => void }) {
  const [error, setError] = useState<string | null>(null);

  function parseCSV(text: string): OrgRow[] {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const rows: OrgRow[] = [];
    for (const line of lines) {
      const parts = line.split(",").map((p) => p.trim());
      const row: OrgRow = { name: parts[0] || "" };
      if (parts[1]) row.jobTitle = parts[1];
      if (parts[2]) row.department = parts[2];
      if (parts[3]) row.reportsTo = parts[3];
      rows.push(row);
    }
    return rows;
  }

  type ParsedOrgItem = {
    name?: string;
    title?: string;
    jobTitle?: string;
    department?: string;
    reportsTo?: string;
    reports_to?: string;
  };

  function parseItem(item: ParsedOrgItem): OrgRow {
    return {
      name: String(item.name || item.title || ''),
      jobTitle: item.jobTitle || item.title || undefined,
      department: item.department || undefined,
      reportsTo: item.reportsTo || item.reports_to || undefined,
    };
  }

  function parseJSON(text: string): OrgRow[] {
    const parsed = JSON.parse(text) as unknown;
    if (Array.isArray(parsed)) {
      return (parsed as ParsedOrgItem[]).map(parseItem);
    }

    if (typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { nodes?: unknown }).nodes)) {
      return ((parsed as { nodes: ParsedOrgItem[] }).nodes).map(parseItem);
    }

    throw new Error('JSON file must contain an array of rows or a { nodes: [...] } object.');
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      try {
        let parsed: OrgRow[];
        if (file.name.toLowerCase().endsWith('.json')) {
          parsed = parseJSON(text);
        } else {
          try {
            parsed = parseJSON(text);
          } catch {
            parsed = parseCSV(text);
          }
        }
        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error('No rows found in file.');
        }
        setError(null);
        onData?.(parsed);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse file");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div>
      <label className="block mb-2">Upload organogram CSV or JSON</label>
      <input type="file" accept=".csv,.json" onChange={handleFile} />
      {error && <div style={{ color: "#c00" }}>{error}</div>}
    </div>
  );
}
