import { create } from "zustand";
import type {
  PipelineState,
  AgentName,
  AgentNodeStatus,
  ClarifierMessage,
  NicheDefinition,
} from "@/lib/agents/types";
import { createInitialPipelineState } from "@/lib/agents/types";
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

  /** Append a user message and ensure Topic Clarifier output exists (in-progress conversation). */
  appendClarifierUserMessage: (text: string) => void;
  /** Append assistant reply after streaming completes. */
  appendClarifierAssistantMessage: (text: string) => void;
  setTopicClarifierRunning: (running: boolean) => void;
  setTopicClarifierError: (message: string | null) => void;

  /**
   * Calls OpenAI via POST /api/agents/topic-clarifier/finalize — human-in-the-loop "done".
   * Sets nicheDefinition, isComplete, and marks node complete for downstream agents.
   */
  finalizeTopicClarifier: () => Promise<void>;

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

  appendClarifierUserMessage: (text: string) => {
    const activeProjectId = get().activeProjectId;
    if (!activeProjectId) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    set((s) => ({
      projects: updateProject(s.projects, activeProjectId, (p) => {
        const prev = p.pipeline.topicClarifier.output?.conversation ?? [];
        const nextConv: ClarifierMessage[] = [
          ...prev,
          { role: "user", content: trimmed },
        ];
        const firstUser = nextConv.find((m) => m.role === "user");
        return {
          title:
            p.title === "Untitled Project" && firstUser
              ? firstUser.content.slice(0, 40) || p.title
              : p.title,
          status: "in_progress",
          pipeline: {
            ...p.pipeline,
            topicClarifier: {
              ...p.pipeline.topicClarifier,
              status: "waiting",
              error: undefined,
              input: firstUser ? { rawIdea: firstUser.content } : null,
              output: {
                conversation: nextConv,
                nicheDefinition: null,
                isComplete: false,
              },
            },
          },
        };
      }),
    }));
  },

  appendClarifierAssistantMessage: (text: string) => {
    const activeProjectId = get().activeProjectId;
    if (!activeProjectId) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    set((s) => ({
      projects: updateProject(s.projects, activeProjectId, (p) => {
        const prev = p.pipeline.topicClarifier.output?.conversation ?? [];
        return {
          pipeline: {
            ...p.pipeline,
            topicClarifier: {
              ...p.pipeline.topicClarifier,
              output: {
                conversation: [...prev, { role: "assistant", content: trimmed }],
                nicheDefinition: null,
                isComplete: false,
              },
            },
          },
        };
      }),
    }));
  },

  setTopicClarifierRunning: (running: boolean) => {
    const activeProjectId = get().activeProjectId;
    if (!activeProjectId) return;

    set((s) => ({
      projects: updateProject(s.projects, activeProjectId, (p) => ({
        pipeline: {
          ...p.pipeline,
          topicClarifier: {
            ...p.pipeline.topicClarifier,
            status: running ? "running" : "waiting",
          },
        },
      })),
    }));
  },

  setTopicClarifierError: (message: string | null) => {
    const activeProjectId = get().activeProjectId;
    if (!activeProjectId) return;

    set((s) => ({
      projects: updateProject(s.projects, activeProjectId, (p) => ({
        pipeline: {
          ...p.pipeline,
          topicClarifier: {
            ...p.pipeline.topicClarifier,
            status: message ? "error" : "waiting",
            error: message ?? undefined,
          },
        },
      })),
    }));
  },

  finalizeTopicClarifier: async () => {
    const activeProjectId = get().activeProjectId;
    if (!activeProjectId) return;

    const project = get().getActiveProject();
    const messages = project?.pipeline.topicClarifier.output?.conversation ?? [];
    if (messages.length < 2) return;

    set((s) => ({
      projects: updateProject(s.projects, activeProjectId, (p) => ({
        pipeline: {
          ...p.pipeline,
          topicClarifier: {
            ...p.pipeline.topicClarifier,
            status: "running",
            error: undefined,
          },
        },
      })),
    }));

    try {
      const res = await fetch("/api/agents/topic-clarifier/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      const data = (await res.json()) as {
        nicheDefinition?: NicheDefinition;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? `Finalize failed (${res.status})`);
      }

      if (!data.nicheDefinition) {
        throw new Error("No nicheDefinition in response");
      }

      const nicheDefinition = data.nicheDefinition;

      if (process.env.NODE_ENV === "development") {
        console.log(
          "[Creator Tool] Topic Clarifier output (NicheDefinition for next agent):\n",
          JSON.stringify(nicheDefinition, null, 2)
        );
      }

      set((s) => ({
        projects: updateProject(s.projects, activeProjectId, (p) => ({
          title: nicheDefinition.category.slice(0, 40) || p.title,
          pipeline: {
            ...p.pipeline,
            topicClarifier: {
              ...p.pipeline.topicClarifier,
              status: "complete",
              output: {
                conversation: messages,
                nicheDefinition,
                isComplete: true,
              },
            },
          },
        })),
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Finalize failed";
      set((s) => ({
        projects: updateProject(s.projects, activeProjectId, (p) => ({
          pipeline: {
            ...p.pipeline,
            topicClarifier: {
              ...p.pipeline.topicClarifier,
              status: "error",
              error: msg,
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

    setAgent("nicheResearcher", "running");
    try {
      const researchOut = await runNicheResearcher({ nicheDefinition: niche });
      setAgent("nicheResearcher", "complete", { input: { nicheDefinition: niche }, output: researchOut });

      setAgent("videoSuggester", "running");
      const suggestOut = await runVideoSuggester({ report: researchOut.report });
      setAgent("videoSuggester", "complete", { input: { report: researchOut.report }, output: suggestOut });

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

      setAgent("scriptWriter", "running");
      const scriptOut = await runScriptWriter({ idea: refineOut.idea, report: researchOut.report });
      setAgent("scriptWriter", "complete", {
        input: { idea: refineOut.idea, report: researchOut.report },
        output: scriptOut,
      });

      setAgent("timelineBuilder", "running");
      const timelineOut = await runTimelineBuilder({ script: scriptOut.script });
      setAgent("timelineBuilder", "complete", {
        input: { script: scriptOut.script },
        output: timelineOut,
      });

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
