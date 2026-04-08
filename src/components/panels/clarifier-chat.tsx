"use client";

import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePipelineStore } from "@/lib/store/pipeline-store";

export function ClarifierChat() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeProject = usePipelineStore((s) => {
    const id = s.activeProjectId;
    return id ? s.projects.find((p) => p.id === id) : undefined;
  });
  const clarifier = activeProject?.pipeline.topicClarifier;
  const nodeStatus = clarifier?.status ?? "waiting";
  const conversation = clarifier?.output?.conversation ?? [];
  const nicheDefinition = clarifier?.output?.nicheDefinition ?? null;

  const startClarifier = usePipelineStore((s) => s.startTopicClarifier);
  const runRemaining = usePipelineStore((s) => s.runRemainingPipeline);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || nodeStatus === "running") return;
    setInput("");
    await startClarifier(trimmed);
  };

  const handleContinuePipeline = async () => {
    await runRemaining();
  };

  const isWaiting = nodeStatus === "waiting";
  const isRunning = nodeStatus === "running";
  const isComplete = nodeStatus === "complete";

  return (
    <div className="flex h-full flex-col">
      <div className="px-3 py-2">
        <h3 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
          Topic Clarifier
        </h3>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="flex flex-col gap-2 pb-2">
          {isWaiting && conversation.length === 0 && (
            <div className="rounded border border-border/40 bg-background/50 p-2">
              <p className="text-[11px] leading-relaxed text-muted-foreground/70">
                What are you interested in creating? Type your idea below and
                the clarifier will help refine it into a specific niche.
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

          {isComplete && nicheDefinition && (
            <div className="rounded border border-green-500/20 bg-green-500/5 p-2">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-green-400/80">
                Niche Defined
              </p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p><span className="text-foreground/70">Category:</span> {nicheDefinition.category}</p>
                <p><span className="text-foreground/70">Focus:</span> {nicheDefinition.subCategory}</p>
                <p><span className="text-foreground/70">Tone:</span> {nicheDefinition.contentTone}</p>
              </div>
              <button
                onClick={handleContinuePipeline}
                className="mt-2 w-full rounded bg-foreground/10 px-2 py-1 text-[10px] font-medium text-foreground transition-colors hover:bg-foreground/15"
              >
                Continue to Research →
              </button>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {!isComplete && (
        <form onSubmit={handleSubmit} className="border-t border-border/40 p-2">
          <div className="flex gap-1.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isWaiting ? "e.g. sports videos, tech reviews..." : "Refining..."}
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
      )}
    </div>
  );
}
