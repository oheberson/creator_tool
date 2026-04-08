import type {
  ImpactFeedback,
  ImpactFeedbackInput,
} from "./types";

/**
 * Stub implementation of the Impact Feedback Engine.
 *
 * In production this will use the LLM to analyze the current timeline + script
 * state against niche benchmarks and produce retention estimates, coherence
 * scores, pacing analysis, and actionable suggestions.
 *
 * This agent runs passively — it re-evaluates whenever the timeline or script changes.
 */
export async function runImpactAnalyzer(
  input: ImpactFeedbackInput
): Promise<ImpactFeedback> {
  const { timeline, nicheDefinition } = input;

  const totalDuration = timeline.totalDurationSec;
  const segmentCount = timeline.segments.length;

  const retentionCurveEstimate = generateRetentionCurve(totalDuration);

  const avgSegmentLength = totalDuration / segmentCount;
  const pacingScore = avgSegmentLength < 120 ? "well-paced" : "may benefit from tighter sections";

  return {
    retentionCurveEstimate,
    storytellingCoherenceScore: 0.82,
    pacingAnalysis: `Average segment length: ${Math.round(avgSegmentLength)}s. For the "${nicheDefinition.subCategory}" niche, this is ${pacingScore}.`,
    engagementProjection: `Based on niche benchmarks, this structure should achieve above-average retention for ${Math.round(totalDuration / 60)}-minute content.`,
    warnings: totalDuration > 900
      ? ["Video exceeds 15 minutes — ensure each section justifies its length to avoid mid-video drop-off."]
      : [],
    suggestions: [
      "Consider adding a mini-hook or visual change at the 2-minute mark to boost early retention.",
      "The body sections could benefit from on-screen data visualizations to maintain engagement.",
    ],
  };
}

function generateRetentionCurve(
  totalDurationSec: number
): { timeSec: number; retentionPct: number }[] {
  const points: { timeSec: number; retentionPct: number }[] = [];
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const timeSec = Math.round((i / steps) * totalDurationSec);
    // Simulated retention: steep initial drop, then gradual decline with a
    // small bump at the climax point (~80% through)
    const progress = i / steps;
    let retention = 100;
    if (progress <= 0.05) {
      retention = 100 - progress * 400;
    } else if (progress <= 0.8) {
      retention = 80 - (progress - 0.05) * 30;
    } else if (progress <= 0.9) {
      retention = 57.5 + (progress - 0.8) * 50;
    } else {
      retention = 62.5 - (progress - 0.9) * 100;
    }
    points.push({ timeSec, retentionPct: Math.round(Math.max(retention, 20) * 10) / 10 });
  }
  return points;
}
