"use client"
import React, { useMemo, useState, useRef } from "react";
import type { OrgRow } from "./OrgChartUploader";
import { detectCycle } from "./cycleDetector";

function buildTree(rows: OrgRow[]) {
  const map = new Map<string, any>();
  for (const r of rows) {
    map.set(r.name, { ...r, children: [], parent: null });
  }
  const roots: any[] = [];
  for (const node of map.values()) {
    if (node.reportsTo && map.has(node.reportsTo)) {
      const parent = map.get(node.reportsTo);
      parent.children.push(node);
      node.parent = parent;
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function renderNode(node: any, x: number, y: number, onToggle: (n: any) => void) {
  return (
    <g key={node.name} transform={`translate(${x},${y})`}>
      <rect x={-60} y={-14} width={120} height={28} rx={6} fill="#fff" stroke="#94a3b8" />
      <text x={-56} y={4} fontSize={12} fill="#0f172a">{node.name}</text>
      <rect x={66} y={-12} width={16} height={16} rx={4} fill="#e2e8f0" stroke="#94a3b8" onClick={() => onToggle(node)} />
    </g>
  );
}

export default function OrgChart({ rows }: { rows: OrgRow[] }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const svgRef = useRef<SVGSVGElement | null>(null);

  const cycle = useMemo(() => detectCycle(rows || []), [rows]);
  const roots = useMemo(() => buildTree(rows || []), [rows]);

  function toggle(node: any) {
    setCollapsed(s => ({ ...s, [node.name]: !s[node.name] }));
  }

  function flatten(node: any, depth = 0, x = 0, y = 0, acc: any[] = []) {
    acc.push({ node, depth, x, y });
    if (collapsed[node.name]) return acc;
    let childY = y + 80;
    let offsetX = x - (node.children.length - 1) * 100 / 2;
    node.children.forEach((c: any, i: number) => {
      flatten(c, depth + 1, offsetX + i * 100, childY, acc);
    });
    return acc;
  }

  const items = useMemo(() => {
    const list: any[] = [];
    roots.forEach((r, i) => {
      flatten(r, 0, i * 240, 40, list);
    });
    return list;
  }, [roots, collapsed]);

  function downloadSVG() {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'organogram.svg';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadPNG() {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svg.clientWidth || 800;
      canvas.height = svg.clientHeight || 600;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const png = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = png;
      a.download = 'organogram.png';
      a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  async function uploadSVG(evaluationId = 'demo-eval') {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });

    const res = await fetch(`/uploads/evaluation/${evaluationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'image/svg+xml',
        'x-file-name': `organogram-${Date.now()}.svg`,
      },
      body: blob,
    });
    if (!res.ok) {
      const text = await res.text();
      alert('Upload failed: ' + text);
      return;
    }
    const json = await res.json();
    alert('Uploaded: ' + json.id);
  }

  if (!rows || rows.length === 0) return <div>No organogram data</div>;

  return (
    <div>
      <h3>Organogram</h3>
      {cycle.length > 0 && <div style={{ color: '#b91c1c' }}>Cycle detected: {cycle.join(', ')}</div>}
      <div style={{ marginBottom: 8 }}>
        <button onClick={downloadSVG} style={{ marginRight: 8 }}>Download SVG</button>
        <button onClick={downloadPNG} style={{ marginRight: 8 }}>Download PNG</button>
        <button onClick={() => uploadSVG()}>Upload SVG to storage</button>
      </div>
      <svg ref={svgRef} width={1000} height={800} style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        {items.map((it, idx) => (
          <g key={idx}>
            {it.node.parent && (
              <line x1={it.x} y1={it.y + 10} x2={it.node.parent.x || it.x} y2={(it.node.parent.y || it.y) - 20} stroke="#cbd5e1" />
            )}
            {renderNode(it.node, it.x, it.y, toggle)}
          </g>
        ))}
      </svg>
    </div>
  );
}
