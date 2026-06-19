"use client";
import React, { useMemo, useRef, useState } from "react";
import type { OrgRow } from "./OrgChartUploader";

// ─── Colour palette (cycles through departments) ──────────────────────────────
const DEPT_COLOURS = [
  { bg: '#dbeafe', border: '#3b82f6', text: '#1e3a8a' }, // blue
  { bg: '#d1fae5', border: '#10b981', text: '#064e3b' }, // emerald
  { bg: '#fef3c7', border: '#f59e0b', text: '#78350f' }, // amber
  { bg: '#ede9fe', border: '#8b5cf6', text: '#3b0764' }, // violet
  { bg: '#fee2e2', border: '#ef4444', text: '#7f1d1d' }, // red
  { bg: '#ffedd5', border: '#f97316', text: '#7c2d12' }, // orange
  { bg: '#cffafe', border: '#06b6d4', text: '#164e63' }, // cyan
  { bg: '#fce7f3', border: '#ec4899', text: '#831843' }, // pink
  { bg: '#f0fdf4', border: '#22c55e', text: '#14532d' }, // green
  { bg: '#f5f3ff', border: '#a855f7', text: '#581c87' }, // purple
];

const NODE_W = 140;
const NODE_H = 48;
const H_GAP = 18;  // horizontal gap between siblings
const V_GAP = 58;  // vertical gap between levels

// ─── Tree node ────────────────────────────────────────────────────────────────
interface TreeNode {
  name: string;
  title: string; // = group/department
  children: TreeNode[];
  // computed by layout pass:
  x: number;
  y: number;
  subtreeW: number;
}

