"use client"
import React, { useCallback, useState, useRef, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";

// ── Types ──────────────────────────────────────────────────────────────────

export type WorkflowNodeType = "start" | "task" | "decision" | "end";

export interface WorkflowNodeData {
  label: string;
  type: WorkflowNodeType;
  annotation?: string;
  isInefficient?: boolean;
  recommendation?: string;
}

export interface WorkflowNode extends Node<WorkflowNodeData> {
  type: WorkflowNodeType;
}

// ── Custom Node Components ─────────────────────────────────────────────────

function StartNode({ data, selected }: { data: WorkflowNodeData; selected: boolean }) {
  return (
    <div
      className={`px-4 py-2 rounded-full bg-green-500 text-white font-semibold text-sm shadow ${
        selected ? "ring-2 ring-blue-500" : ""
      }`}
      style={{ minWidth: 100, textAlign: "center" }}
    >
      {data.label || "Start"}
    </div>
  );
}

function EndNode({ data, selected }: { data: WorkflowNodeData; selected: boolean }) {
  return (
    <div
      className={`px-4 py-2 rounded-full bg-red-500 text-white font-semibold text-sm shadow ${
        selected ? "ring-2 ring-blue-500" : ""
      }`}
      style={{ minWidth: 100, textAlign: "center" }}
    >
      {data.label || "End"}
    </div>
  );
}

function TaskNode({ data, selected }: { data: WorkflowNodeData; selected: boolean }) {
  return (
    <div
      className={`px-4 py-3 rounded bg-white border-2 ${
        data.isInefficient ? "border-orange-500 bg-orange-50" : "border-gray-300"
      } ${selected ? "ring-2 ring-blue-500" : ""} shadow-sm min-w-[160px]`}
    >
      <div className="font-medium text-sm text-gray-800">{data.label}</div>
      {data.annotation && (
        <div className="text-xs text-gray-500 mt-1">{data.annotation}</div>
      )}
      {data.isInefficient && data.recommendation && (
        <div className="text-xs text-orange-700 mt-1 flex items-center gap-1">
          <span>⚠️</span> {data.recommendation}
        </div>
      )}
    </div>
  );
}

function DecisionNode({ data, selected }: { data: WorkflowNodeData; selected: boolean }) {
  return (
    <div
      className={`px-3 py-2 rounded bg-yellow-50 border-2 ${
        selected ? "ring-2 ring-blue-500" : "border-yellow-400"
      } shadow-sm`}
      style={{ minWidth: 120, textAlign: "center" }}
    >
      <div className="font-medium text-sm text-gray-800">{data.label}</div>
      {data.annotation && (
        <div className="text-xs text-gray-500 mt-1">{data.annotation}</div>
      )}
    </div>
  );
}

const nodeTypes = {
  start: StartNode,
  task: TaskNode,
  decision: DecisionNode,
  end: EndNode,
};

// ── Default Nodes ──────────────────────────────────────────────────────────

const initialNodes: WorkflowNode[] = [
  {
    id: "1",
    type: "start",
    position: { x: 250, y: 0 },
    data: { label: "Start", type: "start" },
  },
  {
    id: "2",
    type: "task",
    position: { x: 250, y: 80 },
    data: { label: "Review Application", type: "task" },
  },
  {
    id: "3",
    type: "decision",
    position: { x: 250, y: 180 },
    data: { label: "Approved?", type: "decision" },
  },
  {
    id: "4",
    type: "task",
    position: { x: 100, y: 280 },
    data: { label: "Send Rejection", type: "task" },
  },
  {
    id: "5",
    type: "task",
    position: { x: 400, y: 280 },
    data: { label: "Process Payment", type: "task" },
  },
  {
    id: "6",
    type: "end",
    position: { x: 250, y: 380 },
    data: { label: "End", type: "end" },
  },
];

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e2-3", source: "2", target: "3", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e3-4", source: "3", target: "4", label: "No", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e3-5", source: "3", target: "5", label: "Yes", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e4-6", source: "4", target: "6", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e5-6", source: "5", target: "6", markerEnd: { type: MarkerType.ArrowClosed } },
];

// ── Node Inspector Panel ───────────────────────────────────────────────────

interface NodeInspectorProps {
  node: WorkflowNode | null;
  onUpdate: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  onClose: () => void;
}

