import type { NicheDefinition } from "@/lib/agents/types";

/**
 * Build a compact search query for YouTube search.list from niche metadata.
 */
export function buildNicheSearchQuery(definition: NicheDefinition): string {
  const parts = [
    ...definition.keywords.slice(0, 5),
    definition.category,
    definition.subCategory,
  ]
    .map((s) => s.trim())
    .filter(Boolean);
  const unique = [...new Set(parts)];
  const q = unique.join(" ").trim();
  return q.length > 80 ? q.slice(0, 80) : q;
}
