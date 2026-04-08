"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Project {
  id: string;
  title: string;
  status: "in_progress" | "complete" | "draft";
}

interface LeftPanelProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
}

function StatusDot({ status }: { status: Project["status"] }) {
  const color = {
    in_progress: "bg-yellow-500",
    complete: "bg-green-500",
    draft: "bg-muted-foreground/50",
  }[status];

  return <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${color}`} />;
}

export function LeftPanel({
  projects,
  activeProjectId,
  onSelectProject,
  onNewProject,
}: LeftPanelProps) {
  return (
    <aside className="flex h-full w-[200px] flex-col border-r border-border/60 bg-card/50">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Projects
        </span>
        <button
          onClick={onNewProject}
          className="rounded px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          + New
        </button>
      </div>

      <Separator className="opacity-50" />

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-px p-1">
          {projects.length === 0 && (
            <div className="px-2.5 py-6 text-center">
              <p className="text-[11px] leading-relaxed text-muted-foreground/70">
                No projects yet.
              </p>
              <button
                onClick={onNewProject}
                className="mt-2 text-[11px] font-medium text-foreground/80 transition-colors hover:text-foreground"
              >
                Create your first project
              </button>
            </div>
          )}
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className={`flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-[11px] transition-colors ${
                activeProjectId === project.id
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <StatusDot status={project.status} />
              <span className="truncate">{project.title}</span>
            </button>
          ))}
        </div>
      </ScrollArea>

      <Separator className="opacity-50" />
      <div className="px-3 py-2">
        <p className="text-[10px] text-muted-foreground/50">Creator Tool v0.1</p>
      </div>
    </aside>
  );
}
