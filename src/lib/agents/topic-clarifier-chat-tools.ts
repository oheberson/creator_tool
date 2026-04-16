import "server-only";

import { tool } from "ai";
import { z } from "zod";
import {
  isYouTubeApiConfigured,
  searchChannels,
  searchVideos,
  listVideosByIds,
} from "@/lib/youtube";

function parseStatInt(raw: string | undefined): number {
  if (!raw) return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}

export const topicClarifierChatTools = {
  youtubePreviewChannels: tool({
    description:
      "Search YouTube for channels matching a short query. Use when the user wants real-world examples or competitive context. Always attribute results to this tool (live YouTube Data API).",
    inputSchema: z.object({
      query: z.string().min(2).max(120).describe("Search query, e.g. niche keywords"),
      maxResults: z.number().int().min(1).max(8).optional(),
    }),
    execute: async ({ query, maxResults }) => {
      if (!isYouTubeApiConfigured()) {
        return {
          configured: false as const,
          message:
            "YouTube API is not configured on the server (missing YOUTUBE_API_KEY). Describe the niche without citing specific channel stats.",
        };
      }
      try {
        const res = await searchChannels({ q: query, maxResults: maxResults ?? 6 });
        const rows =
          res.items?.map((it) => ({
            channelId: it.id?.channelId ?? null,
            title: it.snippet?.title ?? null,
          })) ?? [];
        return { configured: true as const, query, channels: rows };
      } catch (e) {
        const message = e instanceof Error ? e.message : "YouTube request failed";
        return { configured: true as const, query, error: message, channels: [] };
      }
    },
  }),

  youtubePreviewVideos: tool({
    description:
      "Search YouTube for recent or popular videos for a short query. Use for grounded examples; cite as API results, not user-confirmed plans.",
    inputSchema: z.object({
      query: z.string().min(2).max(120),
      order: z.enum(["date", "viewCount", "relevance"]).optional(),
      maxResults: z.number().int().min(1).max(8).optional(),
    }),
    execute: async ({ query, order, maxResults }) => {
      if (!isYouTubeApiConfigured()) {
        return {
          configured: false as const,
          message:
            "YouTube API is not configured (missing YOUTUBE_API_KEY). Stay high-level or ask the user for example channels they admire.",
        };
      }
      try {
        const res = await searchVideos({
          q: query,
          order: order ?? "relevance",
          maxResults: maxResults ?? 6,
        });
        const ids =
          res.items
            ?.map((it) => it.id?.videoId)
            .filter((id): id is string => Boolean(id)) ?? [];
        const details = await listVideosByIds(ids);
        const videos =
          details.items?.map((v) => ({
            videoId: v.id ?? null,
            title: v.snippet?.title ?? null,
            channelTitle: v.snippet?.channelTitle ?? null,
            viewCount: parseStatInt(v.statistics?.viewCount),
            publishedAt: v.snippet?.publishedAt ?? null,
          })) ?? [];
        return { configured: true as const, query, order: order ?? "relevance", videos };
      } catch (e) {
        const message = e instanceof Error ? e.message : "YouTube request failed";
        return {
          configured: true as const,
          query,
          order: order ?? "relevance",
          error: message,
          videos: [],
        };
      }
    },
  }),
};
