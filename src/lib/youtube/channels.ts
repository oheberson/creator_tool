import "server-only";

import { youTubeGet } from "./client";
import type { YouTubeChannelsListResponse } from "./types";

export async function listChannelsByIds(
  channelIds: string[]
): Promise<YouTubeChannelsListResponse> {
  if (channelIds.length === 0) {
    return { items: [] };
  }
  const idParam = channelIds.slice(0, 50).join(",");
  return youTubeGet<YouTubeChannelsListResponse>("channels", {
    part: "snippet,statistics,contentDetails",
    id: idParam,
  });
}