function NodeInspector({ node, onUpdate, onClose }: NodeInspectorProps) {
  const [annotation, setAnnotation] = useState(node?.data.annotation || "");
  const [isInefficient, setIsInefficient] = useState(node?.data.isInefficient || false);
  const [recommendation, setRecommendation] = useState(node?.data.recommendation || "");

  if (!node) return null;

  const handleSave = () => {
    onUpdate(node.id, {
      annotation,
      isInefficient,
      recommendation: isInefficient ? recommendation : undefined,
    });
  };

  return (
    <div className="absolute top-2 right-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-sm">Node Inspector</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
      </div>
      <div className="text-xs text-gray-500 mb-2">
        Type: <span className="font-medium text-gray-700">{node.type}</span>
      </div>
      <div className="text-xs text-gray-500 mb-3">
        ID: <span className="font-medium text-gray-700">{node.id}</span>
      </div>

      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 mb-1">Annotation</label>
        <textarea
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          rows={3}
          value={annotation}
          onChange={(e) => setAnnotation(e.target.value)}
          placeholder="Add notes about this step..."
        />
      </div>

      <div className="mb-3">
        <label className="flex items-center gap-2 text-xs text-gray-700">
          <input
            type="checkbox"
            checked={isInefficient}
            onChange={(e) => setIsInefficient(e.target.checked)}
            className="rounded"
          />
          Mark as inefficient
        </label>
      </div>

      {isInefficient && (
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Reengineering Recommendation
          </label>
          <textarea
            className="w-full border border-orange-300 rounded px-2 py-1 text-sm bg-orange-50"
            rows={2}
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            placeholder="How can this step be improved?"
          />
        </div>
      )}

      <button
        onClick={handleSave}
        className="w-full bg-amber-500 text-white text-sm py-2 rounded hover:bg-primary transition"
      >
        Save Changes
      </button>
    </div>
  );
}

// ── BPMN Import/Export Utilities ───────────────────────────────────────────

function exportToBPMN(nodes: Node[], edges: Edge[]): string {
  const processElements = nodes
    .map((node) => {
      const type = node.type || "task";
      const bpmnType =
        type === "start"
          ? "startEvent"
          : type === "end"
          ? "endEvent"
          : type === "decision"
          ? "exclusiveGateway"
          : "task";
      return `    <${bpmnType} id="${node.id}" name="${(node.data as WorkflowNodeData).label || node.id}" />`;
    })
    .join("\n");

  const flowElements = edges
    .map((edge) => {
      return `    <sequenceFlow id="${edge.id}" sourceRef="${edge.source}" targetRef="${edge.target}" ${edge.label ? `name="${edge.label}"` : ""} />`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" id="Definitions_1">
  <bpmn:process id="Process_1" isExecutable="false">
${processElements}
${flowElements}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
${nodes
  .map(
    (node) => `      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
        <dc:Bounds x="${node.position.x}" y="${node.position.y}" width="100" height="80" />
      </bpmndi:BPMNShape>`
  )
  .join("\n")}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}

function parseBPMN(xml: string): { nodes: WorkflowNode[]; edges: Edge[] } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");

  const nodes: WorkflowNode[] = [];
  const edges: Edge[] = [];

  // Parse flow elements (tasks, events, gateways)
  const elementTypes = ["task", "startEvent", "endEvent", "exclusiveGateway"];
  elementTypes.forEach((type) => {
    const elements = doc.getElementsByTagNameNS("http://www.omg.org/spec/BPMN/20100524/MODEL", type);
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const id = el.getAttribute("id") || `node-${i}`;
      const name = el.getAttribute("name") || id;

      let nodeType: WorkflowNodeType = "task";
      if (type === "startEvent") nodeType = "start";
      else if (type === "endEvent") nodeType = "end";
      else if (type === "exclusiveGateway") nodeType = "decision";

      nodes.push({
        id,
        type: nodeType,
        position: { x: 100 + (i % 3) * 150, y: 100 + Math.floor(i / 3) * 100 },
        data: { label: name, type: nodeType },
      });
    }
  });

  // Parse sequence flows
  const flows = doc.getElementsByTagNameNS(
    "http://www.omg.org/spec/BPMN/20100524/MODEL",
    "sequenceFlow"
  );
  for (let i = 0; i < flows.length; i++) {
    const flow = flows[i];
    const id = flow.getAttribute("id") || `edge-${i}`;
    const source = flow.getAttribute("sourceRef") || "";
    const target = flow.getAttribute("targetRef") || "";
    const label = flow.getAttribute("name") || undefined;

    edges.push({
      id,
      source,
      target,
      label,
      markerEnd: { type: MarkerType.ArrowClosed },
    });
  }

  return { nodes, edges };
}

// ── Main Component ─────────────────────────────────────────────────────────

interface WorkflowCanvasProps {
  evaluationId?: string;
  onSave?: (bpmnXml: string) => void;
}