function buildTree(rows: OrgRow[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  for (const r of rows) {
    const dept = r.title ?? r.department ?? r.jobTitle ?? '';
    map.set(r.name, { name: r.name, title: dept, children: [], x: 0, y: 0, subtreeW: 0 });
  }
  const roots: TreeNode[] = [];
  for (const r of rows) {
    const node = map.get(r.name)!;
    if (r.reportsTo && map.has(r.reportsTo)) {
      map.get(r.reportsTo)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

// Compute subtree widths bottom-up
function measure(node: TreeNode): number {
  if (node.children.length === 0) {
    node.subtreeW = NODE_W;
    return node.subtreeW;
  }
  const childrenW = node.children.reduce((sum, c) => sum + measure(c), 0)
    + H_GAP * (node.children.length - 1);
  node.subtreeW = Math.max(NODE_W, childrenW);
  return node.subtreeW;
}

// Assign x/y coordinates top-down
function layout(node: TreeNode, x: number, y: number) {
  node.x = x + node.subtreeW / 2;
  node.y = y;
  let childX = x;
  for (const child of node.children) {
    layout(child, childX, y + NODE_H + V_GAP);
    childX += child.subtreeW + H_GAP;
  }
}

// Flatten tree into a list for rendering
function flatten(node: TreeNode, acc: TreeNode[] = []): TreeNode[] {
  acc.push(node);
  for (const c of node.children) flatten(c, acc);
  return acc;
}

// Build all connector line segments
interface Line { x1: number; y1: number; x2: number; y2: number; }
function buildLines(node: TreeNode, lines: Line[] = []): Line[] {
  for (const child of node.children) {
    // elbow connector: down from parent bottom-centre, across, then down to child top-centre
    const px = node.x;
    const py = node.y + NODE_H;
    const cx = child.x;
    const cy = child.y;
    const midY = py + V_GAP / 2;
    lines.push({ x1: px, y1: py, x2: px, y2: midY });
    lines.push({ x1: px, y1: midY, x2: cx, y2: midY });
    lines.push({ x1: cx, y1: midY, x2: cx, y2: cy });
    buildLines(child, lines);
  }
  return lines;
}

// ─── Main component ───────────────────────────────────────────────────────────
interface OrgChartProps {
  rows: OrgRow[];
  reportTitle?: string;
  reportSummary?: string;
  reportSections?: Array<{ heading: string; lines: string[] }>;
}

export default function OrgChart({ rows, reportTitle = 'Organogram report', reportSummary = '', reportSections = [] }: OrgChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Build department → colour map
  const deptColourMap = useMemo(() => {
    const depts = [...new Set((rows ?? []).map(r => r.title ?? r.department ?? r.jobTitle ?? '').filter(Boolean))];
    const map = new Map<string, typeof DEPT_COLOURS[0]>();
    depts.forEach((d, i) => map.set(d, DEPT_COLOURS[i % DEPT_COLOURS.length]));
    return map;
  }, [rows]);

  const { allNodes, lines, svgW, svgH } = useMemo(() => {
    const roots = buildTree(rows ?? []);
    if (roots.length === 0) return { allNodes: [], lines: [], svgW: 400, svgH: 200 };

    // Measure and layout each root tree side by side
    let totalW = 0;
    for (const root of roots) {
      measure(root);
      totalW += root.subtreeW;
    }
    totalW += H_GAP * (roots.length - 1);

    let startX = 0;
    for (const root of roots) {
      layout(root, startX, 40);
      startX += root.subtreeW + H_GAP;
    }

    const allNodes = roots.flatMap(r => flatten(r));
    const lines = roots.flatMap(r => buildLines(r));

    const maxX = Math.max(...allNodes.map(n => n.x + NODE_W / 2));
    const maxY = Math.max(...allNodes.map(n => n.y + NODE_H));

    return { allNodes, lines, svgW: maxX + 40, svgH: maxY + 40 };
  }, [rows, collapsed]);

  function toggleCollapse(name: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function escapeHtml(value: string) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getSvgSource() {
    if (!svgRef.current) return '';
    const cloned = svgRef.current.cloneNode(true) as SVGSVGElement;
    cloned.setAttribute('width', String(svgW));
    cloned.setAttribute('height', String(svgH));
    cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    return new XMLSerializer().serializeToString(cloned);
  }

  function svgToPngDataUrl() {
    const source = getSvgSource();
    if (!source) return Promise.reject(new Error('No organogram to export.'));
    const img = new Image();
    const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }));
    return new Promise<string>((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = svgW + 40;
        canvas.height = svgH + 40;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Canvas export unavailable.'));
          return;
        }
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        const dataUrl = canvas.toDataURL('image/png');
        URL.revokeObjectURL(url);
        resolve(dataUrl);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Unable to render organogram image.'));
      };
      img.src = url;
    });
  }

  async function downloadImage() {
    const dataUrl = await svgToPngDataUrl();
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'organogram.png';
    a.click();
  }

  async function downloadReportPdf() {
    const imageUrl = await svgToPngDataUrl();
    const roles = rows.map(row => `${row.name}${row.title ? ` - ${row.title}` : ''}${row.reportsTo ? `, reports to ${row.reportsTo}` : ', top level'}`);
    const reportWindow = window.open('', '_blank', 'noopener,noreferrer,width=1024,height=768');
    if (!reportWindow) return;
    const sectionHtml = reportSections.map(section => `
      <section>
        <h2>${escapeHtml(section.heading)}</h2>
        <ul>${section.lines.map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul>
      </section>
    `).join('');

    reportWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(reportTitle)}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; margin: 32px; }
            h1 { font-size: 24px; margin: 0 0 8px; }
            h2 { font-size: 15px; margin: 24px 0 8px; color: #0f766e; text-transform: uppercase; letter-spacing: .04em; }
            p { line-height: 1.5; color: #475569; }
            img { width: 100%; max-height: 620px; object-fit: contain; border: 1px solid #e2e8f0; background: #f8fafc; margin-top: 18px; }
            ul { margin: 0; padding-left: 18px; }
            li { margin: 6px 0; line-height: 1.45; }
            .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 18px 0; }
            .meta div { background: #f1f5f9; padding: 12px; }
            .meta strong { display: block; font-size: 20px; }
            @media print { body { margin: 18mm; } }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(reportTitle)}</h1>
          ${reportSummary ? `<p>${escapeHtml(reportSummary)}</p>` : ''}
          <div class="meta">
            <div><strong>${rows.length}</strong><span>Roles</span></div>
            <div><strong>${new Set(rows.map(row => row.title).filter(Boolean)).size}</strong><span>Departments</span></div>
            <div><strong>${rows.filter(row => !row.reportsTo).length}</strong><span>Top-level roles</span></div>
          </div>
          <img src="${imageUrl}" alt="Organogram" />
          ${sectionHtml}
          <section>
            <h2>Role list</h2>
            <ul>${roles.map(role => `<li>${escapeHtml(role)}</li>`).join('')}</ul>
          </section>
          <script>window.onload = () => { window.focus(); window.print(); };</script>
        </body>
      </html>
    `);
    reportWindow.document.close();
  }

  async function downloadPNG() {
    if (!svgRef.current) return;
    const source = getSvgSource();
    const img = new Image();
    const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }));
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svgW + 40;
      canvas.height = svgH + 40;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'organogram.png';
      a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  if (!rows || rows.length === 0) {
    return <div className="text-slate-400 text-sm p-4">No organogram data.</div>;
  }

  return (
    <div>
      {/* Download buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => void downloadReportPdf()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition">
          Download PDF report
        </button>
        <button onClick={() => void downloadImage()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
          Download organogram image
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[...deptColourMap.entries()].map(([dept, col]) => (
          <span key={dept} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>
            {dept}
          </span>
        ))}
      </div>

      {/* SVG chart */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <svg ref={svgRef} viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMin meet"
          style={{ background: '#f8fafc', display: 'block', width: '100%', height: 'auto', maxHeight: '68vh' }}>

          {/* Connector lines */}
          {lines.map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke="#cbd5e1" strokeWidth={1.5} strokeLinecap="round" />
          ))}

          {/* Nodes */}
          {allNodes.map(node => {
            const col = deptColourMap.get(node.title) ?? DEPT_COLOURS[0];
            const nx = node.x - NODE_W / 2;
            const ny = node.y;
            const hasChildren = node.children.length > 0;
            const isCollapsed = collapsed.has(node.name);

            // Wrap long name into two lines
            const words = node.name.split(' ');
            let line1 = '', line2 = '';
            let curr = '';
            for (const w of words) {
              if ((curr + ' ' + w).trim().length <= 20) {
                curr = (curr + ' ' + w).trim();
              } else {
                if (!line1) { line1 = curr; curr = w; }
                else { line2 = (curr + ' ' + w).trim(); curr = ''; break; }
              }
            }
            if (!line1) { line1 = curr; }
            else if (curr && !line2) { line2 = curr; }

            return (
              <g key={node.name} style={{ cursor: hasChildren ? 'pointer' : 'default' }}
                onClick={hasChildren ? () => toggleCollapse(node.name) : undefined}>
                {/* Card shadow */}
                <rect x={nx + 2} y={ny + 2} width={NODE_W} height={NODE_H} rx={8}
                  fill="rgba(0,0,0,0.06)" />
                {/* Card background */}
                <rect x={nx} y={ny} width={NODE_W} height={NODE_H} rx={8}
                  fill={col.bg} stroke={col.border} strokeWidth={1.5} />
                {/* Top accent bar */}
                <rect x={nx} y={ny} width={NODE_W} height={4} rx={4}
                  fill={col.border} />
                {/* Name text — line 1 */}
                <text x={node.x} y={ny + 20} textAnchor="middle"
                  fontSize={11} fontWeight="700" fill={col.text}
                  style={{ pointerEvents: 'none' }}>
                  {line1}
                </text>
                {/* Name text — line 2 */}
                {line2 && (
                  <text x={node.x} y={ny + 32} textAnchor="middle"
                    fontSize={11} fontWeight="700" fill={col.text}
                    style={{ pointerEvents: 'none' }}>
                    {line2}
                  </text>
                )}
                {/* Department sub-label */}
                <text x={node.x} y={ny + NODE_H - 7} textAnchor="middle"
                  fontSize={9} fill={col.text} opacity={0.65}
                  style={{ pointerEvents: 'none' }}>
                  {node.title}
                </text>
                {/* Collapse toggle dot */}
                {hasChildren && (
                  <circle cx={nx + NODE_W - 10} cy={ny + 10} r={6}
                    fill={isCollapsed ? col.border : '#fff'}
                    stroke={col.border} strokeWidth={1.5} />
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
