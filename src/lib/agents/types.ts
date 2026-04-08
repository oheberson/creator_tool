/**
 * Core types for the Creator Tool agent pipeline.
 *
 * The pipeline flows:
 *   TopicClarifier -> NicheResearcher -> VideoSuggester
 *   -> IdeaRefiner -> ScriptWriter -> TimelineBuilder
 *
 * Each agent produces a typed output that becomes input for the next.
 * The full pipeline state (`PipelineState`) carries everything and is
 * checkpointed by LangGraph after each agent completes.
 */

// ---------------------------------------------------------------------------
// Agent 1: Topic Clarifier
// ---------------------------------------------------------------------------

export interface NicheDefinition {
  category: string;
  subCategory: string;
  audienceProfile: string;
  contentTone: string;
  competitiveLandscapeSummary: string;
  keywords: string[];
}

export interface ClarifierMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TopicClarifierInput {
  rawIdea: string;
}

export interface TopicClarifierOutput {
  conversation: ClarifierMessage[];
  nicheDefinition: NicheDefinition | null;
  isComplete: boolean;
}

// ---------------------------------------------------------------------------
// Agent 2: Niche Researcher
// ---------------------------------------------------------------------------

export interface ChannelProfile {
  channelId: string;
  name: string;
  subscriberCount: number;
  averageViews: number;
  topVideoIds: string[];
}

export interface NicheResearchReport {
  nicheKey: string;
  topChannels: ChannelProfile[];
  videoPerformanceBenchmarks: {
    averageViews: number;
    averageLikes: number;
    averageDuration: number;
  };
  audienceDemographics: string;
  contentGaps: string[];
  trendingSubTopics: string[];
  cachedAt: string | null;
}

export interface NicheResearcherInput {
  nicheDefinition: NicheDefinition;
}

export interface NicheResearcherOutput {
  report: NicheResearchReport;
  fromCache: boolean;
}

// ---------------------------------------------------------------------------
// Agent 3: Video Suggester
// ---------------------------------------------------------------------------

export interface VideoReference {
  videoId: string;
  title: string;
  channelName: string;
  viewCount: number;
  publishedAt: string;
  thumbnailUrl: string;
  relevanceTag: "trending" | "top_performer" | "hidden_gem";
  aiAnalysis: string;
}

export interface VideoSuggesterInput {
  report: NicheResearchReport;
}

export interface VideoSuggesterOutput {
  references: VideoReference[];
  userPreferenceSignals: string[];
}

// ---------------------------------------------------------------------------
// Agent 4: Idea Refiner
// ---------------------------------------------------------------------------

export interface VideoIdea {
  workingTitle: string;
  uniqueAngle: string;
  targetAudience: string;
  differentiationFromExisting: string;
  estimatedAppeal: "low" | "medium" | "high";
  competitorVideoIds: string[];
}

export interface IdeaRefinerInput {
  references: VideoReference[];
  userPreferenceSignals: string[];
  userFreeformInput: string;
}

export interface IdeaRefinerOutput {
  idea: VideoIdea;
  existingContentOnTopic: VideoReference[];
}

// ---------------------------------------------------------------------------
// Agent 5: Script Writer
// ---------------------------------------------------------------------------

export interface ScriptSection {
  id: string;
  type: "hook" | "intro" | "body" | "climax" | "cta" | "outro";
  title: string;
  content: string;
  estimatedDurationSec: number;
  storytellingAnnotation: string;
}

export interface VideoFormatSuggestion {
  cameraTakes: string;
  voiceTone: string;
  storytellingStyle: string;
  pacingNotes: string;
}

export interface ScriptDraft {
  sections: ScriptSection[];
  totalEstimatedDurationSec: number;
  formatSuggestion: VideoFormatSuggestion;
}

export interface ScriptWriterInput {
  idea: VideoIdea;
  report: NicheResearchReport;
}

export interface ScriptWriterOutput {
  script: ScriptDraft;
}

// ---------------------------------------------------------------------------
// Agent 6: Timeline Builder
// ---------------------------------------------------------------------------

export interface TimelineSegment {
  id: string;
  scriptSectionId: string;
  label: string;
  startSec: number;
  endSec: number;
  mediaPlaceholder: "voice_over" | "b_roll" | "camera" | "screen_recording" | "stock" | "empty";
  transitionIn: string | null;
  transitionOut: string | null;
}

export interface TimelineDefinition {
  segments: TimelineSegment[];
  totalDurationSec: number;
  audioCueMarkers: { timeSec: number; label: string }[];
}

export interface TimelineBuilderInput {
  script: ScriptDraft;
}

export interface TimelineBuilderOutput {
  timeline: TimelineDefinition;
}

// ---------------------------------------------------------------------------
// Impact Feedback Engine (passive, runs alongside Timeline + Editing Room)
// ---------------------------------------------------------------------------

export interface ImpactFeedback {
  retentionCurveEstimate: { timeSec: number; retentionPct: number }[];
  storytellingCoherenceScore: number;
  pacingAnalysis: string;
  engagementProjection: string;
  warnings: string[];
  suggestions: string[];
}

export interface ImpactFeedbackInput {
  timeline: TimelineDefinition;
  script: ScriptDraft;
  nicheDefinition: NicheDefinition;
}

// ---------------------------------------------------------------------------
// Full Pipeline State (checkpointed by LangGraph)
// ---------------------------------------------------------------------------

export type AgentNodeStatus = "waiting" | "running" | "complete" | "error";

export interface AgentNodeState {
  status: AgentNodeStatus;
  error?: string;
}

export interface PipelineState {
  projectId: string;

  topicClarifier: AgentNodeState & {
    input: TopicClarifierInput | null;
    output: TopicClarifierOutput | null;
  };

  nicheResearcher: AgentNodeState & {
    input: NicheResearcherInput | null;
    output: NicheResearcherOutput | null;
  };

  videoSuggester: AgentNodeState & {
    input: VideoSuggesterInput | null;
    output: VideoSuggesterOutput | null;
  };

  ideaRefiner: AgentNodeState & {
    input: IdeaRefinerInput | null;
    output: IdeaRefinerOutput | null;
  };

  scriptWriter: AgentNodeState & {
    input: ScriptWriterInput | null;
    output: ScriptWriterOutput | null;
  };

  timelineBuilder: AgentNodeState & {
    input: TimelineBuilderInput | null;
    output: TimelineBuilderOutput | null;
  };

  impactFeedback: ImpactFeedback | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export type AgentName =
  | "topicClarifier"
  | "nicheResearcher"
  | "videoSuggester"
  | "ideaRefiner"
  | "scriptWriter"
  | "timelineBuilder";

export function createInitialPipelineState(projectId: string): PipelineState {
  const emptyNode = <I, O>(): AgentNodeState & { input: I | null; output: O | null } => ({
    status: "waiting",
    input: null,
    output: null,
  });

  return {
    projectId,
    topicClarifier: { ...emptyNode<TopicClarifierInput, TopicClarifierOutput>(), status: "waiting" },
    nicheResearcher: emptyNode<NicheResearcherInput, NicheResearcherOutput>(),
    videoSuggester: emptyNode<VideoSuggesterInput, VideoSuggesterOutput>(),
    ideaRefiner: emptyNode<IdeaRefinerInput, IdeaRefinerOutput>(),
    scriptWriter: emptyNode<ScriptWriterInput, ScriptWriterOutput>(),
    timelineBuilder: emptyNode<TimelineBuilderInput, TimelineBuilderOutput>(),
    impactFeedback: null,
  };
}
