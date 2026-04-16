import "server-only";

import { youTubeGet } from "./client";
import type { YouTubeSearchListResponse } from "./types";

export async function searchChannels(params: {
  q: string;
  maxResults?: number;
}): Promise<YouTubeSearchListResponse> {
  return youTubeGet<YouTubeSearchListResponse>("search", {
    part: "snippet",
    type: "channel",
    q: params.q,
    maxResults: params.maxResults ?? 10,
  });
}

export async function searchVideos(params: {
  q?: string;
  channelId?: string;
  order?: "date" | "viewCount" | "relevance";
  publishedAfter?: string;
  videoDuration?: "short" | "medium" | "long" | "any";
  maxResults?: number;
}): Promise<YouTubeSearchListResponse> {
  const body: Record<string, string | number | undefined> = {
    part: "snippet",
    type: "video",
    order: params.order ?? "relevance",
    maxResults: params.maxResults ?? 10,
  };
  if (params.q) body.q = params.q;
  if (params.channelId) body.channelId = params.channelId;
  if (params.publishedAfter) body.publishedAfter = params.publishedAfter;
  if (params.videoDuration && params.videoDuration !== "any") {
    body.videoDuration = params.videoDuration;
  }
  return youTubeGet<YouTubeSearchListResponse>("search", body);
}
