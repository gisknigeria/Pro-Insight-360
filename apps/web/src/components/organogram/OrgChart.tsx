"use client";

import React, { useMemo, useRef, useState } from "react";
import { AppIcon } from "@/components/ui/app-icons";
import type { OrgRow } from "./OrgChartUploader";

const DEPT_COLOURS = [
  { bg: "#dbeafe", border: "#3b82f6", text: "#1e3a8a" },
  { bg: "#d1fae5", border: "#10b981", text: "#064e3b" },
  { bg: "#fef3c7", border: "#f59e0b", text: "#78350f" },
  { bg: "#ede9fe", border: "#8b5cf6", text: "#3b0764" },
  { bg: "#fee2e2", border: "#ef4444", text: "#7f1d1d" },
  { bg: "#ffedd5", border: "#f97316", text: "#7c2d12" },
  { bg: "#cffafe", border: "#06b6d4", text: "#164e63" },
  { bg: "#fce7f3", border: "#ec4899", text: "#831843" },
  { bg: "#f0fdf4", border: "#22c55e", text: "#14532d" },
  { bg: "#f5f3ff", border: "#a855f7", text: "#581c87" },
];

const NODE_W = 140;
const NODE_H = 48;
const H_GAP = 18;
const V_GAP = 58;

interface TreeNode {
  name: string;
  title: string;
  children: TreeNode[];
  x: number;
  y: number;
  subtreeW: number;
}

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface OrgChartProps {
  rows: OrgRow[];
  reportTitle?: string;
  reportSummary?: string;
  reportSections?: Array<{ heading: string; lines: string[] }>;
}

