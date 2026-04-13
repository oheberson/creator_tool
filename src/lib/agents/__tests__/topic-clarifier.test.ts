import { describe, it, expect } from "vitest";
import { runTopicClarifierStub } from "../topic-clarifier.stub";

describe("TopicClarifier (stub for LangGraph / offline tests)", () => {
  it("should return a complete niche definition from a raw idea", async () => {
    const result = await runTopicClarifierStub({ rawIdea: "sports videos" });

    expect(result.isComplete).toBe(true);
    expect(result.nicheDefinition).not.toBeNull();
    expect(result.nicheDefinition!.category).toBe("sports videos");
    expect(result.nicheDefinition!.subCategory).toBeTruthy();
    expect(result.nicheDefinition!.keywords.length).toBeGreaterThan(0);
  });

  it("should contain a multi-turn conversation", async () => {
    const result = await runTopicClarifierStub({ rawIdea: "music videos" });

    expect(result.conversation.length).toBeGreaterThanOrEqual(2);
    expect(result.conversation[0].role).toBe("user");
    expect(result.conversation[0].content).toContain("music videos");
  });

  it("should produce keywords that include the raw idea", async () => {
    const result = await runTopicClarifierStub({ rawIdea: "news videos" });
    expect(result.nicheDefinition!.keywords).toContain("news videos");
  });
});
