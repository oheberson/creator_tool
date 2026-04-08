import { describe, it, expect } from "vitest";
import { runImpactAnalyzer } from "../impact-analyzer";
import type { TimelineDefinition, ScriptDraft, NicheDefinition } from "../types";

const sampleTimeline: TimelineDefinition = {
  segments: [
    { id: "seg1", scriptSectionId: "s1", label: "Hook", startSec: 0, endSec: 15, mediaPlaceholder: "b_roll", transitionIn: null, transitionOut: null },
    { id: "seg2", scriptSectionId: "s2", label: "Body", startSec: 15, endSec: 195, mediaPlaceholder: "camera", transitionIn: "crossfade", transitionOut: null },
    { id: "seg3", scriptSectionId: "s3", label: "Outro", startSec: 195, endSec: 210, mediaPlaceholder: "camera", transitionIn: "crossfade", transitionOut: null },
  ],
  totalDurationSec: 210,
  audioCueMarkers: [],
};

const sampleScript: ScriptDraft = {
  sections: [],
  totalEstimatedDurationSec: 210,
  formatSuggestion: { cameraTakes: "", voiceTone: "", storytellingStyle: "", pacingNotes: "" },
};

const sampleNiche: NicheDefinition = {
  category: "tech",
  subCategory: "reviews",
  audienceProfile: "18-30",
  contentTone: "casual",
  competitiveLandscapeSummary: "competitive",
  keywords: ["tech"],
};

describe("ImpactAnalyzer", () => {
  it("should produce a retention curve with multiple points", async () => {
    const result = await runImpactAnalyzer({
      timeline: sampleTimeline,
      script: sampleScript,
      nicheDefinition: sampleNiche,
    });

    expect(result.retentionCurveEstimate.length).toBeGreaterThan(5);
    expect(result.retentionCurveEstimate[0].retentionPct).toBe(100);
  });

  it("should produce a coherence score between 0 and 1", async () => {
    const result = await runImpactAnalyzer({
      timeline: sampleTimeline,
      script: sampleScript,
      nicheDefinition: sampleNiche,
    });

    expect(result.storytellingCoherenceScore).toBeGreaterThanOrEqual(0);
    expect(result.storytellingCoherenceScore).toBeLessThanOrEqual(1);
  });

  it("should include pacing analysis and engagement projection", async () => {
    const result = await runImpactAnalyzer({
      timeline: sampleTimeline,
      script: sampleScript,
      nicheDefinition: sampleNiche,
    });

    expect(result.pacingAnalysis).toBeTruthy();
    expect(result.engagementProjection).toBeTruthy();
  });

  it("should provide actionable suggestions", async () => {
    const result = await runImpactAnalyzer({
      timeline: sampleTimeline,
      script: sampleScript,
      nicheDefinition: sampleNiche,
    });

    expect(result.suggestions.length).toBeGreaterThan(0);
  });
});
