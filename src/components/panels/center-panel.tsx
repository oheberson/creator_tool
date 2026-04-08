"use client";

import type { ReactNode } from "react";

export type CenterView = "canvas" | "timeline" | "editing-room";

interface CenterPanelProps {
  activeView: CenterView;
  onViewChange: (view: CenterView) => void;
  children?: ReactNode;
}

const VIEW_LABELS: Record<CenterView, string> = {
  canvas: "Canvas",
  timeline: "Timeline",
  "editing-room": "Editing Room",
};

export function CenterPanel({ activeView, onViewChange, children }: CenterPanelProps) {
  return (
    <div className="flex h-full flex-1 flex-col bg-background">
      <div className="flex items-center gap-1 border-b border-border/60 px-3 py-1.5">
        {(Object.keys(VIEW_LABELS) as CenterView[]).map((view) => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
              activeView === view
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground/70 hover:text-muted-foreground"
            }`}
          >
            {VIEW_LABELS[view]}
          </button>
        ))}
      </div>

      <div className="relative flex-1 overflow-hidden">
        {children ?? <EmptyCanvasPlaceholder />}
      </div>
    </div>
  );
}

function EmptyCanvasPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-border/60">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/50">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
          </svg>
        </div>
        <p className="text-[11px] text-muted-foreground/60">
          Create a project to start the pipeline
        </p>
      </div>
    </div>
  );
}
