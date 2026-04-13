import { generateObject } from "ai";
import type { ClarifierMessage, NicheDefinition } from "@/lib/agents/types";
import {
  getOpenAIProvider,
  TOPIC_CLARIFIER_FINALIZE_MODEL,
} from "@/lib/ai/model";
import { nicheDefinitionSchema } from "@/lib/agents/niche-definition-schema";
import { TOPIC_CLARIFIER_FINALIZE_SYSTEM } from "@/lib/agents/topic-clarifier-prompts";

export const maxDuration = 60;

interface Body {
  messages: ClarifierMessage[];
}

function formatTranscript(messages: ClarifierMessage[]): string {
  return messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length < 2) {
    return Response.json(
      { error: "Need at least one user and one assistant message to finalize" },
      { status: 400 }
    );
  }

  for (const m of messages) {
    if (m.role !== "user" && m.role !== "assistant") {
      return Response.json({ error: "Invalid message role" }, { status: 400 });
    }
    if (typeof m.content !== "string" || !m.content.trim()) {
      return Response.json({ error: "Invalid message content" }, { status: 400 });
    }
  }

  try {
    const openai = getOpenAIProvider();
    const { object } = await generateObject({
      model: openai(TOPIC_CLARIFIER_FINALIZE_MODEL),
      schema: nicheDefinitionSchema,
      system: TOPIC_CLARIFIER_FINALIZE_SYSTEM,
      prompt: `Here is the full conversation. Produce the niche definition JSON.\n\n${formatTranscript(messages)}`,
    });

    const nicheDefinition: NicheDefinition = {
      category: object.category,
      subCategory: object.subCategory,
      audienceProfile: object.audienceProfile,
      contentTone: object.contentTone,
      competitiveLandscapeSummary: object.competitiveLandscapeSummary,
      keywords: object.keywords,
    };

    console.log(
      "[topic-clarifier/finalize] NicheDefinition (next pipeline input):\n",
      JSON.stringify(nicheDefinition, null, 2)
    );

    return Response.json({ nicheDefinition });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("OPENAI_API_KEY")) {
      return Response.json({ error: message }, { status: 503 });
    }
    console.error("[topic-clarifier/finalize]", e);
    return Response.json({ error: message }, { status: 500 });
  }
}
