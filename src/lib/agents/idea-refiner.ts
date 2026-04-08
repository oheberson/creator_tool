import type {
  IdeaRefinerInput,
  IdeaRefinerOutput,
  VideoIdea,
  VideoReference,
} from "./types";

/**
 * Stub implementation of the Idea Refiner agent.
 *
 * In production this will take the user's free-form topic input, search for
 * existing content on that exact topic via YouTube API, and use the LLM to
 * help the user crystallize a unique angle and working title.
 */
export async function runIdeaRefiner(
  input: IdeaRefinerInput
): Promise<IdeaRefinerOutput> {
  const idea: VideoIdea = {
    workingTitle: `The Untold Story: ${input.userFreeformInput}`,
    uniqueAngle:
      "Combining data analysis with personal narrative — a format rarely seen in this niche",
    targetAudience:
      "Engaged viewers looking for substance over clickbait, ages 20-35",
    differentiationFromExisting:
      "Unlike existing content that focuses on surface-level coverage, this goes deep into the underlying patterns",
    estimatedAppeal: "high",
    competitorVideoIds: input.references.slice(0, 2).map((r) => r.videoId),
  };

  const existingContentOnTopic: VideoReference[] = [
    {
      videoId: "yt_existing_001",
      title: `Similar topic: ${input.userFreeformInput} explained`,
      channelName: "Competitor Channel",
      viewCount: 89_000,
      publishedAt: "2026-01-10T12:00:00Z",
      thumbnailUrl: "https://img.youtube.com/vi/mock4/hqdefault.jpg",
      relevanceTag: "top_performer",
      aiAnalysis:
        "Covers the topic broadly but lacks the data-driven depth your angle provides. Opportunity to differentiate.",
    },
  ];

  return {
    idea,
    existingContentOnTopic,
  };
}
