import "server-only";

import type {
  VideoSuggesterInput,
  VideoSuggesterOutput,
  VideoReference,
  NicheResearchReport,
} from "./types";
import {
  isYouTubeApiConfigured,
  listVideosByIds,
  searchVideos,
} from "@/lib/youtube";

function parseStatInt(raw: string | undefined): number {
  if (!raw) return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}

function buildQueryFromReport(report: NicheResearchReport): string {
  const parts = report.nicheKey.split("::").map((s) => s.trim()).filter(Boolean);
  const q = parts.join(" ").trim();
  return q.length > 2 ? q.slice(0, 80) : "youtube";
}

function subsForChannelName(
  report: NicheResearchReport,
  channelName: string
): number {
  const row = report.topChannels.find(
    (c) => c.name.toLowerCase() === channelName.toLowerCase()
  );
  return row?.subscriberCount ?? 0;
}

function stubFromReport(report: NicheResearchReport): VideoSuggesterOutput {
  const references: VideoReference[] = [
    {
      videoId: "yt_trend_001",
      title: `Why ${report.nicheKey.split("::")[0]} is Exploding Right Now`,
      channelName: report.topChannels[0]?.name ?? "Unknown Channel",
      viewCount: 340_000,
      publishedAt: "2026-03-20T10:00:00Z",
      thumbnailUrl: "https://img.youtube.com/vi/yt_trend_001/hqdefault.jpg",
      relevanceTag: "trending",
      aiAnalysis:
        "Stub mode (no YouTube API key): illustrative card. Connect YOUTUBE_API_KEY for live metadata.",
    },
    {
      videoId: "yt_top_001",
      title: `The Complete ${report.nicheKey.split("::")[1] ?? "Niche"} Guide`,
      channelName: report.topChannels[1]?.name ?? "Unknown Channel",
      viewCount: 1_200_000,
      publishedAt: "2025-11-15T14:00:00Z",
      thumbnailUrl: "https://img.youtube.com/vi/yt_top_001/hqdefault.jpg",
      relevanceTag: "top_performer",
      aiAnalysis:
        "Stub mode: represents a high-view evergreen format in this niche. Enable the API for real URLs and counts.",
    },
    {
      videoId: "yt_gem_001",
      title: "What Nobody Tells You About This Space",
      channelName: report.topChannels[2]?.name ?? "Unknown Channel",
      viewCount: 45_000,
      publishedAt: "2026-02-28T08:30:00Z",
      thumbnailUrl: "https://img.youtube.com/vi/yt_gem_001/hqdefault.jpg",
      relevanceTag: "hidden_gem",
      aiAnalysis:
        "Stub mode: small-channel breakout pattern. With the API we approximate this using views vs subscriber scale.",
    },
  ];

  return {
    references,
    userPreferenceSignals: [
      "prefers data-driven content",
      "interested in long-form",
      "values unique angles",
    ],
  };
}

function mapVideoToReference(
  videoId: string,
  details: {
    title: string;
    channelName: string;
    publishedAt: string;
    thumbnailUrl: string;
    viewCount: number;
  },
  tag: VideoReference["relevanceTag"],
  report: NicheResearchReport,
  extraNote: string
): VideoReference {
  const subs = subsForChannelName(report, details.channelName);
  const ratio = subs > 0 ? details.viewCount / subs : 0;
  const ratioLabel =
    subs <= 0
      ? "subscriber count unavailable for this channel"
      : ratio >= 0.5
        ? "strong views relative to channel size in our sample"
        : "typical scale for this channel size in our sample";

  return {
    videoId,
    title: details.title,
    channelName: details.channelName,
    viewCount: details.viewCount,
    publishedAt: details.publishedAt,
    thumbnailUrl: details.thumbnailUrl,
    relevanceTag: tag,
    aiAnalysis: `${extraNote} About ${details.viewCount.toLocaleString()} views; ${ratioLabel}. Grounded in YouTube Data API metadata (no transcript).`,
  };
}

