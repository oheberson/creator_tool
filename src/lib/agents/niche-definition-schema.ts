import { z } from "zod";

/**
 * Zod schema matching `NicheDefinition` — used with `generateObject` for Topic Clarifier finalize.
 */
export const nicheDefinitionSchema = z.object({
  category: z.string().describe("Broad content category (e.g. sports, tech, news)"),
  subCategory: z
    .string()
    .describe("Specific angle or format within the category (e.g. NBA betting breakdowns)"),
  audienceProfile: z
    .string()
    .describe("Who the content is for — age range, interests, viewing intent"),
  contentTone: z
    .string()
    .describe("Voice and style (e.g. analytical, casual, opinionated)"),
  competitiveLandscapeSummary: z
    .string()
    .describe("One short paragraph on how crowded this niche is and what stands out"),
  keywords: z
    .array(z.string())
    .min(1)
    .describe("5–12 searchable keywords or phrases for this niche"),
});

export type NicheDefinitionGenerated = z.infer<typeof nicheDefinitionSchema>;
