"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { AgentNodeStatus } from "@/lib/agents/types";

export interface PipelineNodeData {
  label: string;
  agentKey: string;
  status: AgentNodeStatus;
  color: string;
  description: string;
  [key: string]: unknown;
}

const STATUS_CONFIG: Record<AgentNodeStatus, { ring: string; bg: string; label: string }> = {
  waiting: { ring: "border-border/40", bg: "bg-muted/30", label: "Waiting" },
  running: { ring: "border-blue-500/60", bg: "bg-blue-500/10", label: "Running" },
  complete: { ring: "border-green-500/60", bg: "bg-green-500/10", label: "Done" },
  error: { ring: "border-red-500/60", bg: "bg-red-500/10", label: "Error" },
};

export function PipelineNode({ data, selected }: NodeProps & { data: PipelineNodeData }) {
  const cfg = STATUS_CONFIG[data.status];

  return (
    <div
      className={`
        group relative rounded-lg border ${cfg.ring} ${cfg.bg} px-3 py-2
        transition-all duration-150
        ${selected ? "ring-1 ring-foreground/20 shadow-sm" : ""}
        ${data.status === "waiting" ? "opacity-50" : "opacity-100"}
      `}
      style={{ minWidth: 140 }}
    >
      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-border" />

      <div className="flex items-center gap-1.5">
        <span
          className="inline-block h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: data.color }}
        />
        <span className="text-[11px] font-medium text-foreground/90">{data.label}</span>
      </div>

      <p className="mt-0.5 text-[9px] leading-tight text-muted-foreground/60">
        {data.description}
      </p>

      <div className="mt-1 flex items-center justify-between">
        <span className={`text-[9px] font-medium ${
          data.status === "complete" ? "text-green-400" :
          data.status === "running" ? "text-blue-400" :
          data.status === "error" ? "text-red-400" :
          "text-muted-foreground/40"
        }`}>
          {cfg.label}
        </span>
      </div>

      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-border" />
    </div>
  );
}