async function runVideoSuggesterFromYouTube(
  input: VideoSuggesterInput
): Promise<VideoSuggesterOutput> {
  const { report } = input;
  const q = buildQueryFromReport(report);

  const since = new Date();
  since.setDate(since.getDate() - 45);
  const publishedAfter = since.toISOString();

  const [recentSearch, topSearch] = await Promise.all([
    searchVideos({ q, order: "date", publishedAfter, maxResults: 18 }),
    searchVideos({ q, order: "viewCount", maxResults: 18 }),
  ]);

  const recentIds =
    recentSearch.items
      ?.map((it) => it.id?.videoId)
      .filter((id): id is string => Boolean(id)) ?? [];
  const topIds =
    topSearch.items
      ?.map((it) => it.id?.videoId)
      .filter((id): id is string => Boolean(id)) ?? [];

  const mergedIds = [...new Set([...recentIds, ...topIds])];
  if (mergedIds.length === 0) {
    return stubFromReport(report);
  }

  const details = await listVideosByIds(mergedIds.slice(0, 40));
  const byId = new Map(
    (details.items ?? [])
      .filter((v) => v.id)
      .map((v) => [v.id as string, v] as const)
  );

  type Scored = { id: string; ratio: number; views: number; subs: number };
  const scored: Scored[] = [];
  for (const id of mergedIds) {
    const v = byId.get(id);
    if (!v?.snippet?.channelTitle) continue;
    const views = parseStatInt(v.statistics?.viewCount);
    const subs = subsForChannelName(report, v.snippet.channelTitle);
    if (views < 5_000) continue;
    const ratio = subs > 0 ? views / Math.max(subs, 1) : 0;
    if (subs > 0 && subs <= 500_000 && ratio >= 0.15) {
      scored.push({ id, ratio, views, subs });
    }
  }
  scored.sort((a, b) => b.ratio - a.ratio);
  const gemId = scored[0]?.id;

  const trendingId = recentIds.find((id) => byId.has(id)) ?? mergedIds[0];
  const topId =
    topIds.find((id) => id !== trendingId && byId.has(id)) ??
    mergedIds.find((id) => id !== trendingId) ??
    trendingId;

  const pickIds = [trendingId, topId, gemId].filter(
    (id, i, arr): id is string => Boolean(id) && arr.indexOf(id) === i
  );
  if (pickIds.length === 0) {
    return stubFromReport(report);
  }

  const refs: VideoReference[] = [];
  const pushRef = (
    id: string,
    tag: VideoReference["relevanceTag"],
    note: string
  ) => {
    const v = byId.get(id);
    if (!v?.snippet?.title || !v.snippet.channelTitle) return;
    const thumb =
      v.snippet.thumbnails?.high?.url ??
      v.snippet.thumbnails?.medium?.url ??
      `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    refs.push(
      mapVideoToReference(
        id,
        {
          title: v.snippet.title,
          channelName: v.snippet.channelTitle,
          publishedAt: v.snippet.publishedAt ?? new Date().toISOString(),
          thumbnailUrl: thumb,
          viewCount: parseStatInt(v.statistics?.viewCount),
        },
        tag,
        report,
        note
      )
    );
  };

  pushRef(trendingId, "trending", "Surfaced from recent uploads in this niche query.");
  if (topId !== trendingId) {
    pushRef(topId, "top_performer", "High lifetime views in search results for this query.");
  }
  if (gemId && gemId !== trendingId && gemId !== topId) {
    pushRef(gemId, "hidden_gem", "Heuristic: high views relative to subscriber scale in our sample.");
  }

  if (refs.length < 2 && mergedIds[0]) {
    const fallback = mergedIds.find((id) => !refs.some((r) => r.videoId === id));
    if (fallback) {
      pushRef(fallback, "top_performer", "Additional top result from the same niche search.");
    }
  }

  return {
    references: refs.length > 0 ? refs : stubFromReport(report).references,
    userPreferenceSignals: [
      "recent uploads in this query set",
      "high view-count leaders for the same keywords",
      "smaller channels with outsized views (heuristic)",
    ],
  };
}

/**
 * Video Suggester: YouTube search + videos metadata; simple heuristics for tags.
 * Stub when YOUTUBE_API_KEY is missing or calls fail.
 */
export async function runVideoSuggester(
  input: VideoSuggesterInput
): Promise<VideoSuggesterOutput> {
  if (!isYouTubeApiConfigured()) {
    return stubFromReport(input.report);
  }
  try {
    return await runVideoSuggesterFromYouTube(input);
  } catch (e) {
    console.error("[runVideoSuggester] YouTube path failed, using stub:", e);
    return stubFromReport(input.report);
  }
}
