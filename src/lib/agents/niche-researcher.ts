import "server-only";

import { generateObject } from "ai";
import type {
  NicheResearcherInput,
  NicheResearcherOutput,
  NicheResearchReport,
  ChannelProfile,
} from "./types";
import {
  buildNicheSearchQuery,
  isYouTubeApiConfigured,
  listChannelsByIds,
  listVideosByIds,
  searchChannels,
  searchVideos,
} from "@/lib/youtube";
import { parseIso8601DurationSeconds } from "@/lib/youtube/duration";
import {
  getGroqProvider,
  groqStructuredObjectProviderOptions,
  NICHE_RESEARCHER_INSIGHTS_MODEL,
} from "@/lib/ai/model";
import {
  nicheResearchInsightsSchema,
  type NicheResearchInsights,
} from "./niche-research-insights-schema";

function parseStatInt(raw: string | undefined): number {
  if (!raw) return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}

async function inferInsightsFromSample(params: {
  channels: ChannelProfile[];
  videoTitles: string[];
  avgViews: number;
  avgDurationSec: number;
}): Promise<NicheResearchInsights> {
  const channelsJson = JSON.stringify(
    params.channels.map((c) => ({
      name: c.name,
      id: c.channelId,
      subscribers: c.subscriberCount,
      avgViewsSample: c.averageViews,
      topVideoIds: c.topVideoIds,
    })),
    null,
    2
  );
  const titlesSample = params.videoTitles.slice(0, 25);

  try {
    const groq = getGroqProvider();
    const { object } = await generateObject({
      model: groq(NICHE_RESEARCHER_INSIGHTS_MODEL),
      schema: nicheResearchInsightsSchema,
      system: `You help video creators interpret niche research. You only receive counts, titles, and channel names from YouTube search samples — not full transcripts.
Do not invent specific view counts or channel names beyond the JSON sample.
If the sample is thin, say so in the gaps (e.g. "Limited sample — validate with more searches").`,
      prompt: `Niche sample summary:
- Approx mean views in sample: ${Math.round(params.avgViews)}
- Approx mean duration (sec): ${Math.round(params.avgDurationSec)}
- Channels (JSON):\n${channelsJson}
- Video titles (subset):\n${titlesSample.map((t) => `- ${t}`).join("\n")}`,
      providerOptions: groqStructuredObjectProviderOptions,
    });
    return object;
  } catch {
    return {
      contentGaps: [
        "Limited automated sample — manually validate which angles competitors under-serve.",
        "Long-form depth vs short updates balance is unclear from metadata alone; review winning thumbnails and hooks.",
      ],
      trendingSubTopics: [
        "List and ranking formats visible in the sample",
        "Breakdown / reaction style titles recurring in top results",
      ],
    };
  }
}

function runNicheResearcherStub(
  input: NicheResearcherInput
): NicheResearcherOutput {
  const { nicheDefinition } = input;
  const topChannels: ChannelProfile[] = [
    {
      channelId: "UC_mock_001",
      name: `${nicheDefinition.category} Central`,
      subscriberCount: 450_000,
      averageViews: 120_000,
      topVideoIds: ["vid_001", "vid_002", "vid_003"],
    },
    {
      channelId: "UC_mock_002",
      name: `The ${nicheDefinition.subCategory} Show`,
      subscriberCount: 180_000,
      averageViews: 65_000,
      topVideoIds: ["vid_004", "vid_005"],
    },
    {
      channelId: "UC_mock_003",
      name: "Deep Dive Weekly",
      subscriberCount: 92_000,
      averageViews: 38_000,
      topVideoIds: ["vid_006", "vid_007", "vid_008"],
    },
  ];

  return {
    report: {
      nicheKey: `${nicheDefinition.category}::${nicheDefinition.subCategory}`,
      topChannels,
      videoPerformanceBenchmarks: {
        averageViews: 74_000,
        averageLikes: 3_200,
        averageDuration: 720,
      },
      audienceDemographics: nicheDefinition.audienceProfile,
      contentGaps: [
        "Few channels combine data visualization with narrative storytelling",
        "Under-served international audience for this niche",
        "Limited long-form deep-dive content (20+ min)",
      ],
      trendingSubTopics: [
        "Comparison formats (A vs B)",
        "Historical retrospectives",
        "Prediction and speculation content",
      ],
      cachedAt: null,
    },
    fromCache: false,
  };
}

