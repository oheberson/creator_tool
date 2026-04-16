import { runNicheResearcher } from "@/lib/agents/niche-researcher";
import type { NicheDefinition } from "@/lib/agents/types";

export const maxDuration = 120;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const nicheDefinition = (body as { nicheDefinition?: NicheDefinition }).nicheDefinition;
  if (!nicheDefinition || typeof nicheDefinition !== "object") {
    return Response.json({ error: "nicheDefinition is required" }, { status: 400 });
  }

  const required: (keyof NicheDefinition)[] = [
    "category",
    "subCategory",
    "audienceProfile",
    "contentTone",
    "competitiveLandscapeSummary",
    "keywords",
  ];
  for (const key of required) {
    const v = nicheDefinition[key];
    if (key === "keywords") {
      if (!Array.isArray(v) || v.length === 0) {
        return Response.json({ error: "nicheDefinition.keywords must be a non-empty array" }, { status: 400 });
      }
    } else if (typeof v !== "string" || !String(v).trim()) {
      return Response.json({ error: `nicheDefinition.${key} is required` }, { status: 400 });
    }
  }

  try {
    const output = await runNicheResearcher({ nicheDefinition });
    return Response.json(output);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[api/agents/niche-researcher]", e);
    return Response.json({ error: message }, { status: 500 });
  }
}
