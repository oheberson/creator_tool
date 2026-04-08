import { describe, it, expect } from "vitest";
import { runScriptWriter } from "../script-writer";
import type { VideoIdea, NicheResearchReport } from "../types";

const sampleIdea: VideoIdea = {
  workingTitle: "Why Retro Games Are Making a Comeback",
  uniqueAngle: "Economic analysis meets nostalgia",
  targetAudience: "25-40 gamers",
  differentiationFromExisting: "Data-driven approach",
  estimatedAppeal: "high",
  competitorVideoIds: ["comp_001"],
};

const sampleReport: NicheResearchReport = {
  nicheKey: "gaming::retro analysis",
  topChannels: [],
  videoPerformanceBenchmarks: { averageViews: 50_000, averageLikes: 2_000, averageDuration: 600 },
  audienceDemographics: "25-40",
  contentGaps: ["lack of data-driven content"],
  trendingSubTopics: ["indie revivals"],
  cachedAt: null,
};

describe("ScriptWriter", () => {
  it("should produce a script with required section types", async () => {
    const result = await runScriptWriter({ idea: sampleIdea, report: sampleReport });
    const types = result.script.sections.map((s) => s.type);

    expect(types).toContain("hook");
    expect(types).toContain("intro");
    expect(types).toContain("body");
    expect(types).toContain("climax");
    expect(types).toContain("cta");
    expect(types).toContain("outro");
  });

  it("should have a total duration matching sum of sections", async () => {
    const result = await runScriptWriter({ idea: sampleIdea, report: sampleReport });
    const sum = result.script.sections.reduce((acc, s) => acc + s.estimatedDurationSec, 0);
    expect(result.script.totalEstimatedDurationSec).toBe(sum);
  });

  it("should include format suggestions", async () => {
    const result = await runScriptWriter({ idea: sampleIdea, report: sampleReport });
    const fmt = result.script.formatSuggestion;

    expect(fmt.cameraTakes).toBeTruthy();
    expect(fmt.voiceTone).toBeTruthy();
    expect(fmt.storytellingStyle).toBeTruthy();
    expect(fmt.pacingNotes).toBeTruthy();
  });

  it("should produce storytelling annotations for every section", async () => {
    const result = await runScriptWriter({ idea: sampleIdea, report: sampleReport });
    for (const section of result.script.sections) {
      expect(section.storytellingAnnotation).toBeTruthy();
    }
  });
});
