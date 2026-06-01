"use client"
import React from "react";

export default function CycleErrorAlert({ involved }: { involved: string[] }) {
  if (!involved || involved.length === 0) return null;
  return (
    <div style={{ border: "1px solid #f59e0b", padding: 12, borderRadius: 6, background: "#fff7ed" }}>
      <strong>Cycle detected:</strong>
      <div>
        The following employees appear in a circular reporting relationship: {involved.join(", ")}
      </div>
    </div>
  );
}
