"use client";

import { useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  type OnSelectionChangeFunc,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { PipelineNode, type PipelineNodeData } from "./pipeline-node";
import { usePipelineStore } from "@/lib/store/pipeline-store";
import type { AgentName, AgentNodeStatus } from "@/lib/agents/types";

const NODE_DEFS: { key: AgentName; label: string; color: string; description: string }[] = [
  { key: "topicClarifier", label: "Topic Clarifier", color: "#60a5fa", description: "Refine your idea into a niche" },
  { key: "nicheResearcher", label: "Niche Researcher", color: "#a78bfa", description: "Deep research on your niche" },
  { key: "videoSuggester", label: "Video Suggester", color: "#22d3ee", description: "Reference videos & trends" },
  { key: "ideaRefiner", label: "Idea Refiner", color: "#fbbf24", description: "Lock in your unique angle" },
  { key: "scriptWriter", label: "Script Writer", color: "#4ade80", description: "Structured script draft" },
  { key: "timelineBuilder", label: "Timeline Builder", color: "#fb7185", description: "Visual timeline layout" },
];

function buildNodes(statuses: Record<AgentName, AgentNodeStatus>): Node<PipelineNodeData>[] {
  const xStart = 40;
  const yCenter = 120;
  const xGap = 190;

  return NODE_DEFS.map((def, i) => ({
    id: def.key,
    type: "pipeline",
    position: { x: xStart + i * xGap, y: yCenter },
    data: {
      label: def.label,
      agentKey: def.key,
      status: statuses[def.key],
      color: def.color,
      description: def.description,
    },
  }));
}

function buildEdges(statuses: Record<AgentName, AgentNodeStatus>): Edge[] {
  return NODE_DEFS.slice(0, -1).map((def, i) => {
    const sourceComplete = statuses[def.key] === "complete";
    const targetRunning = statuses[NODE_DEFS[i + 1].key] === "running";
    return {
      id: `${def.key}->${NODE_DEFS[i + 1].key}`,
      source: def.key,
      target: NODE_DEFS[i + 1].key,
      animated: sourceComplete && targetRunning,
      style: {
        stroke: sourceComplete ? "var(--foreground)" : "var(--border)",
        strokeWidth: 1,
        opacity: sourceComplete ? 0.4 : 0.2,
      },
    };
  });
}

const nodeTypes: NodeTypes = {
  pipeline: PipelineNode as NodeTypes["pipeline"],
};

interface PipelineCanvasProps {
  projectId: string;
  onNodeSelect?: (nodeId: string | null) => void;
}

export function PipelineCanvas({ projectId, onNodeSelect }: PipelineCanvasProps) {
  const pipeline = usePipelineStore(
    (s) => s.projects.find((p) => p.id === projectId)?.pipeline
  );

  const statuses: Record<AgentName, AgentNodeStatus> = useMemo(() => {
    if (!pipeline) {
      return NODE_DEFS.reduce(
        (acc, d) => ({ ...acc, [d.key]: "waiting" as const }),
        {} as Record<AgentName, AgentNodeStatus>
      );
    }
    return {
      topicClarifier: pipeline.topicClarifier.status,
      nicheResearcher: pipeline.nicheResearcher.status,
      videoSuggester: pipeline.videoSuggester.status,
      ideaRefiner: pipeline.ideaRefiner.status,
      scriptWriter: pipeline.scriptWriter.status,
      timelineBuilder: pipeline.timelineBuilder.status,
    };
  }, [pipeline]);

  const nodesData = useMemo(() => buildNodes(statuses), [statuses]);
  const edgesData = useMemo(() => buildEdges(statuses), [statuses]);

  const [nodes, setNodes, onNodesChange] = useNodesState(nodesData);
  const [edges, setEdges, onEdgesChange] = useEdgesState(edgesData);

  useEffect(() => {
    setNodes(nodesData);
    setEdges(edgesData);
  }, [nodesData, edgesData, setNodes, setEdges]);

  const onSelectionChange: OnSelectionChangeFunc = useCallback(
    ({ nodes: sel }) => {
      onNodeSelect?.(sel.length > 0 ? sel[0].id : null);
    },
    [onNodeSelect]
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.4}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: "smoothstep" }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={0.5} color="var(--border)" />
        <MiniMap
          nodeColor={(n) => {
            const d = n.data as PipelineNodeData;
            return d.color;
          }}
          maskColor="rgba(0,0,0,0.3)"
          className="!bg-card/80 !border-border/40 !rounded-md"
          style={{ height: 60, width: 100 }}
        />
        <Controls
          showInteractive={false}
          className="!bg-card/80 !border-border/40 !rounded-md !shadow-none [&>button]:!h-6 [&>button]:!w-6 [&>button]:!border-border/30 [&>button]:!bg-transparent [&>button]:!text-muted-foreground [&>button:hover]:!bg-accent"
        />
      </ReactFlow>
    </div>
  );
}
