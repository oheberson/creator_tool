import { describe, it, expect } from "vitest";
import { runVideoSuggester } from "../video-suggester";
import { runNicheResearcher } from "../niche-researcher";
import type { NicheDefinition } from "../types";

const sampleNiche: NicheDefinition = {
  category: "gaming",
  subCategory: "retro game analysis",
  audienceProfile: "25-40 nostalgia gamers",
  contentTone: "analytical, warm",
  competitiveLandscapeSummary: "Growing niche",
  keywords: ["retro", "gaming", "analysis"],
};

describe("VideoSuggester", () => {
  it("should return video references with all required fields", async () => {
    const { report } = await runNicheResearcher({ nicheDefinition: sampleNiche });
    const result = await runVideoSuggester({ report });

    expect(result.references.length).toBeGreaterThan(0);

    const first = result.references[0];
    expect(first.videoId).toBeTruthy();
    expect(first.title).toBeTruthy();
    expect(first.channelName).toBeTruthy();
    expect(first.viewCount).toBeGreaterThan(0);
    expect(first.aiAnalysis).toBeTruthy();
    expect(["trending", "top_performer", "hidden_gem"]).toContain(first.relevanceTag);
  });

  it("should return user preference signals", async () => {
    const { report } = await runNicheResearcher({ nicheDefinition: sampleNiche });
    const result = await runVideoSuggester({ report });

    expect(result.userPreferenceSignals.length).toBeGreaterThan(0);
  });
});