async function runNicheResearcherFromYouTube(
  input: NicheResearcherInput
): Promise<NicheResearcherOutput> {
  const { nicheDefinition } = input;
  const q = buildNicheSearchQuery(nicheDefinition);

  const channelSearch = await searchChannels({ q, maxResults: 12 });
  const channelIds =
    channelSearch.items
      ?.map((it) => it.id?.channelId)
      .filter((id): id is string => Boolean(id && id.startsWith("UC"))) ?? [];

  const uniqueChannelIds = [...new Set(channelIds)].slice(0, 6);
  if (uniqueChannelIds.length === 0) {
    return runNicheResearcherStub(input);
  }

  const channelsRes = await listChannelsByIds(uniqueChannelIds);
  const channelRows = channelsRes.items ?? [];

  const ranked = [...channelRows].sort((a, b) => {
    const sa = parseStatInt(a.statistics?.subscriberCount);
    const sb = parseStatInt(b.statistics?.subscriberCount);
    return sb - sa;
  });

  const topMeta = ranked.slice(0, 3);
  const videoIdsByChannel = new Map<string, string[]>();

  for (const ch of topMeta) {
    const cid = ch.id;
    if (!cid) continue;
    const vidSearch = await searchVideos({
      channelId: cid,
      order: "viewCount",
      maxResults: 5,
    });
    const vids =
      vidSearch.items
        ?.map((it) => it.id?.videoId)
        .filter((id): id is string => Boolean(id)) ?? [];
    videoIdsByChannel.set(cid, vids);
  }

  const allVideoIds = [...videoIdsByChannel.values()].flat();
  const videosRes = await listVideosByIds(allVideoIds);
  const videoItems = videosRes.items ?? [];

  const viewsList: number[] = [];
  const likesList: number[] = [];
  const durList: number[] = [];
  const titles: string[] = [];

  for (const v of videoItems) {
    const vc = parseStatInt(v.statistics?.viewCount);
    const lk = parseStatInt(v.statistics?.likeCount);
    const du = parseIso8601DurationSeconds(v.contentDetails?.duration);
    if (vc) viewsList.push(vc);
    if (lk) likesList.push(lk);
    if (du) durList.push(du);
    if (v.snippet?.title) titles.push(v.snippet.title);
  }

  const avgViews =
    viewsList.length > 0 ? viewsList.reduce((a, b) => a + b, 0) / viewsList.length : 0;
  const avgLikes =
    likesList.length > 0 ? likesList.reduce((a, b) => a + b, 0) / likesList.length : 0;
  const avgDur =
    durList.length > 0 ? durList.reduce((a, b) => a + b, 0) / durList.length : 0;

  const topChannels: ChannelProfile[] = topMeta.map((ch) => {
    const cid = ch.id!;
    const subs = ch.statistics?.hiddenSubscriberCount
      ? 0
      : parseStatInt(ch.statistics?.subscriberCount);
    const vids = videoIdsByChannel.get(cid) ?? [];
    const statsForChannel = videoItems.filter((v) => v.id && vids.includes(v.id));
    const chViews = statsForChannel
      .map((v) => parseStatInt(v.statistics?.viewCount))
      .filter((n) => n > 0);
    const chAvg =
      chViews.length > 0 ? Math.round(chViews.reduce((a, b) => a + b, 0) / chViews.length) : 0;

    return {
      channelId: cid,
      name: ch.snippet?.title ?? cid,
      subscriberCount: subs,
      averageViews: chAvg,
      topVideoIds: vids.slice(0, 5),
    };
  });

  const insights = await inferInsightsFromSample({
    channels: topChannels,
    videoTitles: titles,
    avgViews,
    avgDurationSec: avgDur,
  });

  const report: NicheResearchReport = {
    nicheKey: `${nicheDefinition.category}::${nicheDefinition.subCategory}`,
    topChannels,
    videoPerformanceBenchmarks: {
      averageViews: Math.round(avgViews) || 1,
      averageLikes: Math.round(avgLikes) || 1,
      averageDuration: Math.round(avgDur) || 60,
    },
    audienceDemographics: nicheDefinition.audienceProfile,
    contentGaps: insights.contentGaps,
    trendingSubTopics: insights.trendingSubTopics,
    cachedAt: null,
  };

  return { report, fromCache: false };
}

/**
 * Niche Researcher: YouTube Data API v3 + optional Groq for qualitative gaps/trends.
 * Falls back to deterministic stub when YOUTUBE_API_KEY is not set (local dev / tests).
 */
export async function runNicheResearcher(
  input: NicheResearcherInput
): Promise<NicheResearcherOutput> {
  if (!isYouTubeApiConfigured()) {
    return runNicheResearcherStub(input);
  }
  try {
    return await runNicheResearcherFromYouTube(input);
  } catch (e) {
    console.error("[runNicheResearcher] YouTube path failed, using stub:", e);
    return runNicheResearcherStub(input);
  }
}
