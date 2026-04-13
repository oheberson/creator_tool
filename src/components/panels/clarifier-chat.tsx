"use client";

import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePipelineStore } from "@/lib/store/pipeline-store";
import { readTextStream } from "@/lib/clarifier-stream";

export function ClarifierChat() {
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeProject = usePipelineStore((s) => {
    const id = s.activeProjectId;
    return id ? s.projects.find((p) => p.id === id) : undefined;
  });
  const clarifier = activeProject?.pipeline.topicClarifier;
  const nodeStatus = clarifier?.status ?? "waiting";
  const conversation = clarifier?.output?.conversation ?? [];
  const nicheDefinition = clarifier?.output?.nicheDefinition ?? null;
  const clarifierError = clarifier?.error;

  const appendUser = usePipelineStore((s) => s.appendClarifierUserMessage);
  const appendAssistant = usePipelineStore((s) => s.appendClarifierAssistantMessage);
  const setRunning = usePipelineStore((s) => s.setTopicClarifierRunning);
  const setError = usePipelineStore((s) => s.setTopicClarifierError);
  const finalize = usePipelineStore((s) => s.finalizeTopicClarifier);
  const runRemaining = usePipelineStore((s) => s.runRemainingPipeline);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.length, streamingText]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || nodeStatus === "running") return;
    setInput("");
    setError(null);
    appendUser(trimmed);

    const messages = usePipelineStore.getState().getClarifierConversation();
    setRunning(true);
    setStreamingText("");

    try {
      const res = await fetch("/api/agents/topic-clarifier/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error ?? `Chat request failed (${res.status})`);
      }

      const text = await readTextStream(res.body, (acc) => setStreamingText(acc));
      setStreamingText("");
      if (text.trim()) {
        appendAssistant(text.trim());
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Chat failed";
      setError(msg);
    } finally {
      setRunning(false);
    }
  };

  const handleFinalize = async () => {
    setError(null);
    await finalize();
  };

  const handleContinuePipeline = async () => {
    await runRemaining();
  };

  const isWaiting = nodeStatus === "waiting";
  const isRunning = nodeStatus === "running";
  const isComplete = nodeStatus === "complete";
  const canFinalize =
    !isComplete &&
    !isRunning &&
    conversation.length >= 2 &&
    conversation.some((m) => m.role === "assistant");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-3 py-2">
        <h3 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
          Topic Clarifier
        </h3>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-3">
        <div className="flex flex-col gap-2 pb-2">
          {isWaiting && conversation.length === 0 && !streamingText && (
            <div className="rounded border border-border/40 bg-background/50 p-2">
              <p className="text-[11px] leading-relaxed text-muted-foreground/70">
                What are you interested in creating? Type your idea below. The
                coach will ask short follow-ups until you are ready to lock in a
                niche.
              </p>
            </div>
          )}

          {conversation.map((msg, i) => (
            <div
              key={i}
              className={`rounded px-2 py-1.5 text-[11px] leading-relaxed ${
                msg.role === "user"
                  ? "ml-4 bg-foreground/10 text-foreground"
                  : "mr-4 border border-border/30 bg-background/50 text-muted-foreground"
              }`}
            >
              {msg.content}
            </div>
          ))}

          {streamingText ? (
            <div className="mr-4 rounded border border-dashed border-border/50 bg-background/30 px-2 py-1.5 text-[11px] leading-relaxed text-muted-foreground">
              {streamingText}
              <span className="ml-0.5 inline-block h-2 w-0.5 animate-pulse bg-muted-foreground" />
            </div>
          ) : null}

          {clarifierError ? (
            <div className="rounded border border-red-500/30 bg-red-500/10 p-2 text-[10px] text-red-200">
              {clarifierError}
            </div>
          ) : null}

          {isComplete && nicheDefinition && (
            <>
              <div className="rounded border border-green-500/20 bg-green-500/5 p-2">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-green-400/80">
                  Niche locked in
                </p>
                <div className="space-y-0.5 text-[10px] text-muted-foreground">
                  <p>
                    <span className="text-foreground/70">Category:</span>{" "}
                    {nicheDefinition.category}
                  </p>
                  <p>
                    <span className="text-foreground/70">Focus:</span>{" "}
                    {nicheDefinition.subCategory}
                  </p>
                  <p>
                    <span className="text-foreground/70">Tone:</span>{" "}
                    {nicheDefinition.contentTone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleContinuePipeline}
                  className="mt-2 w-full rounded bg-foreground/10 px-2 py-1 text-[10px] font-medium text-foreground transition-colors hover:bg-foreground/15"
                >
                  Continue to Research →
                </button>
              </div>
              <details className="rounded border border-border/40 bg-background/40 p-2">
                <summary className="cursor-pointer text-[10px] font-medium text-muted-foreground">
                  Pipeline output JSON (NicheDefinition)
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-[9px] text-muted-foreground">
                  {JSON.stringify(nicheDefinition, null, 2)}
                </pre>
              </details>
            </>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {!isComplete && (
        <div className="border-t border-border/40">
          {canFinalize ? (
            <div className="p-2">
              <button
                type="button"
                onClick={handleFinalize}
                disabled={isRunning}
                className="w-full rounded border border-green-500/40 bg-green-500/10 px-2 py-1.5 text-[10px] font-medium text-green-200 transition-colors hover:bg-green-500/15 disabled:opacity-40"
              >
                Lock in niche (generate JSON for pipeline)
              </button>
              <p className="mt-1 text-center text-[9px] text-muted-foreground/60">
                When the conversation reflects your niche, confirm here. You can
                keep chatting above if you need more refinement.
              </p>
            </div>
          ) : null}
          <form onSubmit={handleSubmit} className="p-2">
            <div className="flex gap-1.5">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isRunning
                    ? "Waiting for reply..."
                    : "Reply to the coach..."
                }
                disabled={isRunning}
                className="flex-1 rounded border border-border/40 bg-background/50 px-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground/40 focus:border-foreground/20 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isRunning || !input.trim()}
                className="rounded bg-foreground/10 px-2 py-1 text-[10px] font-medium text-foreground transition-colors hover:bg-foreground/15 disabled:opacity-30"
              >
                {isRunning ? "..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
