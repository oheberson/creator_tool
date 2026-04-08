"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { ReactNode } from "react";

interface RightPanelProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
}

export function RightPanel({ title = "Inspector", subtitle, children }: RightPanelProps) {
  return (
    <aside className="flex h-full w-[280px] flex-col border-l border-border/60 bg-card/50">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
        {subtitle && (
          <span className="text-[10px] text-muted-foreground/50">{subtitle}</span>
        )}
      </div>

      <Separator className="opacity-50" />

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3 p-3">
          {children ?? <DefaultInspectorContent />}
        </div>
      </ScrollArea>
    </aside>
  );
}

function DefaultInspectorContent() {
  return (
    <>
      <InspectorSection label="Overview">
        <p className="text-[11px] leading-relaxed text-muted-foreground/70">
          Select a node on the canvas to inspect its configuration, or create
          a new project to begin.
        </p>
      </InspectorSection>

      <InspectorSection label="Agent Pipeline">
        <ul className="space-y-1">
          {[
            { color: "bg-blue-400", label: "Topic Clarifier" },
            { color: "bg-violet-400", label: "Niche Researcher" },
            { color: "bg-cyan-400", label: "Video Suggester" },
            { color: "bg-amber-400", label: "Idea Refiner" },
            { color: "bg-green-400", label: "Script Writer" },
            { color: "bg-rose-400", label: "Timeline Builder" },
          ].map((item) => (
            <li key={item.label} className="flex items-center gap-1.5">
              <span className={`inline-block h-1 w-1 rounded-full ${item.color}`} />
              <span className="text-[10px] text-muted-foreground/60">{item.label}</span>
            </li>
          ))}
        </ul>
      </InspectorSection>
    </>
  );
}

function InspectorSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
        {label}
      </h3>
      <div className="rounded border border-border/40 bg-background/50 p-2">
        {children}
      </div>
    </div>
  );
}
