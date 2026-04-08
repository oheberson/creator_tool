import type {
  ScriptWriterInput,
  ScriptWriterOutput,
  ScriptDraft,
  ScriptSection,
  VideoFormatSuggestion,
} from "./types";

/**
 * Stub implementation of the Script Writer agent.
 *
 * In production this will use the LLM with storytelling theory prompts,
 * calibrated to the niche, to produce a structured script with sections,
 * timing estimates, and format suggestions.
 */
export async function runScriptWriter(
  input: ScriptWriterInput
): Promise<ScriptWriterOutput> {
  const { idea, report } = input;

  const sections: ScriptSection[] = [
    {
      id: "section_hook",
      type: "hook",
      title: "Cold Open",
      content: `Open with a surprising statistic or bold claim about "${idea.workingTitle}" that immediately challenges assumptions.`,
      estimatedDurationSec: 15,
      storytellingAnnotation:
        "Pattern interrupt — grab attention within 3 seconds. Use a visual or data point that creates curiosity.",
    },
    {
      id: "section_intro",
      type: "intro",
      title: "Context Setup",
      content:
        "Briefly establish who you are, why this topic matters, and what the viewer will learn. Frame the promise of the video.",
      estimatedDurationSec: 30,
      storytellingAnnotation:
        "Social proof + promise. Keep it tight — viewers decide to stay or leave in the first 30 seconds.",
    },
    {
      id: "section_body_1",
      type: "body",
      title: "The Background",
      content:
        "Lay the factual foundation. Present the key data, events, or context the audience needs before the analysis begins.",
      estimatedDurationSec: 120,
      storytellingAnnotation:
        "Exposition phase. Use B-roll, charts, or screen recordings to maintain visual variety.",
    },
    {
      id: "section_body_2",
      type: "body",
      title: "The Deep Dive",
      content: `This is the core analytical section. Break down the patterns, compare with ${report.trendingSubTopics[0] ?? "related topics"}, and present your unique findings.`,
      estimatedDurationSec: 240,
      storytellingAnnotation:
        "Rising action. Build complexity gradually. Insert mini-hooks ('but here is where it gets interesting') every 60-90 seconds to maintain retention.",
    },
    {
      id: "section_body_3",
      type: "body",
      title: "The Contrarian Take",
      content:
        "Present your unique angle — the insight that differentiates this video from everything else on the topic.",
      estimatedDurationSec: 120,
      storytellingAnnotation:
        "Differentiation moment. This is what viewers will remember and share. Make it quotable.",
    },
    {
      id: "section_climax",
      type: "climax",
      title: "The Reveal",
      content:
        "Tie all threads together. Deliver the main thesis with conviction and supporting evidence.",
      estimatedDurationSec: 60,
      storytellingAnnotation:
        "Climax — peak emotional/intellectual engagement. Slow pacing, deliberate delivery.",
    },
    {
      id: "section_cta",
      type: "cta",
      title: "Call to Action",
      content:
        "Ask the viewer a question related to the topic. Prompt likes, comments, and subscriptions naturally.",
      estimatedDurationSec: 15,
      storytellingAnnotation:
        "Engagement driver. Tie the CTA to the content ('What do you think — am I right about this?').",
    },
    {
      id: "section_outro",
      type: "outro",
      title: "Sign Off",
      content:
        "Brief teaser for upcoming content. Thank the viewer. End screen with related video suggestion.",
      estimatedDurationSec: 15,
      storytellingAnnotation:
        "Keep short. Don't let retention drop — end on a high note and point to the next video.",
    },
  ];

  const totalEstimatedDurationSec = sections.reduce(
    (sum, s) => sum + s.estimatedDurationSec,
    0
  );

  const formatSuggestion: VideoFormatSuggestion = {
    cameraTakes: "Talking head for intro/outro, screen recording + B-roll for body sections",
    voiceTone: "Conversational but authoritative — confident without being arrogant",
    storytellingStyle: "analytical narrative with data-driven reveals",
    pacingNotes: `Target ${Math.round(totalEstimatedDurationSec / 60)} minutes. Niche average is ${Math.round(report.videoPerformanceBenchmarks.averageDuration / 60)} minutes — this length is appropriate.`,
  };

  const script: ScriptDraft = {
    sections,
    totalEstimatedDurationSec,
    formatSuggestion,
  };

  return { script };
}
