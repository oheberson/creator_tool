import { describe, it, expect } from "vitest";
import { runTimelineBuilder } from "../timeline-builder";
import type { ScriptDraft } from "../types";

const sampleScript: ScriptDraft = {
  sections: [
    { id: "s1", type: "hook", title: "Cold Open", content: "...", estimatedDurationSec: 15, storytellingAnnotation: "..." },
    { id: "s2", type: "intro", title: "Intro", content: "...", estimatedDurationSec: 30, storytellingAnnotation: "..." },
    { id: "s3", type: "body", title: "Main", content: "...", estimatedDurationSec: 180, storytellingAnnotation: "..." },
    { id: "s4", type: "climax", title: "Climax", content: "...", estimatedDurationSec: 60, storytellingAnnotation: "..." },
    { id: "s5", type: "outro", title: "Outro", content: "...", estimatedDurationSec: 15, storytellingAnnotation: "..." },
  ],
  totalEstimatedDurationSec: 300,
  formatSuggestion: { cameraTakes: "", voiceTone: "", storytellingStyle: "", pacingNotes: "" },
};

describe("TimelineBuilder", () => {
  it("should create one segment per script section", async () => {
    const result = await runTimelineBuilder({ script: sampleScript });
    expect(result.timeline.segments.length).toBe(sampleScript.sections.length);
  });

  it("should have sequential non-overlapping time ranges", async () => {
    const result = await runTimelineBuilder({ script: sampleScript });
    for (let i = 1; i < result.timeline.segments.length; i++) {
      expect(result.timeline.segments[i].startSec).toBe(result.timeline.segments[i - 1].endSec);
    }
  });

  it("should match total duration to script total", async () => {
    const result = await runTimelineBuilder({ script: sampleScript });
    expect(result.timeline.totalDurationSec).toBe(sampleScript.totalEstimatedDurationSec);
  });

  it("should include audio cue markers", async () => {
    const result = await runTimelineBuilder({ script: sampleScript });
    expect(result.timeline.audioCueMarkers.length).toBeGreaterThan(0);
  });

  it("should link each segment back to its script section", async () => {
    const result = await runTimelineBuilder({ script: sampleScript });
    const scriptIds = sampleScript.sections.map((s) => s.id);
    for (const seg of result.timeline.segments) {
      expect(scriptIds).toContain(seg.scriptSectionId);
    }
  });
});