function buildTree(rows: OrgRow[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  rows.forEach((row) => {
    const dept = row.title ?? row.department ?? row.jobTitle ?? "";
    map.set(row.name, { name: row.name, title: dept, children: [], x: 0, y: 0, subtreeW: 0 });
  });

  const roots: TreeNode[] = [];
  rows.forEach((row) => {
    const node = map.get(row.name);
    if (!node) return;
    if (row.reportsTo && map.has(row.reportsTo)) {
      map.get(row.reportsTo)?.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function measure(node: TreeNode): number {
  if (node.children.length === 0) {
    node.subtreeW = NODE_W;
    return node.subtreeW;
  }
  const childrenW = node.children.reduce((sum, child) => sum + measure(child), 0) + H_GAP * (node.children.length - 1);
  node.subtreeW = Math.max(NODE_W, childrenW);
  return node.subtreeW;
}

function layout(node: TreeNode, x: number, y: number) {
  node.x = x + node.subtreeW / 2;
  node.y = y;
  let childX = x;
  node.children.forEach((child) => {
    layout(child, childX, y + NODE_H + V_GAP);
    childX += child.subtreeW + H_GAP;
  });
}

function flatten(node: TreeNode, acc: TreeNode[] = []): TreeNode[] {
  acc.push(node);
  node.children.forEach((child) => flatten(child, acc));
  return acc;
}

function buildLines(node: TreeNode, lines: Line[] = []): Line[] {
  node.children.forEach((child) => {
    const px = node.x;
    const py = node.y + NODE_H;
    const cx = child.x;
    const cy = child.y;
    const midY = py + V_GAP / 2;
    lines.push({ x1: px, y1: py, x2: px, y2: midY });
    lines.push({ x1: px, y1: midY, x2: cx, y2: midY });
    lines.push({ x1: cx, y1: midY, x2: cx, y2: cy });
    buildLines(child, lines);
  });
  return lines;
}

function cleanPdfText(value: string) {
  return String(value || "").replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();
}

function escapePdfText(value: string) {
  return cleanPdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapPdfText(value: string, maxChars = 86) {
  const words = cleanPdfText(value).split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function addPdfText(lines: string[], x: number, startY: number, size = 10, leading = 14) {
  return lines.map((line, index) => `BT /F1 ${size} Tf ${x} ${startY - index * leading} Td (${escapePdfText(line)}) Tj ET`).join("\n");
}

export default function OrgChart({ rows, reportTitle = "Organogram report", reportSummary = "", reportSections = [] }: OrgChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [fullScreen, setFullScreen] = useState(false);

  const deptColourMap = useMemo(() => {
    const depts = [...new Set((rows ?? []).map((row) => row.title ?? row.department ?? row.jobTitle ?? "").filter(Boolean))];
    const map = new Map<string, typeof DEPT_COLOURS[0]>();
    depts.forEach((dept, index) => map.set(dept, DEPT_COLOURS[index % DEPT_COLOURS.length]));
    return map;
  }, [rows]);

  const { allNodes, lines, svgW, svgH } = useMemo(() => {
    const roots = buildTree(rows ?? []);
    if (roots.length === 0) return { allNodes: [], lines: [], svgW: 400, svgH: 200 };

    let totalW = 0;
    roots.forEach((root) => {
      measure(root);
      totalW += root.subtreeW;
    });
    totalW += H_GAP * (roots.length - 1);

    let startX = 0;
    roots.forEach((root) => {
      layout(root, startX, 40);
      startX += root.subtreeW + H_GAP;
    });

    const allNodes = roots.flatMap((root) => flatten(root));
    const lines = roots.flatMap((root) => buildLines(root));
    const maxX = Math.max(...allNodes.map((node) => node.x + NODE_W / 2));
    const maxY = Math.max(...allNodes.map((node) => node.y + NODE_H));

    return { allNodes, lines, svgW: maxX + 40, svgH: maxY + 40 };
  }, [rows, collapsed]);

  function toggleCollapse(name: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function getSvgSource() {
    if (!svgRef.current) return "";
    const cloned = svgRef.current.cloneNode(true) as SVGSVGElement;
    cloned.setAttribute("width", String(svgW));
    cloned.setAttribute("height", String(svgH));
    cloned.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return new XMLSerializer().serializeToString(cloned);
  }

  function svgToCanvasDataUrl(type: "image/png" | "image/jpeg" = "image/png") {
    const source = getSvgSource();
    if (!source) return Promise.reject(new Error("No organogram to export."));
    const img = new Image();
    const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
    return new Promise<{ dataUrl: string; width: number; height: number }>((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = svgW + 40;
        canvas.height = svgH + 40;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("Canvas export unavailable."));
          return;
        }
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        const dataUrl = canvas.toDataURL(type, 0.92);
        URL.revokeObjectURL(url);
        resolve({ dataUrl, width: canvas.width, height: canvas.height });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Unable to render organogram image."));
      };
      img.src = url;
    });
  }

  async function downloadImage() {
    const { dataUrl } = await svgToCanvasDataUrl("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "organogram.png";
    a.click();
  }

  function buildPdfBlob(image: { dataUrl: string; width: number; height: number }) {
    const pageW = 595;
    const pageH = 842;
    const margin = 42;
    const maxImageW = pageW - margin * 2;
    const maxImageH = 470;
    const imageRatio = image.width / image.height;
    let imageW = maxImageW;
    let imageH = imageW / imageRatio;
    if (imageH > maxImageH) {
      imageH = maxImageH;
      imageW = imageH * imageRatio;
    }

    const roleLines = rows.map((row) => `${row.name}${row.title ? ` - ${row.title}` : ""}${row.reportsTo ? `, reports to ${row.reportsTo}` : ", top level"}`);
    const narrative = [
      ...reportSections.flatMap((section) => [
        `${section.heading}:`,
        ...section.lines.map((line) => `- ${line}`),
        "",
      ]),
      "Role list:",
      ...roleLines.map((role) => `- ${role}`),
    ];

    const firstPageContent = [
      addPdfText([reportTitle], margin, 800, 20, 24),
      ...wrapPdfText(reportSummary || "Organisational structure and accountability report.", 92).map((line, index) => addPdfText([line], margin, 770 - index * 13, 10, 13)),
      addPdfText([`Roles: ${rows.length}`], margin, 720, 12, 14),
      addPdfText([`Departments: ${new Set(rows.map((row) => row.title).filter(Boolean)).size}`], margin + 160, 720, 12, 14),
      addPdfText([`Top-level roles: ${rows.filter((row) => !row.reportsTo).length}`], margin + 340, 720, 12, 14),
      `q ${imageW.toFixed(2)} 0 0 ${imageH.toFixed(2)} ${(margin + (maxImageW - imageW) / 2).toFixed(2)} 96 cm /Im1 Do Q`,
    ].join("\n");

    const pageLines: string[] = [];
    narrative.forEach((line) => {
      if (!line) {
        pageLines.push("");
        return;
      }
      wrapPdfText(line, line.startsWith("-") ? 92 : 74).forEach((wrappedLine) => pageLines.push(wrappedLine));
    });

    const textPages: string[] = [];
    while (pageLines.length) {
      const chunk = pageLines.splice(0, 48);
      textPages.push(chunk.map((line, index) => addPdfText([line], margin, 800 - index * 15, line.endsWith(":") ? 12 : 9.5, 15)).join("\n"));
    }

    const contents = [firstPageContent, ...textPages];
    const imageBinary = atob(image.dataUrl.split(",")[1] || "");
    const imageBuffer = new ArrayBuffer(imageBinary.length);
    const imageBytes = new Uint8Array(imageBuffer);
    for (let index = 0; index < imageBinary.length; index += 1) {
      imageBytes[index] = imageBinary.charCodeAt(index);
    }
    type PdfPart = string | Uint8Array<ArrayBuffer>;
    const offsets: number[] = [];
    const parts: PdfPart[] = [];
    const encoder = new TextEncoder();
    let offset = 0;
    const byteLength = (part: PdfPart) => (typeof part === "string" ? encoder.encode(part).length : part.byteLength);
    const addPart = (part: PdfPart) => {
      parts.push(part);
      offset += byteLength(part);
    };
    const addObject = (id: number, body: string) => {
      offsets[id] = offset;
      addPart(`${id} 0 obj\n${body}\nendobj\n`);
    };

    addPart("%PDF-1.4\n");
    addObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
    const firstPageId = 5;
    const objectCount = firstPageId + contents.length * 2;
    addObject(2, `<< /Type /Pages /Kids [ ${contents.map((_, index) => `${firstPageId + index * 2} 0 R`).join(" ")} ] /Count ${contents.length} >>`);
    addObject(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    offsets[4] = offset;
    addPart(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`);
    addPart(imageBytes);
    addPart("\nendstream\nendobj\n");

    contents.forEach((content, index) => {
      const pageId = firstPageId + index * 2;
      const contentId = pageId + 1;
      addObject(pageId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 3 0 R >> /XObject << /Im1 4 0 R >> >> /Contents ${contentId} 0 R >>`);
      addObject(contentId, `<< /Length ${byteLength(content)} >>\nstream\n${content}\nendstream`);
    });

    const xrefOffset = offset;
    addPart(`xref\n0 ${objectCount}\n0000000000 65535 f \n`);
    for (let id = 1; id < objectCount; id += 1) {
      addPart(`${String(offsets[id] || 0).padStart(10, "0")} 00000 n \n`);
    }
    addPart(`trailer\n<< /Size ${objectCount} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
    return new Blob(parts, { type: "application/pdf" });
  }

  async function downloadReportPdf() {
    const image = await svgToCanvasDataUrl("image/jpeg");
    const blob = buildPdfBlob(image);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cleanPdfText(reportTitle).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "organogram-report"}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const chartSvg = () => (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${svgW} ${svgH}`}
      preserveAspectRatio="xMidYMin meet"
      style={{ background: "#f8fafc", display: "block", width: "100%", height: "auto", maxHeight: fullScreen ? "calc(100vh - 160px)" : "68vh" }}
    >
      {lines.map((line, index) => (
        <line key={index} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#cbd5e1" strokeWidth={1.5} strokeLinecap="round" />
      ))}

      {allNodes.map((node) => {
        const col = deptColourMap.get(node.title) ?? DEPT_COLOURS[0];
        const nx = node.x - NODE_W / 2;
        const ny = node.y;
        const hasChildren = node.children.length > 0;
        const isCollapsed = collapsed.has(node.name);
        const words = node.name.split(" ");
        let line1 = "";
        let line2 = "";
        let curr = "";
        for (const word of words) {
          if ((curr + " " + word).trim().length <= 20) {
            curr = (curr + " " + word).trim();
          } else if (!line1) {
            line1 = curr;
            curr = word;
          } else {
            line2 = (curr + " " + word).trim();
            curr = "";
            break;
          }
        }
        if (!line1) line1 = curr;
        else if (curr && !line2) line2 = curr;

        return (
          <g key={node.name} style={{ cursor: hasChildren ? "pointer" : "default" }} onClick={hasChildren ? (event) => { event.stopPropagation(); toggleCollapse(node.name); } : undefined}>
            <rect x={nx + 2} y={ny + 2} width={NODE_W} height={NODE_H} rx={8} fill="rgba(0,0,0,0.06)" />
            <rect x={nx} y={ny} width={NODE_W} height={NODE_H} rx={8} fill={col.bg} stroke={col.border} strokeWidth={1.5} />
            <rect x={nx} y={ny} width={NODE_W} height={4} rx={4} fill={col.border} />
            <text x={node.x} y={ny + 20} textAnchor="middle" fontSize={11} fontWeight="700" fill={col.text} style={{ pointerEvents: "none" }}>
              {line1}
            </text>
            {line2 && (
              <text x={node.x} y={ny + 32} textAnchor="middle" fontSize={11} fontWeight="700" fill={col.text} style={{ pointerEvents: "none" }}>
                {line2}
              </text>
            )}
            <text x={node.x} y={ny + NODE_H - 7} textAnchor="middle" fontSize={9} fill={col.text} opacity={0.65} style={{ pointerEvents: "none" }}>
              {node.title}
            </text>
            {hasChildren && <circle cx={nx + NODE_W - 10} cy={ny + 10} r={6} fill={isCollapsed ? col.border : "#fff"} stroke={col.border} strokeWidth={1.5} />}
          </g>
        );
      })}
    </svg>
  );

  if (!rows || rows.length === 0) {
    return <div className="p-4 text-sm text-slate-400">No organogram data.</div>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => void downloadReportPdf()} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800">
          <AppIcon name="file" className="h-4 w-4" />
          Download PDF report
        </button>
        <button type="button" onClick={() => void downloadImage()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
          <AppIcon name="download" className="h-4 w-4" />
          Download organogram image
        </button>
        <button type="button" onClick={() => setFullScreen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 transition hover:bg-teal-100">
          <AppIcon name="expand" className="h-4 w-4" />
          Full screen
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {[...deptColourMap.entries()].map(([dept, col]) => (
          <span key={dept} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>
            {dept}
          </span>
        ))}
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => setFullScreen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setFullScreen(true);
          }
        }}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 outline-none ring-teal-200 transition focus:ring-2"
        title="Open organogram full screen"
      >
        {chartSvg()}
      </div>

      {fullScreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 p-3 backdrop-blur-sm sm:p-6">
          <div className="flex h-full flex-col bg-white shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-teal-600">Full screen organogram</p>
                <h3 className="text-base font-bold text-slate-900">{reportTitle}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void downloadReportPdf()} className="inline-flex items-center gap-1.5 bg-slate-900 px-3 py-2 text-xs font-bold text-white">
                  <AppIcon name="file" className="h-4 w-4" />
                  PDF report
                </button>
                <button type="button" onClick={() => void downloadImage()} className="inline-flex items-center gap-1.5 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800">
                  <AppIcon name="download" className="h-4 w-4" />
                  Image
                </button>
                <button type="button" onClick={() => setFullScreen(false)} className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                  <AppIcon name="x" className="h-4 w-4" />
                  Close
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-slate-50 p-4">{chartSvg()}</div>
          </div>
        </div>
      )}
    </div>
  );
}
