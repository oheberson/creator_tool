import { z } from "zod";

/** LLM-generated qualitative insights grounded in YouTube metadata we pass in. */
export const nicheResearchInsightsSchema = z.object({
  contentGaps: z
    .array(z.string().min(12))
    .min(2)
    .max(5)
    .describe("Plausible gaps in coverage for this niche, based only on the supplied data"),
  trendingSubTopics: z
    .array(z.string().min(4))
    .min(2)
    .max(6)
    .describe("Sub-topics or formats that appear frequently in the sample"),
});

export type NicheResearchInsights = z.infer<typeof nicheResearchInsightsSchema>;
