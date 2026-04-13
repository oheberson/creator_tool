import type {
  TopicClarifierInput,
  TopicClarifierOutput,
  NicheDefinition,
  ClarifierMessage,
} from "./types";

/**
 * Deterministic stub for LangGraph integration tests and offline use.
 * Production UI uses the OpenAI-backed API routes instead.
 */
export async function runTopicClarifierStub(
  input: TopicClarifierInput
): Promise<TopicClarifierOutput> {
  const conversation: ClarifierMessage[] = [
    { role: "user", content: input.rawIdea },
    {
      role: "assistant",
      content: `Interesting! You mentioned "${input.rawIdea}". Let me help narrow this down. What specific angle interests you most?`,
    },
    { role: "user", content: "I want to focus on analysis and breakdowns" },
    {
      role: "assistant",
      content:
        "Got it — analytical breakdowns. Are you thinking about a specific league, event, or topic within this space?",
    },
    { role: "user", content: "Yes, the most popular trends right now" },
    {
      role: "assistant",
      content:
        "Perfect. I've locked in your niche definition. Let me pass this to the research phase.",
    },
  ];

  const nicheDefinition: NicheDefinition = {
    category: input.rawIdea,
    subCategory: "analytical breakdowns",
    audienceProfile: "18-35 year olds interested in in-depth content analysis",
    contentTone: "informative, engaging, data-driven",
    competitiveLandscapeSummary:
      "Moderately competitive niche with growing demand for well-researched content. Top creators average 50k-200k views.",
    keywords: [input.rawIdea, "breakdown", "analysis", "trends", "deep dive"],
  };

  return {
    conversation,
    nicheDefinition,
    isComplete: true,
  };
}
