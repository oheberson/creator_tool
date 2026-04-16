import "server-only";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export function isYouTubeApiConfigured(): boolean {
  return Boolean(process.env.YOUTUBE_API_KEY?.trim());
}

export function requireYouTubeApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "YOUTUBE_API_KEY is not set. Add it to .env.local (local) or Vercel project settings (deployed)."
    );
  }
  return key;
}

export async function youTubeGet<T>(
  resourcePath: string,
  params: Record<string, string | number | undefined>
): Promise<T> {
  const url = new URL(`${YOUTUBE_API_BASE}/${resourcePath}`);
  url.searchParams.set("key", requireYouTubeApiKey());
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YouTube API ${resourcePath} failed (${res.status}): ${text.slice(0, 400)}`);
  }
  return res.json() as Promise<T>;
}
