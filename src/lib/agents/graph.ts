import { Annotation, StateGraph, MemorySaver, END } from "@langchain/langgraph";
import type {
  PipelineState,
  TopicClarifierOutput,
  NicheResearcherOutput,
  VideoSuggesterOutput,
  IdeaRefinerOutput,
  ScriptWriterOutput,
  TimelineBuilderOutput,
  ImpactFeedback,
  AgentNodeState,
} from "./types";
import { createInitialPipelineState } from "./types";
import { runTopicClarifierStub } from "./topic-clarifier.stub";
import { runNicheResearcher } from "./niche-researcher";
import { runVideoSuggester } from "./video-suggester";
import { runIdeaRefiner } from "./idea-refiner";
import { runScriptWriter } from "./script-writer";
import { runTimelineBuilder } from "./timeline-builder";
import { runImpactAnalyzer } from "./impact-analyzer";

// ---------------------------------------------------------------------------
// LangGraph State Annotation
// ---------------------------------------------------------------------------

function nodeReducer<T extends AgentNodeState & { input: unknown; output: unknown }>(
  current: T,
  update: Partial<T>
): T {
  return { ...current, ...update };
}

const PipelineAnnotation = Annotation.Root({
  projectId: Annotation<string>,

  topicClarifier: Annotation<
    PipelineState["topicClarifier"]
  >({
    reducer: nodeReducer,
    default: () => createInitialPipelineState("").topicClarifier,
  }),

  nicheResearcher: Annotation<
    PipelineState["nicheResearcher"]
  >({
    reducer: nodeReducer,
    default: () => createInitialPipelineState("").nicheResearcher,
  }),

  videoSuggester: Annotation<
    PipelineState["videoSuggester"]
  >({
    reducer: nodeReducer,
    default: () => createInitialPipelineState("").videoSuggester,
  }),

  ideaRefiner: Annotation<
    PipelineState["ideaRefiner"]
  >({
    reducer: nodeReducer,
    default: () => createInitialPipelineState("").ideaRefiner,
  }),

  scriptWriter: Annotation<
    PipelineState["scriptWriter"]
  >({
    reducer: nodeReducer,
    default: () => createInitialPipelineState("").scriptWriter,
  }),

  timelineBuilder: Annotation<
    PipelineState["timelineBuilder"]
  >({
    reducer: nodeReducer,
    default: () => createInitialPipelineState("").timelineBuilder,
  }),

  impactFeedback: Annotation<ImpactFeedback | null>({
    reducer: (_current, update) => update,
    default: () => null,
  }),
});

type GraphState = typeof PipelineAnnotation.State;

// ---------------------------------------------------------------------------
// Node functions
// ---------------------------------------------------------------------------

async function topicClarifierNode(state: GraphState): Promise<Partial<GraphState>> {
  const input = state.topicClarifier.input;
  if (!input) {
    return {
      topicClarifier: { ...state.topicClarifier, status: "error", error: "No input provided" },
    };
  }

  let output: TopicClarifierOutput;
  try {
    output = await runTopicClarifierStub(input);
  } catch (e) {
    return {
      topicClarifier: {
        ...state.topicClarifier,
        status: "error",
        error: e instanceof Error ? e.message : "Unknown error",
      },
    };
  }

  return {
    topicClarifier: { ...state.topicClarifier, status: "complete", output },
  };
}

async function nicheResearcherNode(state: GraphState): Promise<Partial<GraphState>> {
  const niche = state.topicClarifier.output?.nicheDefinition;
  if (!niche) {
    return {
      nicheResearcher: { ...state.nicheResearcher, status: "error", error: "No niche definition from clarifier" },
    };
  }

  let output: NicheResearcherOutput;
  try {
    output = await runNicheResearcher({ nicheDefinition: niche });
  } catch (e) {
    return {
      nicheResearcher: {
        ...state.nicheResearcher,
        status: "error",
        error: e instanceof Error ? e.message : "Unknown error",
      },
    };
  }

  return {
    nicheResearcher: {
      ...state.nicheResearcher,
      status: "complete",
      input: { nicheDefinition: niche },
      output,
    },
  };
}

