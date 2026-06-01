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
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const rows: OrgRow[] = [];
    for (const line of lines) {
      const parts = line.split(",").map(p => p.trim());
      // simple CSV: name,jobTitle,department,reportsTo
      const row: OrgRow = { name: parts[0] || "" };
      if (parts[1]) row.jobTitle = parts[1];
      if (parts[2]) row.department = parts[2];
      if (parts[3]) row.reportsTo = parts[3];
      rows.push(row);
    }
    return rows;
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      try {
        const parsed = parseCSV(text);
        setError(null);
        onData?.(parsed);
      } catch (err) {
        setError("Failed to parse file");
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