export default function WorkflowCanvas({ evaluationId, onSave }: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [showInspector, setShowInspector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            markerEnd: { type: MarkerType.ArrowClosed },
          },
          eds
        )
      ),
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node as WorkflowNode);
      setShowInspector(true);
    },
    []
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setShowInspector(false);
  }, []);

  const handleNodeUpdate = useCallback(
    (nodeId: string, data: Partial<WorkflowNodeData>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, ...data } };
          }
          return node;
        })
      );
      setShowInspector(false);
      setSelectedNode(null);
    },
    [setNodes]
  );

  const addNode = (type: WorkflowNodeType) => {
    const id = `node-${Date.now()}`;
    const newNode: WorkflowNode = {
      id,
      type,
      position: { x: Math.random() * 400 + 50, y: Math.random() * 300 + 50 },
      data: {
        label: type === "start" ? "Start" : type === "end" ? "End" : `New ${type}`,
        type,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id)
    );
    setShowInspector(false);
    setSelectedNode(null);
  };

  // Export as PNG
  const exportPNG = async () => {
    try {
      const { toPng } = await import("html-to-image");
      const flowElement = document.querySelector(".react-flow__viewport");
      if (!flowElement) return;
      const dataUrl = await toPng(flowElement as HTMLElement, {
        backgroundColor: "#ffffff",
        quality: 1.0,
      });
      const link = document.createElement("a");
      link.download = `workflow-${evaluationId || "map"}.png`;
      link.href = dataUrl;
      link.click();

      // Upload to storage if evaluationId provided
      if (evaluationId) {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        await fetch(`/uploads/evaluation/${evaluationId}`, {
          method: "POST",
          headers: {
            "Content-Type": "image/png",
            "x-file-name": `workflow-${Date.now()}.png`,
          },
          body: blob,
        });
      }
    } catch (err) {
      console.error("Export PNG failed:", err);
    }
  };

  // Export as SVG
  const exportSVG = async () => {
    try {
      const { toSvg } = await import("html-to-image");
      const flowElement = document.querySelector(".react-flow__viewport");
      if (!flowElement) return;
      const dataUrl = await toSvg(flowElement as HTMLElement, {
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `workflow-${evaluationId || "map"}.svg`;
      link.href = dataUrl;
      link.click();

      if (evaluationId) {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        await fetch(`/uploads/evaluation/${evaluationId}`, {
          method: "POST",
          headers: {
            "Content-Type": "image/svg+xml",
            "x-file-name": `workflow-${Date.now()}.svg`,
          },
          body: blob,
        });
      }
    } catch (err) {
      console.error("Export SVG failed:", err);
    }
  };

  // Export BPMN
  const exportBPMN = () => {
    const bpmnXml = exportToBPMN(nodes, edges);
    const blob = new Blob([bpmnXml], { type: "application/xml" });
    const link = document.createElement("a");
    link.download = `workflow-${evaluationId || "map"}.bpmn`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);

    if (onSave) {
      onSave(bpmnXml);
    }
  };

  // Import BPMN
  const importBPMN = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const xml = e.target?.result as string;
      try {
        const { nodes: newNodes, edges: newEdges } = parseBPMN(xml);
        setNodes(newNodes);
        setEdges(newEdges);
      } catch (err) {
        alert("Failed to parse BPMN file: " + (err as Error).message);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Count inefficient nodes
  const inefficientCount = useMemo(
    () => nodes.filter((n) => (n.data as WorkflowNodeData).isInefficient).length,
    [nodes]
  );

  return (
    <div className="relative" style={{ height: 500, width: "100%" }}>
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        <button
          onClick={() => addNode("task")}
          className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 shadow-sm"
        >
          + Task
        </button>
        <button
          onClick={() => addNode("decision")}
          className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 shadow-sm"
        >
          + Decision
        </button>
        <button
          onClick={() => addNode("start")}
          className="px-3 py-1 bg-green-50 border border-green-300 rounded text-sm hover:bg-green-100 shadow-sm"
        >
          + Start
        </button>
        <button
          onClick={() => addNode("end")}
          className="px-3 py-1 bg-red-50 border border-red-300 rounded text-sm hover:bg-red-100 shadow-sm"
        >
          + End
        </button>
        {selectedNode && (
          <button
            onClick={deleteSelectedNode}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 shadow-sm"
          >
            Delete Selected
          </button>
        )}
      </div>

      <div className="absolute top-2 right-32 z-10 flex flex-col gap-1">
        <button
          onClick={exportPNG}
          className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 shadow-sm"
        >
          Export PNG
        </button>
        <button
          onClick={exportSVG}
          className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 shadow-sm"
        >
          Export SVG
        </button>
        <button
          onClick={exportBPMN}
          className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 shadow-sm"
        >
          Export BPMN
        </button>
        <label className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 shadow-sm cursor-pointer">
          Import BPMN
          <input
            ref={fileInputRef}
            type="file"
            accept=".bpmn,.xml"
            onChange={importBPMN}
            className="hidden"
          />
        </label>
      </div>

      {inefficientCount > 0 && (
        <Panel position="top-center" className="bg-orange-100 border border-orange-300 rounded px-3 py-1 text-sm text-orange-800">
          ⚠️ {inefficientCount} inefficient node(s) detected — review recommendations in node inspector
        </Panel>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        minZoom={0.2}
        maxZoom={2}
      >
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            switch (n.type) {
              case "start":
                return "#22c55e";
              case "end":
                return "#ef4444";
              case "decision":
                return "#eab308";
              default:
                return "#6b7280";
            }
          }}
          nodeStrokeColor="#374151"
        />
        <Background gap={15} />
      </ReactFlow>

      {showInspector && selectedNode && (
        <NodeInspector
          node={selectedNode}
          onUpdate={handleNodeUpdate}
          onClose={() => {
            setShowInspector(false);
            setSelectedNode(null);
          }}
        />
      )}
    </div>
  );
}