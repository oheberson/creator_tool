import { describe, it, expect } from "vitest";
import { runIdeaRefiner } from "../idea-refiner";
import type { VideoReference } from "../types";

const sampleReferences: VideoReference[] = [
  {
    videoId: "ref_001",
    title: "Sample Reference Video",
    channelName: "Sample Channel",
    viewCount: 100_000,
    publishedAt: "2026-01-01T00:00:00Z",
    thumbnailUrl: "https://example.com/thumb.jpg",
    relevanceTag: "trending",
    aiAnalysis: "Good engagement pattern",
  },
];

describe("IdeaRefiner", () => {
  it("should produce a video idea with all required fields", async () => {
    const result = await runIdeaRefiner({
      references: sampleReferences,
      userPreferenceSignals: ["prefers data-driven"],
      userFreeformInput: "the evolution of indie games",
    });

    expect(result.idea.workingTitle).toContain("the evolution of indie games");
    expect(result.idea.uniqueAngle).toBeTruthy();
    expect(result.idea.targetAudience).toBeTruthy();
    expect(["low", "medium", "high"]).toContain(result.idea.estimatedAppeal);
  });

  it("should return existing content on the topic", async () => {
    const result = await runIdeaRefiner({
      references: sampleReferences,
      userPreferenceSignals: [],
      userFreeformInput: "AI in creative tools",
    });

    expect(result.existingContentOnTopic.length).toBeGreaterThan(0);
    expect(result.existingContentOnTopic[0].title).toContain("AI in creative tools");
  });
});
