import type {
  TimelineBuilderInput,
  TimelineBuilderOutput,
  TimelineDefinition,
  TimelineSegment,
} from "./types";

/**
 * Stub implementation of the Timeline Builder agent.
 *
 * In production this will convert the confirmed script into a visual timeline
 * with segments, B-roll placeholders, transitions, and audio cues — all
 * calibrated to niche-specific retention patterns.
 */
export async function runTimelineBuilder(
  input: TimelineBuilderInput
): Promise<TimelineBuilderOutput> {
  const { script } = input;

  let currentTimeSec = 0;
  const segments: TimelineSegment[] = script.sections.map((section) => {
    const segment: TimelineSegment = {
      id: `seg_${section.id}`,
      scriptSectionId: section.id,
      label: section.title,
      startSec: currentTimeSec,
      endSec: currentTimeSec + section.estimatedDurationSec,
      mediaPlaceholder: mapSectionTypeToMedia(section.type),
      transitionIn: currentTimeSec === 0 ? null : "crossfade",
      transitionOut: null,
    };
    currentTimeSec += section.estimatedDurationSec;
    return segment;
  });

  const audioCueMarkers = [
    { timeSec: 0, label: "Music: Intro sting" },
    { timeSec: 15, label: "Music: Background ambient" },
    { timeSec: script.totalEstimatedDurationSec - 30, label: "Music: Outro fade in" },
  ];

  const timeline: TimelineDefinition = {
    segments,
    totalDurationSec: script.totalEstimatedDurationSec,
    audioCueMarkers,
  };

  return { timeline };
}

function mapSectionTypeToMedia(
  type: string
): TimelineSegment["mediaPlaceholder"] {
  switch (type) {
    case "hook":
      return "b_roll";
    case "intro":
    case "cta":
    case "outro":
      return "camera";
    case "body":
      return "screen_recording";
    case "climax":
      return "voice_over";
    default:
      return "empty";
  }
}
