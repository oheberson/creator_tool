import { runVideoSuggester } from "@/lib/agents/video-suggester";
import type { NicheResearchReport } from "@/lib/agents/types";

export const maxDuration = 120;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const report = (body as { report?: NicheResearchReport }).report;
  if (!report || typeof report !== "object") {
    return Response.json({ error: "report is required" }, { status: 400 });
  }

  if (!Array.isArray(report.topChannels) || report.topChannels.length === 0) {
    return Response.json({ error: "report.topChannels must be a non-empty array" }, { status: 400 });
  }

  try {
    const output = await runVideoSuggester({ report });
    return Response.json(output);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[api/agents/video-suggester]", e);
    return Response.json({ error: message }, { status: 500 });
  }
}
