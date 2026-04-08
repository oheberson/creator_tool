import type {
  VideoSuggesterInput,
  VideoSuggesterOutput,
  VideoReference,
} from "./types";

/**
 * Stub implementation of the Video Suggester agent.
 *
 * In production this will query YouTube Data API for trending and top-performing
 * videos in the niche, then use the LLM to generate per-video relevance analysis.
 */
export async function runVideoSuggester(
  input: VideoSuggesterInput
): Promise<VideoSuggesterOutput> {
  const { report } = input;

  const references: VideoReference[] = [
    {
      videoId: "yt_trend_001",
      title: `Why ${report.nicheKey.split("::")[0]} is Exploding Right Now`,
      channelName: report.topChannels[0]?.name ?? "Unknown Channel",
      viewCount: 340_000,
      publishedAt: "2026-03-20T10:00:00Z",
      thumbnailUrl: "https://img.youtube.com/vi/mock/hqdefault.jpg",
      relevanceTag: "trending",
      aiAnalysis:
        "Strong hook in first 5 seconds, data-driven narrative, high engagement in comments suggesting audience wants more depth.",
    },
    {
      videoId: "yt_top_001",
      title: `The Complete ${report.nicheKey.split("::")[1]} Guide`,
      channelName: report.topChannels[1]?.name ?? "Unknown Channel",
      viewCount: 1_200_000,
      publishedAt: "2025-11-15T14:00:00Z",
      thumbnailUrl: "https://img.youtube.com/vi/mock2/hqdefault.jpg",
      relevanceTag: "top_performer",
      aiAnalysis:
        "Comprehensive format that keeps retention high through chapter markers and visual variety. 22-min runtime, above niche average.",
    },
    {
      videoId: "yt_gem_001",
      title: "What Nobody Tells You About This Space",
      channelName: "Deep Dive Weekly",
      viewCount: 45_000,
      publishedAt: "2026-02-28T08:30:00Z",
      thumbnailUrl: "https://img.youtube.com/vi/mock3/hqdefault.jpg",
      relevanceTag: "hidden_gem",
      aiAnalysis:
        "Small channel but 8% like ratio (vs. 4% niche avg). Unique contrarian angle that sparks discussion. Good model for differentiation.",
    },
  ];

  return {
    references,
    userPreferenceSignals: [
      "prefers data-driven content",
      "interested in long-form",
      "values unique angles",
    ],
  };
}
