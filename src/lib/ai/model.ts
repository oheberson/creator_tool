import "server-only";
import { createGroq } from "@ai-sdk/groq";

/**
 * Server-only Groq client for Vercel AI SDK.
 * Reads GROQ_API_KEY from the environment (set in .env.local for dev, Vercel dashboard for prod).
 */
function requireGroqApiKey(): string {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to .env.local (local) or Vercel project settings (deployed)."
    );
  }
  return key;
}

let cachedProvider: ReturnType<typeof createGroq> | null = null;

/**
 * Lazily creates the Groq provider so missing keys fail at request time, not at import time.
 */
export function getGroqProvider() {
  if (!cachedProvider) {
    cachedProvider = createGroq({ apiKey: requireGroqApiKey() });
  }
  return cachedProvider;
}

/** Default chat model for Topic Clarifier (fast dialogue + structured follow-ups). */
export const TOPIC_CLARIFIER_CHAT_MODEL = "llama-3.3-70b-versatile" as const;

/** Model used to extract NicheDefinition JSON from the conversation. */
export const TOPIC_CLARIFIER_FINALIZE_MODEL = "llama-3.3-70b-versatile" as const;
