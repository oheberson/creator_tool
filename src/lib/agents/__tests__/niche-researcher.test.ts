import { describe, it, expect } from "vitest";
import { runNicheResearcher } from "../niche-researcher";
import type { NicheDefinition } from "../types";

const sampleNiche: NicheDefinition = {
  category: "tech reviews",
  subCategory: "smartphone comparisons",
  audienceProfile: "18-30 tech enthusiasts",
  contentTone: "informative, casual",
  competitiveLandscapeSummary: "Highly competitive",
  keywords: ["tech", "smartphone", "review"],
};

describe("NicheResearcher", () => {
  it("should produce a research report with top channels", async () => {
    const result = await runNicheResearcher({ nicheDefinition: sampleNiche });

    expect(result.report.topChannels.length).toBeGreaterThan(0);
    expect(result.report.topChannels[0].subscriberCount).toBeGreaterThan(0);
  });

  it("should include content gaps and trending sub-topics", async () => {
    const result = await runNicheResearcher({ nicheDefinition: sampleNiche });

    expect(result.report.contentGaps.length).toBeGreaterThan(0);
    expect(result.report.trendingSubTopics.length).toBeGreaterThan(0);
  });

  it("should construct a niche key from the definition", async () => {
    const result = await runNicheResearcher({ nicheDefinition: sampleNiche });
    expect(result.report.nicheKey).toBe("tech reviews::smartphone comparisons");
  });

  it("should include video performance benchmarks", async () => {
    const result = await runNicheResearcher({ nicheDefinition: sampleNiche });
    const benchmarks = result.report.videoPerformanceBenchmarks;

    expect(benchmarks.averageViews).toBeGreaterThan(0);
    expect(benchmarks.averageLikes).toBeGreaterThan(0);
    expect(benchmarks.averageDuration).toBeGreaterThan(0);
  });
});
