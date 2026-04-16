import { z } from "zod";

function splitKeywords(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.flatMap((item) => {
      if (typeof item !== "string") return [];
      const t = item.trim();
      if (!t) return [];
      return t.includes(",")
        ? t.split(",").map((s) => s.trim()).filter(Boolean)
        : [t];
    });
  }
  if (typeof val === "string") {
    return val.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function asTrimmedString(v: unknown, fallback: string): string {
  if (typeof v === "string") {
    const t = v.trim();
    return t.length > 0 ? t : fallback;
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return String(v);
  }
  return fallback;
}

/**
 * Zod pipeline matching `NicheDefinition` for Topic Clarifier finalize.
 *
 * Groq `json_object` mode does not guarantee schema shape: models may omit keys, use
 * comma-separated strings for `keywords`, or wrap JSON in markdown. We accept loose input,
 * normalize in `.transform()`, then enforce bounds with `.pipe()`.
 */
export const nicheDefinitionSchema = z
  .object({
    category: z.unknown(),
    subCategory: z.unknown(),
    audienceProfile: z.unknown(),
    contentTone: z.unknown(),
    competitiveLandscapeSummary: z.unknown(),
    keywords: z.unknown().optional(),
  })
  .transform((raw) => {
    const category = asTrimmedString(raw.category, "general");
    const subCategory = asTrimmedString(raw.subCategory, "mixed content");
    const audienceProfile = asTrimmedString(
      raw.audienceProfile,
      "General audience — not specified in the conversation"
    );
    const contentTone = asTrimmedString(raw.contentTone, "conversational");
    const competitiveLandscapeSummary = asTrimmedString(
      raw.competitiveLandscapeSummary,
      "Competitive landscape not discussed in detail; infer cautiously from the niche."
    );

    let keywords = splitKeywords(raw.keywords);
    if (keywords.length === 0) {
      const seed = `${category} ${subCategory}`.toLowerCase();
      keywords = seed
        .split(/\s+/)
        .map((w) => w.replace(/[^a-z0-9-]/gi, ""))
        .filter((w) => w.length > 2);
    }
    if (keywords.length === 0) {
      keywords = [category.toLowerCase(), subCategory.toLowerCase()].filter((w) => w.length > 1);
    }
    if (keywords.length === 0) {
      keywords = ["niche"];
    }

    return {
      category,
      subCategory,
      audienceProfile,
      contentTone,
      competitiveLandscapeSummary,
      keywords: [...new Set(keywords)].slice(0, 16),
    };
  })
  .pipe(
    z.object({
      category: z.string().min(1).max(200),
      subCategory: z.string().min(1).max(200),
      audienceProfile: z.string().min(1).max(800),
      contentTone: z.string().min(1).max(300),
      competitiveLandscapeSummary: z.string().min(1).max(2000),
      keywords: z.array(z.string().min(1).max(80)).min(1).max(20),
    })
  );

export type NicheDefinitionGenerated = z.infer<typeof nicheDefinitionSchema>;
