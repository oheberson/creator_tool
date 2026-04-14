import { streamText } from "ai";
import type { ClarifierMessage } from "@/lib/agents/types";
import {
  getGroqProvider,
  TOPIC_CLARIFIER_CHAT_MODEL,
} from "@/lib/ai/model";
import { TOPIC_CLARIFIER_CHAT_SYSTEM } from "@/lib/agents/topic-clarifier-prompts";

export const maxDuration = 60;

interface Body {
  messages: ClarifierMessage[];
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json(
      { error: "messages must be a non-empty array" },
      { status: 400 }
    );
  }

  const last = messages[messages.length - 1];
  if (last.role !== "user") {
    return Response.json(
      { error: "Last message must be from the user" },
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
    const groq = getGroqProvider();
    const result = streamText({
      model: groq(TOPIC_CLARIFIER_CHAT_MODEL),
      system: TOPIC_CLARIFIER_CHAT_SYSTEM,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    return result.toTextStreamResponse();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("GROQ_API_KEY")) {
      return Response.json({ error: message }, { status: 503 });
    }
    console.error("[topic-clarifier/chat]", e);
    return Response.json({ error: message }, { status: 500 });
  }
}
