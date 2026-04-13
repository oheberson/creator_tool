import "server-only";
import { createOpenAI } from "@ai-sdk/openai";

/**
 * Server-only OpenAI client for Vercel AI SDK.
 * Reads OPENAI_API_KEY from the environment (set in .env.local for dev, Vercel dashboard for prod).
 */
function requireOpenAIApiKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to .env.local (local) or Vercel project settings (deployed)."
    );
  }
  return key;
}

let cachedProvider: ReturnType<typeof createOpenAI> | null = null;

/**
 * Lazily creates the OpenAI provider so missing keys fail at request time, not at import time.
 */
export function getOpenAIProvider() {
  if (!cachedProvider) {
    cachedProvider = createOpenAI({ apiKey: requireOpenAIApiKey() });
  }
  return cachedProvider;
}

/** Default chat model for Topic Clarifier (fast, good for dialogue + structured follow-ups). */
export const TOPIC_CLARIFIER_CHAT_MODEL = "gpt-4o-mini" as const;

/** Model used to extract NicheDefinition JSON from the conversation. */
export const TOPIC_CLARIFIER_FINALIZE_MODEL = "gpt-4o-mini" as const;
