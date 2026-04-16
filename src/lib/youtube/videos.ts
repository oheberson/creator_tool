import "server-only";

import { youTubeGet } from "./client";
import type { YouTubeVideosListResponse } from "./types";

const MAX_IDS_PER_REQUEST = 50;

export async function listVideosByIds(videoIds: string[]): Promise<YouTubeVideosListResponse> {
  const unique = [...new Set(videoIds.filter(Boolean))];
  const items: NonNullable<YouTubeVideosListResponse["items"]> = [];

  for (let i = 0; i < unique.length; i += MAX_IDS_PER_REQUEST) {
    const chunk = unique.slice(i, i + MAX_IDS_PER_REQUEST);
    const res = await youTubeGet<YouTubeVideosListResponse>("videos", {
      part: "snippet,statistics,contentDetails",
      id: chunk.join(","),
    });
    if (res.items?.length) items.push(...res.items);
  }

  return { items };
}
