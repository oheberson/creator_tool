import { create } from "zustand";
import type {
  PipelineState,
  AgentName,
  AgentNodeStatus,
  ClarifierMessage,
} from "@/lib/agents/types";
import { createInitialPipelineState } from "@/lib/agents/types";
import { runTopicClarifier } from "@/lib/agents/topic-clarifier";
import { runNicheResearcher } from "@/lib/agents/niche-researcher";
import { runVideoSuggester } from "@/lib/agents/video-suggester";
import { runIdeaRefiner } from "@/lib/agents/idea-refiner";
import { runScriptWriter } from "@/lib/agents/script-writer";
import { runTimelineBuilder } from "@/lib/agents/timeline-builder";
import { runImpactAnalyzer } from "@/lib/agents/impact-analyzer";

interface WorkspaceProject {
  id: string;
  title: string;
  status: "draft" | "in_progress" | "complete";
  pipeline: PipelineState;
}

interface PipelineStore {
  projects: WorkspaceProject[];
  activeProjectId: string | null;
  selectedNodeId: AgentName | null;

  createProject: () => string;
  setActiveProject: (id: string) => void;
  setSelectedNode: (id: AgentName | null) => void;

  startTopicClarifier: (rawIdea: string) => Promise<void>;
  runRemainingPipeline: () => Promise<void>;

  getActiveProject: () => WorkspaceProject | null;
  getNodeStatus: (agent: AgentName) => AgentNodeStatus;
  getClarifierConversation: () => ClarifierMessage[];
}

function updateProject(
  projects: WorkspaceProject[],
  id: string,
  updater: (p: WorkspaceProject) => Partial<WorkspaceProject>
): WorkspaceProject[] {
  return projects.map((p) => (p.id === id ? { ...p, ...updater(p) } : p));
}

export const usePipelineStore = create<PipelineStore>((set, get) => ({
  projects: [],
  activeProjectId: null,
  selectedNodeId: null,

  createProject: () => {
    const id = crypto.randomUUID();
    const project: WorkspaceProject = {
      id,
      title: "Untitled Project",
      status: "draft",
      pipeline: createInitialPipelineState(id),
    };
    set((s) => ({
      projects: [project, ...s.projects],
      activeProjectId: id,
      selectedNodeId: "topicClarifier",
    }));
    return id;
  },

  setActiveProject: (id) => set({ activeProjectId: id, selectedNodeId: null }),
  setSelectedNode: (id) => set({ selectedNodeId: id }),

  getActiveProject: () => {
    const { projects, activeProjectId } = get();
    return projects.find((p) => p.id === activeProjectId) ?? null;
  },

  getNodeStatus: (agent) => {
    const project = get().getActiveProject();
    if (!project) return "waiting";
    return project.pipeline[agent].status;
  },

  getClarifierConversation: () => {
    const project = get().getActiveProject();
    if (!project) return [];
    return project.pipeline.topicClarifier.output?.conversation ?? [];
  },

  startTopicClarifier: async (rawIdea: string) => {
    const { activeProjectId } = get();
    if (!activeProjectId) return;

    set((s) => ({
      projects: updateProject(s.projects, activeProjectId, (p) => ({
        title: rawIdea.slice(0, 40) || "Untitled Project",
        status: "in_progress",
        pipeline: {
          ...p.pipeline,
          topicClarifier: {
            ...p.pipeline.topicClarifier,
            status: "running" as const,
            input: { rawIdea },
          },
        },
      })),
    }));

    try {
      const output = await runTopicClarifier({ rawIdea });

      set((s) => ({
        projects: updateProject(s.projects, activeProjectId, (p) => ({
          pipeline: {
            ...p.pipeline,
            topicClarifier: {
              ...p.pipeline.topicClarifier,
              status: "complete" as const,
              output,
            },
          },
        })),
      }));
    } catch (e) {
      set((s) => ({
        projects: updateProject(s.projects, activeProjectId, (p) => ({
          pipeline: {
            ...p.pipeline,
            topicClarifier: {
              ...p.pipeline.topicClarifier,
              status: "error" as const,
              error: e instanceof Error ? e.message : "Unknown error",
            },
          },
        })),
      }));
    }
  },

  runRemainingPipeline: async () => {
    const { activeProjectId } = get();
    if (!activeProjectId) return;

    const project = get().getActiveProject();
    if (!project || project.pipeline.topicClarifier.status !== "complete") return;

    const niche = project.pipeline.topicClarifier.output?.nicheDefinition;
    if (!niche) return;

    const setAgent = (agent: AgentName, status: AgentNodeStatus, extra?: Record<string, unknown>) => {
      set((s) => ({
        projects: updateProject(s.projects, activeProjectId, (p) => ({
          pipeline: {
            ...p.pipeline,
            [agent]: { ...p.pipeline[agent], status, ...extra },
          },
        })),
      }));
    };

    // Niche Researcher
    setAgent("nicheResearcher", "running");
    try {
      const researchOut = await runNicheResearcher({ nicheDefinition: niche });
      setAgent("nicheResearcher", "complete", { input: { nicheDefinition: niche }, output: researchOut });

      // Video Suggester
      setAgent("videoSuggester", "running");
      const suggestOut = await runVideoSuggester({ report: researchOut.report });
      setAgent("videoSuggester", "complete", { input: { report: researchOut.report }, output: suggestOut });

      // Idea Refiner
      setAgent("ideaRefiner", "running");
      const refineOut = await runIdeaRefiner({
        references: suggestOut.references,
        userPreferenceSignals: suggestOut.userPreferenceSignals,
        userFreeformInput: "the hidden patterns in this space",
      });
      setAgent("ideaRefiner", "complete", {
        input: {
          references: suggestOut.references,
          userPreferenceSignals: suggestOut.userPreferenceSignals,
          userFreeformInput: "the hidden patterns in this space",
        },
        output: refineOut,
      });

      // Script Writer
      setAgent("scriptWriter", "running");
      const scriptOut = await runScriptWriter({ idea: refineOut.idea, report: researchOut.report });
      setAgent("scriptWriter", "complete", {
        input: { idea: refineOut.idea, report: researchOut.report },
        output: scriptOut,
      });

      // Timeline Builder
      setAgent("timelineBuilder", "running");
      const timelineOut = await runTimelineBuilder({ script: scriptOut.script });
      setAgent("timelineBuilder", "complete", {
        input: { script: scriptOut.script },
        output: timelineOut,
      });

      // Impact Analyzer
      const impactFeedback = await runImpactAnalyzer({
        timeline: timelineOut.timeline,
        script: scriptOut.script,
        nicheDefinition: niche,
      });

      set((s) => ({
        projects: updateProject(s.projects, activeProjectId, (p) => ({
          status: "complete",
          pipeline: { ...p.pipeline, impactFeedback },
        })),
      }));
    } catch (e) {
      console.error("Pipeline error:", e);
    }
  },
}));