async function videoSuggesterNode(state: GraphState): Promise<Partial<GraphState>> {
  const report = state.nicheResearcher.output?.report;
  if (!report) {
    return {
      videoSuggester: { ...state.videoSuggester, status: "error", error: "No research report" },
    };
  }

  let output: VideoSuggesterOutput;
  try {
    output = await runVideoSuggester({ report });
  } catch (e) {
    return {
      videoSuggester: {
        ...state.videoSuggester,
        status: "error",
        error: e instanceof Error ? e.message : "Unknown error",
      },
    };
  }

  return {
    videoSuggester: {
      ...state.videoSuggester,
      status: "complete",
      input: { report },
      output,
    },
  };
}

async function ideaRefinerNode(state: GraphState): Promise<Partial<GraphState>> {
  const suggestOutput = state.videoSuggester.output;
  if (!suggestOutput) {
    return {
      ideaRefiner: { ...state.ideaRefiner, status: "error", error: "No video suggestions" },
    };
  }

  let output: IdeaRefinerOutput;
  try {
    output = await runIdeaRefiner({
      references: suggestOutput.references,
      userPreferenceSignals: suggestOutput.userPreferenceSignals,
      userFreeformInput: "the hidden patterns in this space",
    });
  } catch (e) {
    return {
      ideaRefiner: {
        ...state.ideaRefiner,
        status: "error",
        error: e instanceof Error ? e.message : "Unknown error",
      },
    };
  }

  return {
    ideaRefiner: {
      ...state.ideaRefiner,
      status: "complete",
      input: {
        references: suggestOutput.references,
        userPreferenceSignals: suggestOutput.userPreferenceSignals,
        userFreeformInput: "the hidden patterns in this space",
      },
      output,
    },
  };
}

async function scriptWriterNode(state: GraphState): Promise<Partial<GraphState>> {
  const idea = state.ideaRefiner.output?.idea;
  const report = state.nicheResearcher.output?.report;
  if (!idea || !report) {
    return {
      scriptWriter: { ...state.scriptWriter, status: "error", error: "Missing idea or report" },
    };
  }

  let output: ScriptWriterOutput;
  try {
    output = await runScriptWriter({ idea, report });
  } catch (e) {
    return {
      scriptWriter: {
        ...state.scriptWriter,
        status: "error",
        error: e instanceof Error ? e.message : "Unknown error",
      },
    };
  }

  return {
    scriptWriter: {
      ...state.scriptWriter,
      status: "complete",
      input: { idea, report },
      output,
    },
  };
}

async function timelineBuilderNode(state: GraphState): Promise<Partial<GraphState>> {
  const script = state.scriptWriter.output?.script;
  if (!script) {
    return {
      timelineBuilder: { ...state.timelineBuilder, status: "error", error: "No script draft" },
    };
  }

  let output: TimelineBuilderOutput;
  try {
    output = await runTimelineBuilder({ script });
  } catch (e) {
    return {
      timelineBuilder: {
        ...state.timelineBuilder,
        status: "error",
        error: e instanceof Error ? e.message : "Unknown error",
      },
    };
  }

  return {
    timelineBuilder: {
      ...state.timelineBuilder,
      status: "complete",
      input: { script },
      output,
    },
  };
}

async function impactAnalyzerNode(state: GraphState): Promise<Partial<GraphState>> {
  const timeline = state.timelineBuilder.output?.timeline;
  const script = state.scriptWriter.output?.script;
  const niche = state.topicClarifier.output?.nicheDefinition;

  if (!timeline || !script || !niche) {
    return { impactFeedback: null };
  }

  let feedback: ImpactFeedback;
  try {
    feedback = await runImpactAnalyzer({ timeline, script, nicheDefinition: niche });
  } catch {
    return { impactFeedback: null };
  }

  return { impactFeedback: feedback };
}

// ---------------------------------------------------------------------------
// Graph construction
// ---------------------------------------------------------------------------

export function buildPipelineGraph() {
  const checkpointer = new MemorySaver();

  const graph = new StateGraph(PipelineAnnotation)
    .addNode("clarify", topicClarifierNode)
    .addNode("research", nicheResearcherNode)
    .addNode("suggest", videoSuggesterNode)
    .addNode("refine", ideaRefinerNode)
    .addNode("script", scriptWriterNode)
    .addNode("timeline", timelineBuilderNode)
    .addNode("impact", impactAnalyzerNode)
    .addEdge("__start__", "clarify")
    .addEdge("clarify", "research")
    .addEdge("research", "suggest")
    .addEdge("suggest", "refine")
    .addEdge("refine", "script")
    .addEdge("script", "timeline")
    .addEdge("timeline", "impact")
    .addEdge("impact", END);

  return graph.compile({ checkpointer });
}
