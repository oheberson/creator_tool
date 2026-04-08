import { describe, it, expect } from "vitest";
import { buildPipelineGraph } from "../graph";
import { createInitialPipelineState } from "../types";

describe("Full Pipeline (LangGraph integration)", () => {
  it("should run the complete pipeline from raw idea to impact feedback", async () => {
    const graph = buildPipelineGraph();

    const initialState = createInitialPipelineState("test-project-001");
    initialState.topicClarifier.input = { rawIdea: "sports videos" };

    const config = { configurable: { thread_id: "test-thread-001" } };
    const finalState = await graph.invoke(initialState, config);

    // Topic Clarifier
    expect(finalState.topicClarifier.status).toBe("complete");
    expect(finalState.topicClarifier.output?.isComplete).toBe(true);
    expect(finalState.topicClarifier.output?.nicheDefinition).not.toBeNull();

    // Niche Researcher
    expect(finalState.nicheResearcher.status).toBe("complete");
    expect(finalState.nicheResearcher.output?.report.topChannels.length).toBeGreaterThan(0);

    // Video Suggester
    expect(finalState.videoSuggester.status).toBe("complete");
    expect(finalState.videoSuggester.output?.references.length).toBeGreaterThan(0);

    // Idea Refiner
    expect(finalState.ideaRefiner.status).toBe("complete");
    expect(finalState.ideaRefiner.output?.idea.workingTitle).toBeTruthy();

    // Script Writer
    expect(finalState.scriptWriter.status).toBe("complete");
    expect(finalState.scriptWriter.output?.script.sections.length).toBeGreaterThan(0);

    // Timeline Builder
    expect(finalState.timelineBuilder.status).toBe("complete");
    expect(finalState.timelineBuilder.output?.timeline.segments.length).toBeGreaterThan(0);

    // Impact Feedback
    expect(finalState.impactFeedback).not.toBeNull();
    expect(finalState.impactFeedback!.retentionCurveEstimate.length).toBeGreaterThan(0);
    expect(finalState.impactFeedback!.storytellingCoherenceScore).toBeGreaterThan(0);
  }, 30_000);

  it("should handle different topic inputs", async () => {
    const graph = buildPipelineGraph();

    const initialState = createInitialPipelineState("test-project-002");
    initialState.topicClarifier.input = { rawIdea: "cooking tutorials" };

    const config = { configurable: { thread_id: "test-thread-002" } };
    const finalState = await graph.invoke(initialState, config);

    expect(finalState.topicClarifier.output?.nicheDefinition?.category).toBe("cooking tutorials");
    expect(finalState.timelineBuilder.status).toBe("complete");
    expect(finalState.impactFeedback).not.toBeNull();
  }, 30_000);

  it("should produce a timeline where segments cover the full duration", async () => {
    const graph = buildPipelineGraph();

    const initialState = createInitialPipelineState("test-project-003");
    initialState.topicClarifier.input = { rawIdea: "tech reviews" };

    const config = { configurable: { thread_id: "test-thread-003" } };
    const finalState = await graph.invoke(initialState, config);

    const timeline = finalState.timelineBuilder.output!.timeline;
    const lastSegment = timeline.segments[timeline.segments.length - 1];
    expect(lastSegment.endSec).toBe(timeline.totalDurationSec);
    expect(timeline.segments[0].startSec).toBe(0);
  }, 30_000);
});
