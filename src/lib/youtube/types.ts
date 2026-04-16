/** Narrow shapes from YouTube Data API v3 JSON we consume. */

export interface YouTubeSearchListResponse {
  items?: Array<{
    id?: { kind?: string; channelId?: string; videoId?: string };
    snippet?: {
      title?: string;
      description?: string;
      channelTitle?: string;
      channelId?: string;
      publishedAt?: string;
      thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
    };
  }>;
  nextPageToken?: string;
}

export interface YouTubeChannelsListResponse {
  items?: Array<{
    id?: string;
    snippet?: { title?: string };
    statistics?: {
      viewCount?: string;
      subscriberCount?: string;
      videoCount?: string;
      hiddenSubscriberCount?: boolean;
    };
    contentDetails?: {
      relatedPlaylists?: { uploads?: string };
    };
  }>;
}

export interface YouTubeVideosListResponse {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      channelTitle?: string;
      publishedAt?: string;
      thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
    };
    statistics?: {
      viewCount?: string;
      likeCount?: string;
      commentCount?: string;
    };
    contentDetails?: { duration?: string };
  }>;
}
