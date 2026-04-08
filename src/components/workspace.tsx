"use client";

import { useCallback, useMemo, useState } from "react";
import { LeftPanel } from "@/components/panels/left-panel";
import { CenterPanel, type CenterView } from "@/components/panels/center-panel";
import { RightPanel } from "@/components/panels/right-panel";
import { PipelineCanvas } from "@/components/canvas/pipeline-canvas";
import { ClarifierChat } from "@/components/panels/clarifier-chat";
import { usePipelineStore } from "@/lib/store/pipeline-store";

export function Workspace() {
  const [activeView, setActiveView] = useState<CenterView>("canvas");

  const projects = usePipelineStore((s) => s.projects);
  const activeProjectId = usePipelineStore((s) => s.activeProjectId);
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);
  const createProject = usePipelineStore((s) => s.createProject);
  const setActiveProject = usePipelineStore((s) => s.setActiveProject);
  const setSelectedNode = usePipelineStore((s) => s.setSelectedNode);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId]
  );

  const leftPanelProjects = useMemo(
    () => projects.map((p) => ({ id: p.id, title: p.title, status: p.status })),
    [projects]
  );

  const handleNewProject = useCallback(() => {
    createProject();
    setActiveView("canvas");
  }, [createProject]);

  const handleNodeSelect = useCallback(
    (nodeId: string | null) => {
      setSelectedNode(nodeId as Parameters<typeof setSelectedNode>[0]);
    },
    [setSelectedNode]
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <LeftPanel
        projects={leftPanelProjects}
        activeProjectId={activeProjectId}
        onSelectProject={setActiveProject}
        onNewProject={handleNewProject}
      />
      <CenterPanel activeView={activeView} onViewChange={setActiveView}>
        {activeProject && activeView === "canvas" ? (
          <PipelineCanvas
            projectId={activeProject.id}
            onNodeSelect={handleNodeSelect}
          />
        ) : null}
      </CenterPanel>
      <RightPanel subtitle={activeProject?.title}>
        {activeProject && selectedNodeId === "topicClarifier" ? (
          <ClarifierChat />
        ) : undefined}
      </RightPanel>
    </div>
  );
}
